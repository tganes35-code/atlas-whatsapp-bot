import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MessageSender, PaymentMethod } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { OpenAiProvider } from './providers/openai.provider';
import { MockAiProvider } from './providers/mock-ai.provider';
import { AiProvider, ChatMessage, ToolDefinition } from './interfaces/ai-provider.interface';
import { ProductsService } from '../products/products.service';
import { CartsService } from '../carts/carts.service';
import { OrdersService } from '../orders/orders.service';
import { CustomersService } from '../customers/customers.service';
import { ConversationsService } from '../conversations/conversations.service';
import { CompanyService } from '../company/company.service';

// ─── Estado de la sesión de conversación ─────────────────────
// Guarda en memoria el contexto de la conversación para la lógica de reglas
interface ConversationContext {
  lastProductsShown: any[];       // últimos productos mostrados al usuario
  lastProductDetail: any | null;  // último producto con detalle mostrado
  awaitingQuantity: boolean;      // esperando que el usuario diga cuántos quiere
  awaitingPaymentMethod: boolean; // esperando método de pago
  awaitingOrderConfirmation: boolean; // esperando confirmación del pedido
  awaitingAddress: boolean;       // esperando dirección de envío
  pendingOrderData: {
    paymentMethod?: PaymentMethod;
    shippingAddress?: string;
  };
}

const sessionContexts = new Map<string, ConversationContext>();

function getContext(conversationId: string): ConversationContext {
  if (!sessionContexts.has(conversationId)) {
    sessionContexts.set(conversationId, {
      lastProductsShown: [],
      lastProductDetail: null,
      awaitingQuantity: false,
      awaitingPaymentMethod: false,
      awaitingOrderConfirmation: false,
      awaitingAddress: false,
      pendingOrderData: {},
    });
  }
  return sessionContexts.get(conversationId)!;
}

// ─── Prompt del sistema para OpenAI ──────────────────────────
const SYSTEM_PROMPT = `Eres el asistente virtual de Atlas Demo Store. Hablas únicamente en español. Eres amable, claro y profesional.

REGLAS CRÍTICAS — NUNCA las violes:
1. JAMÁS inventes productos, precios, stock, pedidos ni información de la empresa.
2. SIEMPRE usa las herramientas para consultar datos reales de la base de datos.
3. Cuando el usuario pida ver productos, buscar algo o preguntar precios → usa searchProducts o getProductsByCategory.
4. Cuando el usuario quiera agregar al carrito → primero confirma qué producto y cuántos, luego usa addToCart con el productId exacto.
5. Cuando el usuario quiera ver su carrito → usa getCart.
6. Cuando el usuario quiera hacer un pedido → usa createOrder.
7. Cuando el usuario pida hablar con una persona → usa handoffToHuman.
8. Cuando el usuario pregunte por horarios, dirección, políticas → usa getCompanyInformation.
9. Responde siempre en español.
10. Usa emojis con moderación. Sé conciso pero amable.
11. Muestra precios en formato: $XX.XXX COP

FLUJO DE COMPRA:
- Usuario dice qué quiere → muestra productos con searchProducts
- Usuario elige uno → muestra detalle con getProduct
- Usuario dice cuántos quiere → agrega con addToCart
- Usuario quiere pagar → muestra carrito con getCart y pide método de pago
- Usuario confirma → crea pedido con createOrder`;

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly aiProvider: AiProvider;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly productsService: ProductsService,
    private readonly cartsService: CartsService,
    private readonly ordersService: OrdersService,
    private readonly customersService: CustomersService,
    private readonly conversationsService: ConversationsService,
    private readonly companyService: CompanyService,
    private readonly openAiProvider: OpenAiProvider,
    private readonly mockAiProvider: MockAiProvider,
  ) {
    const hasApiKey = !!this.config.get<string>('OPENAI_API_KEY');
    this.aiProvider = hasApiKey ? this.openAiProvider : this.mockAiProvider;
    this.logger.log(`Proveedor IA activo: ${hasApiKey ? 'OpenAI' : 'MockAI (sin API key)'}`);
  }

  getProviderName(): string {
    return this.config.get<string>('OPENAI_API_KEY') ? 'openai' : 'mock';
  }

  // ═══════════════════════════════════════════════════════════
  // PROCESADOR PRINCIPAL — Lógica primero, IA solo como fallback
  // ═══════════════════════════════════════════════════════════

  async processMessage(
    conversationId: string,
    customerId: string,
    userMessage: string,
  ): Promise<string> {
    const ctx = getContext(conversationId);
    const msg = userMessage.trim().toLowerCase();

    // ── 1. Saludo ──────────────────────────────────────────────
    if (this.isGreeting(msg)) {
      const customer = await this.customersService.findOne(customerId).catch(() => null);
      const name = customer?.name && !customer.name.startsWith('Cliente ')
        ? `, ${customer.name.split(' ')[0]}`
        : '';
      return `¡Hola${name}! 👋 Bienvenido a *Atlas Demo Store*.\n\nSoy tu asistente virtual. Puedo ayudarte a:\n\n🛍️ *Ver productos* — escribe "ver productos"\n🔎 *Buscar algo* — escribe el nombre del producto\n🛒 *Tu carrito* — escribe "mi carrito"\n📦 *Estado de pedido* — escribe "mis pedidos"\n👤 *Hablar con asesor* — escribe "asesor"\n\n¿En qué te puedo ayudar?`;
    }

    // ── 2. Human handoff ───────────────────────────────────────
    if (this.isHumanRequest(msg)) {
      await this.conversationsService.handoffToHuman(conversationId);
      return '🔔 Entendido. Te estoy conectando con un asesor.\n\nUn agente revisará tu conversación muy pronto. ¡Gracias por tu paciencia!';
    }

    // ── 3. Esperando método de pago ────────────────────────────
    if (ctx.awaitingPaymentMethod) {
      return await this.handlePaymentMethodResponse(msg, ctx, conversationId, customerId);
    }

    // ── 4. Esperando dirección — pero permitir comandos especiales ─
    if (ctx.awaitingAddress) {
      // Si el usuario pide ver carrito o cancelar en mitad del flujo, salimos
      if (this.isCartRequest(msg)) {
        ctx.awaitingAddress = false;
        ctx.pendingOrderData = {};
        const cart = await this.cartsService.getOrCreateActiveCart(customerId);
        return this.formatCart(cart);
      }
      if (msg.includes('cancelar') || msg.includes('cancel') || msg === 'no') {
        ctx.awaitingAddress = false;
        ctx.pendingOrderData = {};
        return '❌ Pedido cancelado. ¿En qué más te puedo ayudar?';
      }
      // Tomar el mensaje como dirección de entrega
      return await this.handleAddressResponse(userMessage.trim(), ctx, conversationId, customerId);
    }

    // ── 5. Esperando confirmación del pedido ───────────────────
    if (ctx.awaitingOrderConfirmation) {
      return await this.handleOrderConfirmation(msg, ctx, conversationId, customerId);
    }

    // ── 6. Esperando cantidad ──────────────────────────────────
    if (ctx.awaitingQuantity && ctx.lastProductDetail) {
      const qty = this.extractNumber(msg);
      if (qty && qty > 0) {
        return await this.addProductToCart(ctx.lastProductDetail, qty, ctx, conversationId, customerId);
      }
    }

    // ── 7. Selección de producto de la lista (número) ──────────
    if (ctx.lastProductsShown.length > 0) {
      const idx = this.extractProductIndex(msg, ctx.lastProductsShown.length);
      if (idx !== null) {
        const product = ctx.lastProductsShown[idx];
        ctx.lastProductDetail = product;
        ctx.awaitingQuantity = true;
        const detail = await this.productsService.findOne(product.id).catch(() => product);
        ctx.lastProductDetail = detail;
        return this.formatProductDetail(detail) + '\n\n¿Cuántas unidades deseas?';
      }
    }

    // ── 8. Ver / listar todos los productos ────────────────────
    if (this.isListProducts(msg)) {
      return await this.handleListProducts(ctx);
    }

    // ── 9. Ver carrito ─────────────────────────────────────────
    if (this.isCartRequest(msg)) {
      const cart = await this.cartsService.getOrCreateActiveCart(customerId);
      return this.formatCart(cart);
    }

    // ── 10. Hacer pedido / confirmar compra ────────────────────
    if (this.isOrderRequest(msg)) {
      return await this.handleStartOrder(ctx, conversationId, customerId);
    }

    // ── 11. Consultar estado de pedidos ────────────────────────
    if (this.isOrderStatusRequest(msg)) {
      return await this.handleOrderStatus(customerId);
    }

    // ── 12. Información de la empresa ─────────────────────────
    if (this.isCompanyInfoRequest(msg)) {
      const company = await this.companyService.getCompany();
      return this.formatCompanyInfo(company);
    }

    // ── 13. Despedida ──────────────────────────────────────────
    if (this.isFarewell(msg)) {
      return '¡Hasta luego! 👋 Fue un placer atenderte. Vuelve cuando quieras. 😊';
    }

    // ── 14. Búsqueda de producto (por texto) ───────────────────
    const searchQuery = this.extractSearchQuery(msg);
    if (searchQuery) {
      return await this.handleSearch(searchQuery, ctx);
    }

    // ── 15. Pregunta de precio ─────────────────────────────────
    if (this.isPriceQuestion(msg) && ctx.lastProductDetail) {
      const price = `$${Number(ctx.lastProductDetail.price).toLocaleString('es-CO')} COP`;
      return `💰 *${ctx.lastProductDetail.name}* cuesta *${price}*.\n\n¿Lo agrego a tu carrito?`;
    }

    if (this.isPriceQuestion(msg)) {
      return '¿Sobre qué producto te gustaría saber el precio? Escribe su nombre y te lo digo. 😊';
    }

    // ── 16. Agregar al carrito por texto ───────────────────────
    if (this.isAddToCart(msg) && ctx.lastProductDetail) {
      const qty = this.extractNumber(msg) || 1;
      return await this.addProductToCart(ctx.lastProductDetail, qty, ctx, conversationId, customerId);
    }

    // ── 17. Fallback — pasa a la IA ────────────────────────────
    return await this.callAI(conversationId, customerId, userMessage);
  }

  // ═══════════════════════════════════════════════════════════
  // MANEJADORES DE FLUJO
  // ═══════════════════════════════════════════════════════════

  private async handleListProducts(ctx: ConversationContext): Promise<string> {
    const { data } = await this.productsService.findAll({ active: true, limit: 8 });
    if (!data.length) return 'Por el momento no tenemos productos disponibles. 😔';
    ctx.lastProductsShown = data;
    ctx.awaitingQuantity = false;
    ctx.lastProductDetail = null;
    return this.formatProductList(data, '🛍️ Aquí tienes nuestro catálogo:');
  }

  private async handleSearch(query: string, ctx: ConversationContext): Promise<string> {
    const results = await this.productsService.searchForBot(query);
    if (!results.length) {
      return `No encontré productos con "${query}". 😔\n\nPuedes escribir "ver productos" para ver todo el catálogo.`;
    }
    if (results.length === 1) {
      ctx.lastProductDetail = results[0];
      ctx.lastProductsShown = results;
      ctx.awaitingQuantity = true;
      const detail = await this.productsService.findOne(results[0].id).catch(() => results[0]);
      ctx.lastProductDetail = detail;
      return this.formatProductDetail(detail) + '\n\n¿Cuántas unidades deseas?';
    }
    ctx.lastProductsShown = results;
    ctx.awaitingQuantity = false;
    ctx.lastProductDetail = null;
    return this.formatProductList(results, `🔎 Encontré ${results.length} productos:`);
  }

  private async addProductToCart(
    product: any,
    qty: number,
    ctx: ConversationContext,
    conversationId: string,
    customerId: string,
  ): Promise<string> {
    ctx.awaitingQuantity = false;
    try {
      const cart = await this.cartsService.addItem(customerId, {
        productId: product.id,
        quantity: qty,
      });
      const subtotal = `$${Number(cart.subtotal).toLocaleString('es-CO')} COP`;
      return `✅ ¡Listo! Agregué *${qty} x ${product.name}* a tu carrito.\n\n${this.formatCartSummary(cart)}\n\n¿Quieres seguir comprando o prefieres *confirmar tu pedido*?`;
    } catch (e: any) {
      return `❌ No pude agregar el producto: ${e.message}`;
    }
  }

  private async handleStartOrder(
    ctx: ConversationContext,
    conversationId: string,
    customerId: string,
  ): Promise<string> {
    const cart = await this.cartsService.getOrCreateActiveCart(customerId);
    if (!cart.items?.length) {
      return '🛒 Tu carrito está vacío. Primero agrega productos antes de hacer un pedido.';
    }
    const subtotal = Number(cart.subtotal);
    const total = subtotal + 10000;
    ctx.awaitingPaymentMethod = true;
    ctx.awaitingOrderConfirmation = false;
    return `🛒 *Resumen de tu pedido:*\n\n${this.formatCartLines(cart)}\n💰 Subtotal: $${subtotal.toLocaleString('es-CO')} COP\n🚚 Envío: $10.000 COP\n📦 *Total: $${total.toLocaleString('es-CO')} COP*\n\n¿Cómo deseas pagar?\n\n1️⃣ Efectivo\n2️⃣ Transferencia\n3️⃣ Pago contra entrega`;
  }

  private async handlePaymentMethodResponse(
    msg: string,
    ctx: ConversationContext,
    conversationId: string,
    customerId: string,
  ): Promise<string> {
    let method: PaymentMethod | null = null;

    if (msg.includes('1') || msg.includes('efectivo')) method = PaymentMethod.EFECTIVO;
    else if (msg.includes('2') || msg.includes('transferencia')) method = PaymentMethod.TRANSFERENCIA;
    else if (msg.includes('3') || msg.includes('contra entrega') || msg.includes('contraentrega') || msg.includes('entrega')) method = PaymentMethod.CONTRA_ENTREGA;

    if (!method) {
      return 'Por favor elige una opción:\n\n1️⃣ Efectivo\n2️⃣ Transferencia\n3️⃣ Pago contra entrega';
    }

    ctx.awaitingPaymentMethod = false;
    ctx.pendingOrderData.paymentMethod = method;

    // Verificar si el cliente tiene dirección guardada
    const customer = await this.customersService.findOne(customerId).catch(() => null);
    if (customer?.address) {
      ctx.awaitingOrderConfirmation = true;
      ctx.pendingOrderData.shippingAddress = customer.address;
      const cart = await this.cartsService.getOrCreateActiveCart(customerId);
      const total = Number(cart.subtotal) + 10000;
      return `📍 Dirección registrada: *${customer.address}*\n💳 Pago: *${method}*\n📦 Total: *$${total.toLocaleString('es-CO')} COP*\n\n¿Confirmas el pedido? (escribe *sí* para confirmar o dame una dirección diferente)`;
    }

    ctx.awaitingAddress = true;
    return `💳 Método de pago: *${method}*\n\nAhora necesito la dirección de entrega. ¿A dónde te enviamos?`;
  }

  private async handleAddressResponse(
    address: string,
    ctx: ConversationContext,
    conversationId: string,
    customerId: string,
  ): Promise<string> {
    ctx.awaitingAddress = false;
    ctx.pendingOrderData.shippingAddress = address;
    ctx.awaitingOrderConfirmation = true;

    const cart = await this.cartsService.getOrCreateActiveCart(customerId);
    const total = Number(cart.subtotal) + 10000;

    return `📍 Dirección: *${address}*\n💳 Pago: *${ctx.pendingOrderData.paymentMethod}*\n📦 Total: *$${total.toLocaleString('es-CO')} COP*\n\n¿Confirmas el pedido? (escribe *sí* para confirmar o *no* para cancelar)`;
  }

  private async handleOrderConfirmation(
    msg: string,
    ctx: ConversationContext,
    conversationId: string,
    customerId: string,
  ): Promise<string> {
    const isYes = msg.includes('sí') || msg.includes('si') || msg.includes('confirmo') || msg.includes('confirmar') || msg.includes('ok') || msg.includes('dale') || msg.includes('listo');
    const isNo = msg.includes('no') || msg.includes('cancelar') || msg.includes('cancel');

    if (isNo) {
      ctx.awaitingOrderConfirmation = false;
      ctx.pendingOrderData = {};
      return '❌ Pedido cancelado. Tu carrito sigue intacto. ¿En qué más te puedo ayudar?';
    }

    if (!isYes) {
      return '¿Confirmas el pedido? Escribe *sí* para confirmar o *no* para cancelar.';
    }

    ctx.awaitingOrderConfirmation = false;

    try {
      const order = await this.ordersService.createFromCart({
        customerId,
        paymentMethod: ctx.pendingOrderData.paymentMethod ?? PaymentMethod.EFECTIVO,
        shippingAddress: ctx.pendingOrderData.shippingAddress ?? '',
      });
      ctx.pendingOrderData = {};

      const total = `$${Number(order.total).toLocaleString('es-CO')} COP`;
      const shortId = order.id.slice(-8).toUpperCase();
      return `🎉 ¡Pedido creado exitosamente!\n\n📋 *Número de pedido:* #${shortId}\n💰 *Total:* ${total}\n💳 *Pago:* ${order.paymentMethod}\n⏳ *Estado:* Pendiente de confirmación\n\nTe notificaremos cuando tu pedido sea confirmado. ¡Gracias por tu compra! 😊`;
    } catch (e: any) {
      ctx.pendingOrderData = {};
      return `❌ No pude crear el pedido: ${e.message}\n\nPor favor intenta de nuevo o escribe *asesor* para recibir ayuda.`;
    }
  }

  private async handleOrderStatus(customerId: string): Promise<string> {
    try {
      const { data } = await this.ordersService.findAll({ customerId, limit: 3 });
      if (!data.length) {
        return '📦 No encontré pedidos registrados para tu número.\n\n¿Quieres hacer tu primer pedido? 😊';
      }

      const statusMap: Record<string, string> = {
        PENDING: '⏳ Pendiente',
        CONFIRMED: '✅ Confirmado',
        PREPARING: '🔧 En preparación',
        READY: '📦 Listo para envío',
        SHIPPED: '🚚 En camino',
        DELIVERED: '✅ Entregado',
        CANCELLED: '❌ Cancelado',
      };

      const lines = data.map((o) => {
        const status = statusMap[o.status] ?? o.status;
        const total = `$${Number(o.total).toLocaleString('es-CO')} COP`;
        const shortId = o.id.slice(-8).toUpperCase();
        return `📋 *#${shortId}* — ${status} — ${total}`;
      });

      return `Aquí están tus últimos pedidos:\n\n${lines.join('\n')}\n\n¿Necesitas más información sobre alguno?`;
    } catch {
      return '❌ No pude consultar tus pedidos. Intenta de nuevo más tarde.';
    }
  }

  // ═══════════════════════════════════════════════════════════
  // FALLBACK — IA (OpenAI o MockAI) para todo lo que no cubrió la lógica
  // ═══════════════════════════════════════════════════════════

  private async callAI(
    conversationId: string,
    customerId: string,
    userMessage: string,
  ): Promise<string> {
    this.logger.debug(`Delegando a IA: "${userMessage.substring(0, 50)}"`);

    // Historial de los últimos 12 mensajes para contexto
    const history = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: 12,
    });
    history.reverse();

    const chatMessages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.map((m) => ({
        role: (m.sender === MessageSender.CUSTOMER ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: userMessage },
    ];

    const aiResponse = await this.aiProvider.chat(chatMessages, this.getToolDefinitions());

    // Si la IA devuelve tool calls, ejecutarlos y hacer segunda llamada para respuesta natural
    if (aiResponse.toolCalls?.length) {
      const context = { conversationId, customerId };
      const toolResults: { name: string; result: string }[] = [];

      for (const toolCall of aiResponse.toolCalls) {
        const result = await this.executeTool(toolCall.name, toolCall.arguments, context);
        toolResults.push({ name: toolCall.name, result });
      }

      // Si solo una herramienta y es handoffToHuman, retornar directo
      if (toolResults.length === 1 && aiResponse.toolCalls[0].name === 'handoffToHuman') {
        return toolResults[0].result;
      }

      // Con OpenAI: hacer segunda llamada para que la IA redacte la respuesta final
      if (this.aiProvider === this.openAiProvider) {
        const messagesWithToolResults: ChatMessage[] = [
          ...chatMessages,
          { role: 'assistant', content: `Consulté la información: ${toolResults.map(t => t.result).join(' | ')}` },
          { role: 'user', content: 'Basándote en esa información, responde al cliente de forma amable y clara en español.' },
        ];
        const finalResponse = await this.aiProvider.chat(messagesWithToolResults, []);
        if (finalResponse.content) return finalResponse.content;
      }

      // Con MockAI o si OpenAI no genera nada: retornar resultado de la herramienta
      return toolResults.map(t => t.result).join('\n\n');
    }

    return aiResponse.content || 'Lo siento, no entendí tu mensaje. ¿Puedes ser más específico? 😊';
  }

  // ═══════════════════════════════════════════════════════════
  // EJECUTOR DE HERRAMIENTAS (usado por la IA)
  // ═══════════════════════════════════════════════════════════

  private async executeTool(
    toolName: string,
    args: Record<string, any>,
    context: { conversationId: string; customerId: string },
  ): Promise<string> {
    this.logger.log(`🔧 Tool: ${toolName}`, JSON.stringify(args));
    const ctx = getContext(context.conversationId);

    try {
      switch (toolName) {
        case 'searchProducts': {
          const results = await this.productsService.searchForBot(args.query ?? '');
          if (!results.length) return 'No encontré productos que coincidan.';
          ctx.lastProductsShown = results;
          return this.formatProductList(results, '🔎 Productos encontrados:');
        }

        case 'getProduct': {
          const product = await this.productsService.findOne(args.productId);
          ctx.lastProductDetail = product;
          ctx.awaitingQuantity = true;
          return this.formatProductDetail(product);
        }

        case 'getProductsByCategory': {
          const { data } = await this.productsService.findAll({
            categoryId: args.categoryId,
            search: args.categoryName,
            active: true,
          });
          if (!data.length) return 'No hay productos en esa categoría.';
          ctx.lastProductsShown = data;
          return this.formatProductList(data, '🛍️ Productos:');
        }

        case 'getCart': {
          const cart = await this.cartsService.getOrCreateActiveCart(context.customerId);
          return this.formatCart(cart);
        }

        case 'addToCart': {
          if (!args.productId) return 'Necesito el ID del producto.';
          const cart = await this.cartsService.addItem(context.customerId, {
            productId: args.productId,
            variantId: args.variantId,
            quantity: args.quantity ?? 1,
          });
          return `✅ Producto agregado al carrito.\n\n${this.formatCartSummary(cart)}`;
        }

        case 'removeFromCart': {
          const cart = await this.cartsService.removeItem(context.customerId, args.itemId);
          return `✅ Producto eliminado.\n\n${this.formatCart(cart)}`;
        }

        case 'clearCart': {
          await this.cartsService.clearCart(context.customerId);
          return '✅ Carrito vaciado.';
        }

        case 'createOrder': {
          const cart = await this.cartsService.getOrCreateActiveCart(context.customerId);
          if (!cart.items?.length) return 'Tu carrito está vacío.';
          const customer = await this.customersService.findOne(context.customerId);
          const order = await this.ordersService.createFromCart({
            customerId: context.customerId,
            paymentMethod: (args.paymentMethod as PaymentMethod) ?? PaymentMethod.EFECTIVO,
            shippingAddress: args.shippingAddress ?? customer.address ?? '',
          });
          return this.formatOrder(order);
        }

        case 'getOrderStatus': {
          const { data } = await this.ordersService.findAll({ customerId: context.customerId, limit: 1 });
          if (!data.length) return 'No tienes pedidos registrados.';
          const order = await this.ordersService.findOne(data[0].id);
          return this.formatOrder(order);
        }

        case 'handoffToHuman': {
          await this.conversationsService.handoffToHuman(context.conversationId);
          return '🔔 Te estamos conectando con un asesor. Por favor espera, un agente te atenderá pronto.';
        }

        case 'getCompanyInformation': {
          const company = await this.companyService.getCompany();
          return this.formatCompanyInfo(company);
        }

        case 'getCustomer': {
          const customer = await this.customersService.findOne(context.customerId);
          return `👤 *${customer.name}* | 📱 ${customer.phone} | 📍 ${customer.city ?? 'Sin ciudad'}`;
        }

        default:
          return `Herramienta "${toolName}" no disponible.`;
      }
    } catch (error: any) {
      this.logger.error(`Error en tool ${toolName}:`, error.message);
      return `No pude completar esa acción: ${error.message}`;
    }
  }

  // ═══════════════════════════════════════════════════════════
  // DETECTORES DE INTENCIÓN
  // ═══════════════════════════════════════════════════════════

  private isGreeting(msg: string): boolean {
    return /^(hola|buenas?|buenos?\s*(d[ií]as?|tardes?|noches?)|hey|hi|hello|saludos?|buen\s*d[ií]a)[\s!.]*$/.test(msg)
      || (msg.length < 20 && /\b(hola|hello|hey)\b/.test(msg));
  }

  private isHumanRequest(msg: string): boolean {
    return /\b(asesor|agente|humano|persona|hablar\s+con\s+alguien|quiero\s+hablar\s+con|necesito\s+ayuda\s+de\s+una\s+persona)\b/.test(msg);
  }

  private isListProducts(msg: string): boolean {
    return /\b(ver\s+productos?|cat[aá]logo|qu[eé]\s+(tienen?|hay|tienes?)|mostrar?\s+productos?|lista\s+de\s+productos?|todos?\s+los\s+productos?)\b/.test(msg);
  }

  private isCartRequest(msg: string): boolean {
    return /\b(carrito|mi\s+carrito|qu[eé]\s+tengo|ver\s+carrito|mostrar\s+carrito)\b/.test(msg);
  }

  private isOrderRequest(msg: string): boolean {
    return /\b(quiero\s+(comprar|pedir|hacer\s+pedido)|confirmar\s+(compra|pedido)|proceder|finalizar\s+(compra|pedido)|hacer\s+pedido|ordenar|checkout)\b/.test(msg);
  }

  private isOrderStatusRequest(msg: string): boolean {
    return /\b(mis?\s+pedidos?|estado\s+del?\s+pedido|d[oó]nde\s+est[aá]|seguimiento|consultar?\s+pedido)\b/.test(msg);
  }

  private isCompanyInfoRequest(msg: string): boolean {
    return /\b(horario|direcci[oó]n|tel[eé]fono|informaci[oó]n|pol[ií]tica|devoluci[oó]n|env[ií]o|garantía|contacto|ubicaci[oó]n)\b/.test(msg);
  }

  private isFarewell(msg: string): boolean {
    return /\b(hasta\s+luego|adi[oó]s|bye|chao|chau|gracias|nos\s+vemos)\b/.test(msg);
  }

  private isPriceQuestion(msg: string): boolean {
    return /\b(precio|cu[aá]nto\s+(cuesta|vale|es|cobran)|valor|costo)\b/.test(msg);
  }

  private isAddToCart(msg: string): boolean {
    return /\b(agregar?|a[ñn]adir?|quiero\s+(\d+|uno?|dos?)|me\s+llevo|lo\s+quiero|la\s+quiero|quiero\s+ese|quiero\s+esa)\b/.test(msg);
  }

  private extractSearchQuery(msg: string): string | null {
    // Lista de términos de producto conocidos
    const productTerms = [
      'camiseta', 'camisetas', 'gorra', 'gorras', 'chaqueta', 'chaquetas',
      'pantalon', 'pantalón', 'pantalones', 'ropa', 'camisa', 'camisas',
      'zapato', 'zapatos', 'tenis', 'saco', 'abrigo', 'falda',
    ];

    for (const term of productTerms) {
      if (msg.includes(term)) return term;
    }

    // Buscar patrón "buscar X" o "quiero X" o "tienen X"
    const patterns = [
      /\b(?:buscar?|busco|quiero\s+ver|tienes?|tienen?|hay)\s+(.+)/,
      /\b(?:necesito|busco)\s+(.+)/,
    ];
    for (const pattern of patterns) {
      const match = msg.match(pattern);
      if (match && match[1] && match[1].length > 2) {
        return match[1].trim();
      }
    }

    return null;
  }

  private extractNumber(msg: string): number | null {
    // Números escritos
    const words: Record<string, number> = {
      uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5,
      seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10,
    };
    for (const [word, num] of Object.entries(words)) {
      if (msg.includes(word)) return num;
    }
    const match = msg.match(/\b(\d+)\b/);
    return match ? parseInt(match[1]) : null;
  }

  private extractProductIndex(msg: string, maxCount: number): number | null {
    // "el 1", "número 2", "el primero", etc.
    const ordinals: Record<string, number> = {
      primero: 0, primera: 0, segundo: 1, segunda: 1,
      tercero: 2, tercera: 2, cuarto: 3, cuarta: 3, quinto: 4,
    };
    for (const [word, idx] of Object.entries(ordinals)) {
      if (msg.includes(word) && idx < maxCount) return idx;
    }
    const match = msg.match(/\b([1-9])\b/);
    if (match) {
      const idx = parseInt(match[1]) - 1;
      if (idx >= 0 && idx < maxCount) return idx;
    }
    return null;
  }

  // ═══════════════════════════════════════════════════════════
  // FORMATEADORES
  // ═══════════════════════════════════════════════════════════

  private formatProductList(products: any[], title: string): string {
    const lines = products.map((p, i) => {
      const price = `$${Number(p.price).toLocaleString('es-CO')} COP`;
      const stock = p.stock > 0 ? `${p.stock} disponibles` : '⚠️ Sin stock';
      const variants = p.variants?.length
        ? ` | Tallas/Colores: ${p.variants.map((v: any) => v.value).join(', ')}`
        : '';
      return `${i + 1}. *${p.name}* — ${price} | ${stock}${variants}`;
    });
    return `${title}\n\n${lines.join('\n')}\n\nEscribe el número del producto para ver más detalles o agregarlo al carrito.`;
  }

  private formatProductDetail(product: any): string {
    const price = `$${Number(product.price).toLocaleString('es-CO')} COP`;
    const stock = product.stock > 0 ? `${product.stock} unidades disponibles` : '⚠️ Sin stock';
    const variants = product.variants?.filter((v: any) => v.active)?.length
      ? `\n🏷️ *Variantes disponibles:*\n${product.variants.filter((v: any) => v.active).map((v: any) => `  • ${v.name}: ${v.value}${Number(v.priceModifier) > 0 ? ` (+$${Number(v.priceModifier).toLocaleString('es-CO')})` : ''}`).join('\n')}`
      : '';
    const desc = product.description ? `\n📝 ${product.description}\n` : '';

    return `📦 *${product.name}*${desc}\n💰 Precio: *${price}*\n📊 Stock: ${stock}${variants}`;
  }

  private formatCart(cart: any): string {
    if (!cart.items?.length) {
      return '🛒 Tu carrito está vacío.\n\nEscribe "ver productos" para empezar a comprar. 😊';
    }
    const lines = cart.items.map((item: any) => {
      const name = item.product?.name ?? 'Producto';
      const variant = item.variant ? ` (${item.variant.value})` : '';
      const subtotal = `$${Number(item.subtotal).toLocaleString('es-CO')}`;
      return `• ${name}${variant} x${item.quantity} = ${subtotal} COP`;
    });
    const subtotal = `$${Number(cart.subtotal).toLocaleString('es-CO')} COP`;
    const total = `$${(Number(cart.subtotal) + 10000).toLocaleString('es-CO')} COP`;
    return `🛒 *Tu carrito:*\n\n${lines.join('\n')}\n\n💰 Subtotal: ${subtotal}\n🚚 Envío: $10.000 COP\n📦 *Total: ${total}*\n\n¿Quieres confirmar la compra? Escribe *"quiero comprar"*.`;
  }

  private formatCartSummary(cart: any): string {
    if (!cart.items?.length) return '🛒 Carrito vacío.';
    const count = cart.items.reduce((s: number, i: any) => s + i.quantity, 0);
    const subtotal = `$${Number(cart.subtotal).toLocaleString('es-CO')} COP`;
    return `🛒 *Carrito:* ${count} producto(s) | Subtotal: ${subtotal}`;
  }

  private formatCartLines(cart: any): string {
    return cart.items.map((item: any) => {
      const name = item.product?.name ?? 'Producto';
      const subtotal = `$${Number(item.subtotal).toLocaleString('es-CO')}`;
      return `• ${name} x${item.quantity} = ${subtotal} COP`;
    }).join('\n');
  }

  private formatOrder(order: any): string {
    const statusMap: Record<string, string> = {
      PENDING: '⏳ Pendiente', CONFIRMED: '✅ Confirmado',
      PREPARING: '🔧 En preparación', READY: '📦 Listo',
      SHIPPED: '🚚 En camino', DELIVERED: '✅ Entregado', CANCELLED: '❌ Cancelado',
    };
    const total = `$${Number(order.total).toLocaleString('es-CO')} COP`;
    const shortId = order.id.slice(-8).toUpperCase();
    return `📦 *Pedido #${shortId}*\n\nEstado: ${statusMap[order.status] ?? order.status}\nTotal: ${total}\nPago: ${order.paymentMethod}`;
  }

  private formatCompanyInfo(company: any): string {
    let info = `🏪 *${company.name}*\n`;
    if (company.description) info += `\n${company.description}\n`;
    if (company.phone) info += `\n📞 ${company.phone}`;
    if (company.email) info += `\n📧 ${company.email}`;
    if (company.address) info += `\n📍 ${company.address}`;

    let schedules: any = company.schedules;
    if (schedules) {
      try {
        if (typeof schedules === 'string') schedules = JSON.parse(schedules);
        info += '\n\n⏰ *Horarios:*';
        for (const [day, hours] of Object.entries(schedules)) {
          info += `\n• ${day}: ${hours}`;
        }
      } catch { info += `\n\n⏰ ${schedules}`; }
    }
    if (company.policies) info += `\n\n📋 *Políticas:*\n${company.policies}`;
    return info;
  }

  // ═══════════════════════════════════════════════════════════
  // TOOL DEFINITIONS PARA LA IA
  // ═══════════════════════════════════════════════════════════

  private getToolDefinitions(): ToolDefinition[] {
    return [
      {
        name: 'searchProducts',
        description: 'Buscar productos por nombre, descripción o categoría',
        parameters: {
          type: 'object',
          properties: { query: { type: 'string' } },
          required: [],
        },
      },
      {
        name: 'getProduct',
        description: 'Detalle completo de un producto por ID',
        parameters: {
          type: 'object',
          properties: { productId: { type: 'string' } },
          required: ['productId'],
        },
      },
      {
        name: 'getProductsByCategory',
        description: 'Listar productos por categoría',
        parameters: {
          type: 'object',
          properties: {
            categoryId: { type: 'string' },
            categoryName: { type: 'string' },
          },
          required: [],
        },
      },
      {
        name: 'getCart',
        description: 'Ver el carrito activo del cliente',
        parameters: { type: 'object', properties: {}, required: [] },
      },
      {
        name: 'addToCart',
        description: 'Agregar producto al carrito',
        parameters: {
          type: 'object',
          properties: {
            productId: { type: 'string' },
            variantId: { type: 'string' },
            quantity: { type: 'number', minimum: 1 },
          },
          required: ['productId', 'quantity'],
        },
      },
      {
        name: 'removeFromCart',
        description: 'Eliminar item del carrito',
        parameters: {
          type: 'object',
          properties: { itemId: { type: 'string' } },
          required: ['itemId'],
        },
      },
      {
        name: 'clearCart',
        description: 'Vaciar el carrito',
        parameters: { type: 'object', properties: {}, required: [] },
      },
      {
        name: 'createOrder',
        description: 'Crear pedido desde el carrito',
        parameters: {
          type: 'object',
          properties: {
            paymentMethod: { type: 'string', enum: ['EFECTIVO', 'TRANSFERENCIA', 'CONTRA_ENTREGA'] },
            shippingAddress: { type: 'string' },
          },
          required: [],
        },
      },
      {
        name: 'getOrderStatus',
        description: 'Consultar últimos pedidos del cliente',
        parameters: { type: 'object', properties: {}, required: [] },
      },
      {
        name: 'handoffToHuman',
        description: 'Transferir conversación a agente humano',
        parameters: { type: 'object', properties: {}, required: [] },
      },
      {
        name: 'getCompanyInformation',
        description: 'Información de la empresa: horarios, dirección, políticas',
        parameters: { type: 'object', properties: {}, required: [] },
      },
      {
        name: 'getCustomer',
        description: 'Información del cliente actual',
        parameters: { type: 'object', properties: {}, required: [] },
      },
    ];
  }
}
