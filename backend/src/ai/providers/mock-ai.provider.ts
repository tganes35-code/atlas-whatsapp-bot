import { Injectable, Logger } from '@nestjs/common';
import {
  AiProvider,
  AiResponse,
  ChatMessage,
  ToolDefinition,
  ToolCall,
} from '../interfaces/ai-provider.interface';

/**
 * MockAIProvider — se usa cuando no hay OPENAI_API_KEY configurada.
 * Implementa un sistema de reglas simple que permite probar TODO el flujo
 * del chatbot sin pagar API.
 */
@Injectable()
export class MockAiProvider implements AiProvider {
  private readonly logger = new Logger(MockAiProvider.name);

  isAvailable(): boolean {
    return true; // Siempre disponible
  }

  async chat(messages: ChatMessage[], tools?: ToolDefinition[]): Promise<AiResponse> {
    this.logger.debug('MockAI procesando mensaje...');

    const lastUserMessage = messages
      .filter((m) => m.role === 'user')
      .pop()?.content
      ?.toLowerCase() ?? '';

    // ─── Detección de intenciones ───────────────────────────────

    // Saludo
    if (this.matches(lastUserMessage, ['hola', 'buenas', 'buenos días', 'hey', 'hi', 'hello', 'buen día'])) {
      return this.response(
        '¡Hola! 👋 Bienvenido a *Atlas Demo Store*.\n\nPuedo ayudarte a:\n🛍️ Ver productos\n🔎 Buscar un producto\n🛒 Crear un pedido\n📦 Consultar un pedido\n👤 Hablar con un asesor\n\n¿En qué puedo ayudarte hoy?',
      );
    }

    // Human handoff
    if (this.matches(lastUserMessage, ['asesor', 'persona', 'humano', 'agente', 'hablar con alguien', 'quiero hablar con'])) {
      return this.responseWithTool('handoffToHuman', {});
    }

    // Ver carrito
    if (this.matches(lastUserMessage, ['carrito', 'mi carrito', 'qué tengo', 'que tengo', 'mi pedido actual'])) {
      return this.responseWithTool('getCart', {});
    }

    // Confirmar compra / crear pedido
    if (this.matches(lastUserMessage, ['quiero comprar', 'confirmar', 'proceder', 'finalizar', 'hacer pedido', 'ordenar'])) {
      return this.responseWithTool('createOrder', {});
    }

    // Consultar pedido existente
    if (this.matches(lastUserMessage, ['estado de mi pedido', 'mi pedido', 'donde está', 'dónde está', 'seguimiento'])) {
      return this.responseWithTool('getOrderStatus', {});
    }

    // Buscar productos
    const productSearchTerms = ['camiseta', 'gorra', 'chaqueta', 'pantalón', 'pantalon', 'ropa', 'productos', 'catálogo', 'catalogo', 'ver productos', 'qué tienen', 'que tienen'];
    const searchMatch = productSearchTerms.find((term) => lastUserMessage.includes(term));
    if (searchMatch) {
      const query = searchMatch === 'ropa' || searchMatch === 'productos' || searchMatch === 'catálogo' || searchMatch === 'catalogo' || searchMatch === 'ver productos' || searchMatch === 'qué tienen' || searchMatch === 'que tienen'
        ? ''
        : searchMatch;
      return this.responseWithTool('searchProducts', { query });
    }

    // Precio
    if (this.matches(lastUserMessage, ['precio', 'cuánto cuesta', 'cuanto cuesta', 'valor', 'costo', 'cuánto vale', 'cuanto vale'])) {
      return this.response(
        'Para consultarte el precio necesito saber qué producto te interesa. ¿Puedes decirme el nombre del producto? 😊',
      );
    }

    // Agregar al carrito (número + producto)
    const addToCartMatch = lastUserMessage.match(/quiero\s+(\d+)|(\d+)\s+unidades?|agregar?\s+(\d+)|comprar\s+(\d+)/);
    if (addToCartMatch || this.matches(lastUserMessage, ['agregar', 'añadir', 'quiero uno', 'quiero una', 'lo quiero', 'la quiero', 'quiero comprar', 'me llevo'])) {
      const quantityMatch = lastUserMessage.match(/\d+/);
      const quantity = quantityMatch ? parseInt(quantityMatch[0]) : 1;
      return this.responseWithTool('addToCart', { quantity });
    }

    // Despedida
    if (this.matches(lastUserMessage, ['gracias', 'hasta luego', 'adiós', 'adios', 'bye', 'chao'])) {
      return this.response(
        '¡Hasta luego! 👋 Fue un placer atenderte. Si necesitas algo más, aquí estaré. ¡Que tengas un excelente día! 😊',
      );
    }

    // Información de la empresa
    if (this.matches(lastUserMessage, ['horario', 'dirección', 'dirección', 'teléfono', 'telefono', 'información', 'información', 'política', 'devolución'])) {
      return this.responseWithTool('getCompanyInformation', {});
    }

    // Respuesta genérica
    return this.response(
      'Entiendo tu consulta. 😊 Puedo ayudarte con:\n\n🛍️ *Ver productos* - dime "ver productos"\n🔎 *Buscar* - dime el nombre del producto\n🛒 *Carrito* - dime "mi carrito"\n📦 *Pedidos* - dime "estado de mi pedido"\n👤 *Asesor* - dime "quiero hablar con un asesor"\n\n¿Qué necesitas?',
    );
  }

  private matches(text: string, keywords: string[]): boolean {
    return keywords.some((kw) => text.includes(kw));
  }

  private response(content: string): AiResponse {
    return { content };
  }

  private responseWithTool(toolName: string, args: Record<string, any>): AiResponse {
    return {
      content: '',
      toolCalls: [{ name: toolName, arguments: args }],
    };
  }
}
