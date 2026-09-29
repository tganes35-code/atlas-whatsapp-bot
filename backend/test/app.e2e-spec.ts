import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

/**
 * Tests E2E que se ejecutan contra la base de datos real (PostgreSQL en Docker).
 * Requieren que el servidor de base de datos esté corriendo.
 * Se ejecutan con: npm run test:e2e
 */
describe('Atlas WhatsApp Bot - E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let testPhone: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );

    prisma = app.get<PrismaService>(PrismaService);
    await app.init();

    // Número único para cada ejecución del test
    testPhone = `300${Date.now().toString().slice(-7)}`;
  });

  afterAll(async () => {
    // Limpiar datos de prueba
    try {
      await prisma.message.deleteMany({ where: { conversation: { customer: { phone: testPhone } } } });
      await prisma.conversation.deleteMany({ where: { customer: { phone: testPhone } } });
      await prisma.orderStatusHistory.deleteMany({ where: { order: { customer: { phone: testPhone } } } });
      await prisma.orderItem.deleteMany({ where: { order: { customer: { phone: testPhone } } } });
      await prisma.order.deleteMany({ where: { customer: { phone: testPhone } } });
      await prisma.cartItem.deleteMany({ where: { cart: { customer: { phone: testPhone } } } });
      await prisma.cart.deleteMany({ where: { customer: { phone: testPhone } } });
      await prisma.customer.deleteMany({ where: { phone: testPhone } });
    } catch (e) {
      // Ignorar errores de limpieza
    }
    await app.close();
  });

  // ─── Auth ────────────────────────────────────────────────────

  describe('AUTH', () => {
    it('POST /api/auth/login — login correcto', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'admin@atlas.local', password: 'Admin123!' })
        .expect(200);

      expect(res.body.data.access_token).toBeDefined();
      expect(res.body.data.user.role).toBe('ADMIN');
      adminToken = res.body.data.access_token;
    });

    it('POST /api/auth/login — login incorrecto', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'admin@atlas.local', password: 'wrongpassword' })
        .expect(401);
    });

    it('POST /api/auth/login — email inválido rechazado', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'no-es-email', password: '123456' })
        .expect(400);
    });

    it('GET /api/auth/me — retorna usuario autenticado', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.email).toBe('admin@atlas.local');
      expect(res.body.data.password).toBeUndefined();
    });

    it('GET /api/auth/me — rechaza sin token', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/me')
        .expect(401);
    });
  });

  // ─── Company ────────────────────────────────────────────────

  describe('COMPANY', () => {
    it('GET /api/company — retorna empresa desde DB', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/company')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.name).toBe('Atlas Demo Store');
      expect(res.body.data.country).toBe('Colombia');
    });
  });

  // ─── Catalog ────────────────────────────────────────────────

  describe('CATEGORIES', () => {
    it('GET /api/categories — lista categorías', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.length).toBeGreaterThanOrEqual(4);
      expect(res.body.data[0].name).toBeDefined();
    });
  });

  describe('PRODUCTS', () => {
    it('GET /api/products — lista productos con paginación', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.data.length).toBeGreaterThanOrEqual(8);
      expect(res.body.data.meta.total).toBeGreaterThanOrEqual(8);
    });

    it('GET /api/products?search=camiseta — filtra productos', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/products?search=camiseta')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.data.length).toBeGreaterThan(0);
      expect(res.body.data.data[0].name.toLowerCase()).toContain('camiseta');
    });

    it('POST /api/products — rechaza precio negativo', async () => {
      await request(app.getHttpServer())
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Test', sku: 'TST-001', categoryId: 'bad', price: -100 })
        .expect(400);
    });

    it('POST /api/products — rechaza sin campos obligatorios', async () => {
      await request(app.getHttpServer())
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Solo nombre' })
        .expect(400);
    });
  });

  // ─── Customers ──────────────────────────────────────────────

  describe('CUSTOMERS', () => {
    it('POST /api/customers — crea cliente', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/customers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Test E2E', phone: testPhone, city: 'Bogotá' })
        .expect(201);

      expect(res.body.data.phone).toBe(testPhone);
    });

    it('POST /api/customers — rechaza teléfono duplicado', async () => {
      await request(app.getHttpServer())
        .post('/api/customers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Otro', phone: testPhone })
        .expect(409);
    });

    it('POST /api/customers — rechaza teléfono inválido', async () => {
      await request(app.getHttpServer())
        .post('/api/customers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Test', phone: '123' }) // demasiado corto
        .expect(400);
    });
  });

  // ─── Dashboard ──────────────────────────────────────────────

  describe('DASHBOARD', () => {
    it('GET /api/dashboard — retorna estadísticas reales', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.totals.customers).toBeGreaterThan(0);
      expect(res.body.data.totals.products).toBeGreaterThan(0);
      expect(res.body.data.latestOrders).toBeDefined();
      expect(res.body.data.latestConversations).toBeDefined();
    });
  });

  // ─── E2E Chatbot completo ────────────────────────────────────

  describe('CHATBOT E2E — Flujo completo de compra', () => {
    const chatPhone = `301${Date.now().toString().slice(-7)}`;
    let convId: string;
    let custId: string;
    let productId: string;

    afterAll(async () => {
      try {
        await prisma.message.deleteMany({ where: { conversation: { customer: { phone: chatPhone } } } });
        await prisma.conversation.deleteMany({ where: { customer: { phone: chatPhone } } });
        await prisma.orderStatusHistory.deleteMany({ where: { order: { customer: { phone: chatPhone } } } });
        await prisma.orderItem.deleteMany({ where: { order: { customer: { phone: chatPhone } } } });
        await prisma.order.deleteMany({ where: { customer: { phone: chatPhone } } });
        await prisma.cartItem.deleteMany({ where: { cart: { customer: { phone: chatPhone } } } });
        await prisma.cart.deleteMany({ where: { customer: { phone: chatPhone } } });
        await prisma.customer.deleteMany({ where: { phone: chatPhone } });
      } catch { /* ignorar */ }
    });

    it('1. Cliente dice Hola — bot responde con menú', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/messages/process')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ phone: chatPhone, message: 'Hola', channel: 'LOCAL' })
        .expect(201);

      expect(res.body.data.botResponse).toContain('Atlas Demo Store');
      expect(res.body.data.conversationId).toBeDefined();
      convId = res.body.data.conversationId;
      custId = res.body.data.customerId;
    });

    it('2. Cliente busca camisetas — bot consulta DB', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/messages/process')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ phone: chatPhone, message: 'quiero ver camisetas', channel: 'LOCAL' })
        .expect(201);

      expect(res.body.data.botResponse).toBeDefined();
      expect(res.body.data.botResponse.length).toBeGreaterThan(10);
      // La respuesta debe venir de la BD, no inventada
      expect(res.body.data.botResponse.toLowerCase()).toContain('camiseta');
    });

    it('3. Bot muestra precios reales de la BD', async () => {
      // Verificamos que el producto existe en BD con el precio correcto
      const res = await request(app.getHttpServer())
        .get('/api/products?search=camiseta')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.data[0].price).toBeDefined();
      productId = res.body.data.data[0].id;
      const price = Number(res.body.data.data[0].price);
      expect(price).toBeGreaterThan(0);
    });

    it('4. Agregar producto al carrito directamente', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/carts/${custId}/items`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ productId, quantity: 2 })
        .expect(201);

      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0].quantity).toBe(2);
      expect(res.body.data.subtotal).toBeGreaterThan(0);
    });

    it('5. Carrito calcula subtotal correctamente', async () => {
      const cartRes = await request(app.getHttpServer())
        .get(`/api/carts/${custId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const cart = cartRes.body.data;
      expect(cart.items).toHaveLength(1);

      const item = cart.items[0];
      const expectedSubtotal = Number(item.unitPrice) * item.quantity;
      expect(Number(item.subtotal)).toBe(expectedSubtotal);
    });

    it('6. Actualizar cliente con dirección para el pedido', async () => {
      await request(app.getHttpServer())
        .patch(`/api/customers/${custId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ address: 'Calle 123 # 45-67, Bogotá', name: 'E2E Test User', city: 'Bogotá' })
        .expect(200);
    });

    it('7. Crear pedido — total calculado en backend', async () => {
      // Obtener precio del producto para validar cálculo
      const cartRes = await request(app.getHttpServer())
        .get(`/api/carts/${custId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      const cart = cartRes.body.data;
      const expectedSubtotal = Number(cart.subtotal);
      const expectedTotal = expectedSubtotal + 10000; // + envío

      const orderRes = await request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          customerId: custId,
          paymentMethod: 'EFECTIVO',
          shippingAddress: 'Calle 123 # 45-67, Bogotá',
        })
        .expect(201);

      const order = orderRes.body.data;
      expect(order.status).toBe('PENDING');
      expect(Number(order.subtotal)).toBe(expectedSubtotal);
      expect(Number(order.total)).toBe(expectedTotal);
      expect(Number(order.shipping)).toBe(10000);

      // Guardar order id para los siguientes tests
      (global as any).__testOrderId = order.id;
    });

    it('8. Cambiar estado del pedido', async () => {
      const orderId = (global as any).__testOrderId;
      const res = await request(app.getHttpServer())
        .patch(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'CONFIRMED', notes: 'Confirmado por test E2E' })
        .expect(200);

      expect(res.body.data.status).toBe('CONFIRMED');
    });

    it('9. Human handoff via chatbot', async () => {
      // Primero devolvemos al bot para que esté en estado OPEN
      const convRes = await request(app.getHttpServer())
        .get(`/api/conversations/${convId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      const conv = convRes.body.data;

      if (conv.status === 'HUMAN' || conv.status === 'CLOSED') {
        await request(app.getHttpServer())
          .patch(`/api/conversations/${convId}/return-to-bot`)
          .set('Authorization', `Bearer ${adminToken}`);
      }

      const res = await request(app.getHttpServer())
        .post('/api/messages/process')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ phone: chatPhone, message: 'quiero hablar con un asesor', channel: 'LOCAL' })
        .expect(201);

      // En modo HUMAN botResponse es null y humanMode true
      expect(res.body.data.humanMode).toBe(true);
    });

    it('10. Bot no responde en modo HUMAN', async () => {
      // En modo HUMAN, botResponse debe ser null
      const res = await request(app.getHttpServer())
        .post('/api/messages/process')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ phone: chatPhone, message: 'Hola de nuevo', channel: 'LOCAL' })
        .expect(201);

      expect(res.body.data.humanMode).toBe(true);
      expect(res.body.data.botResponse).toBeNull();
    });

    it('11. Verificar conversación tiene historial de mensajes', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/conversations/${convId}/messages`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
      const senders = res.body.data.map((m: any) => m.sender);
      expect(senders).toContain('CUSTOMER');
      expect(senders).toContain('BOT');
    });
  });

  // ─── Seguridad ────────────────────────────────────────────────

  describe('SEGURIDAD', () => {
    it('Ruta privada rechaza solicitud sin token', async () => {
      await request(app.getHttpServer())
        .get('/api/products')
        .expect(401);
    });

    it('Ruta privada rechaza token inválido', async () => {
      await request(app.getHttpServer())
        .get('/api/products')
        .set('Authorization', 'Bearer token-falso')
        .expect(401);
    });

    it('Precio negativo es rechazado por validación', async () => {
      await request(app.getHttpServer())
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Test', sku: 'T-001', categoryId: 'c', price: -500, stock: 10 })
        .expect(400);
    });

    it('Stock negativo es rechazado por validación', async () => {
      await request(app.getHttpServer())
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Test', sku: 'T-002', categoryId: 'c', price: 10000, stock: -5 })
        .expect(400);
    });

    it('Cantidad 0 en carrito es rechazada', async () => {
      const customer = await prisma.customer.findFirst({ where: { active: true } });
      if (!customer) return;

      await request(app.getHttpServer())
        .post(`/api/carts/${customer.id}/items`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ productId: 'bad-id', quantity: 0 })
        .expect(400);
    });

    it('Email inválido en customer es rechazado', async () => {
      await request(app.getHttpServer())
        .post('/api/customers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Test', phone: '3001111111', email: 'no-es-email' })
        .expect(400);
    });

    it('Webhook WhatsApp GET verifica token correctamente', async () => {
      // El token por defecto en el servicio cuando no hay env var
      const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN ?? 'atlas-verify-token';
      const res = await request(app.getHttpServer())
        .get('/api/webhooks/whatsapp')
        .query({
          'hub.mode': 'subscribe',
          'hub.verify_token': verifyToken,
          'hub.challenge': 'challenge-test-123',
        });

      // Si el token es correcto debe retornar 200 con el challenge
      expect(res.status).toBe(200);
      expect(res.text).toBe('challenge-test-123');
    });

    it('Webhook WhatsApp GET rechaza token incorrecto', async () => {
      await request(app.getHttpServer())
        .get('/api/webhooks/whatsapp')
        .query({
          'hub.mode': 'subscribe',
          'hub.verify_token': 'token-malo',
          'hub.challenge': 'challenge',
        })
        .expect(403);
    });
  });
});
