import { PrismaClient, UserRole, ConversationStatus, ConversationChannel, MessageSender } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de Atlas WhatsApp Bot...');

  // ─── Usuario admin ───────────────────────────────────────────
  const adminPassword = await argon2.hash('Admin123!');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@atlas.local' },
    update: {},
    create: {
      name: 'Administrador Atlas',
      email: 'admin@atlas.local',
      password: adminPassword,
      role: UserRole.ADMIN,
    },
  });
  console.log('✅ Admin creado:', admin.email);

  // Usuario agente demo
  const agentPassword = await argon2.hash('Agent123!');
  const agent = await prisma.user.upsert({
    where: { email: 'agente@atlas.local' },
    update: {},
    create: {
      name: 'Agente Demo',
      email: 'agente@atlas.local',
      password: agentPassword,
      role: UserRole.AGENT,
    },
  });
  console.log('✅ Agente creado:', agent.email);

  // ─── Categorías ──────────────────────────────────────────────
  const catCamisetas = await prisma.category.upsert({
    where: { name: 'Camisetas' },
    update: {},
    create: {
      name: 'Camisetas',
      description: 'Camisetas de la colección Atlas',
      image: '/images/cat-camisetas.jpg',
    },
  });

  const catGorras = await prisma.category.upsert({
    where: { name: 'Gorras' },
    update: {},
    create: {
      name: 'Gorras',
      description: 'Gorras y sombreros Atlas',
      image: '/images/cat-gorras.jpg',
    },
  });

  const catChaquetas = await prisma.category.upsert({
    where: { name: 'Chaquetas' },
    update: {},
    create: {
      name: 'Chaquetas',
      description: 'Chaquetas y abrigos Atlas',
      image: '/images/cat-chaquetas.jpg',
    },
  });

  const catPantalones = await prisma.category.upsert({
    where: { name: 'Pantalones' },
    update: {},
    create: {
      name: 'Pantalones',
      description: 'Pantalones y jeans Atlas',
      image: '/images/cat-pantalones.jpg',
    },
  });
  console.log('✅ Categorías creadas: 4');

  // ─── Productos ───────────────────────────────────────────────

  // Camiseta Atlas Blanca
  const prodCamisetaBlanca = await prisma.product.upsert({
    where: { sku: 'ATL-CAM-001' },
    update: {},
    create: {
      categoryId: catCamisetas.id,
      name: 'Camiseta Atlas Blanca',
      description: 'Camiseta 100% algodón con logo bordado Atlas. Disponible en tallas S, M, L, XL.',
      sku: 'ATL-CAM-001',
      price: 45000,
      stock: 20,
      image: '/images/prod-camiseta-blanca.jpg',
    },
  });

  // Variantes Camiseta Blanca
  await prisma.productVariant.createMany({
    skipDuplicates: true,
    data: [
      { productId: prodCamisetaBlanca.id, name: 'Talla', value: 'S', priceModifier: 0, stock: 5 },
      { productId: prodCamisetaBlanca.id, name: 'Talla', value: 'M', priceModifier: 0, stock: 7 },
      { productId: prodCamisetaBlanca.id, name: 'Talla', value: 'L', priceModifier: 0, stock: 5 },
      { productId: prodCamisetaBlanca.id, name: 'Talla', value: 'XL', priceModifier: 2000, stock: 3 },
    ],
  });

  // Camiseta Atlas Negra
  const prodCamisetaNegra = await prisma.product.upsert({
    where: { sku: 'ATL-CAM-002' },
    update: {},
    create: {
      categoryId: catCamisetas.id,
      name: 'Camiseta Atlas Negra',
      description: 'Camiseta 100% algodón color negro con logo bordado Atlas.',
      sku: 'ATL-CAM-002',
      price: 45000,
      stock: 18,
      image: '/images/prod-camiseta-negra.jpg',
    },
  });

  await prisma.productVariant.createMany({
    skipDuplicates: true,
    data: [
      { productId: prodCamisetaNegra.id, name: 'Talla', value: 'S', priceModifier: 0, stock: 4 },
      { productId: prodCamisetaNegra.id, name: 'Talla', value: 'M', priceModifier: 0, stock: 6 },
      { productId: prodCamisetaNegra.id, name: 'Talla', value: 'L', priceModifier: 0, stock: 5 },
      { productId: prodCamisetaNegra.id, name: 'Talla', value: 'XL', priceModifier: 2000, stock: 3 },
    ],
  });

  // Gorra Atlas
  const prodGorra = await prisma.product.upsert({
    where: { sku: 'ATL-GOR-001' },
    update: {},
    create: {
      categoryId: catGorras.id,
      name: 'Gorra Atlas Classic',
      description: 'Gorra clásica con logo bordado Atlas. Ajuste universal con cierre trasero.',
      sku: 'ATL-GOR-001',
      price: 35000,
      stock: 15,
      image: '/images/prod-gorra.jpg',
    },
  });

  await prisma.productVariant.createMany({
    skipDuplicates: true,
    data: [
      { productId: prodGorra.id, name: 'Color', value: 'Negro', priceModifier: 0, stock: 8 },
      { productId: prodGorra.id, name: 'Color', value: 'Blanco', priceModifier: 0, stock: 4 },
      { productId: prodGorra.id, name: 'Color', value: 'Azul', priceModifier: 0, stock: 3 },
    ],
  });

  // Gorra Atlas Premium
  const prodGorraPremium = await prisma.product.upsert({
    where: { sku: 'ATL-GOR-002' },
    update: {},
    create: {
      categoryId: catGorras.id,
      name: 'Gorra Atlas Premium',
      description: 'Gorra premium con logo metálico Atlas. Material de alta calidad.',
      sku: 'ATL-GOR-002',
      price: 55000,
      stock: 8,
      image: '/images/prod-gorra-premium.jpg',
    },
  });

  // Chaqueta Atlas
  const prodChaqueta = await prisma.product.upsert({
    where: { sku: 'ATL-CHA-001' },
    update: {},
    create: {
      categoryId: catChaquetas.id,
      name: 'Chaqueta Atlas Sport',
      description: 'Chaqueta deportiva con forro interno y logo bordado Atlas. Ideal para clima frío.',
      sku: 'ATL-CHA-001',
      price: 120000,
      stock: 10,
      image: '/images/prod-chaqueta.jpg',
    },
  });

  await prisma.productVariant.createMany({
    skipDuplicates: true,
    data: [
      { productId: prodChaqueta.id, name: 'Talla', value: 'S', priceModifier: 0, stock: 2 },
      { productId: prodChaqueta.id, name: 'Talla', value: 'M', priceModifier: 0, stock: 3 },
      { productId: prodChaqueta.id, name: 'Talla', value: 'L', priceModifier: 0, stock: 3 },
      { productId: prodChaqueta.id, name: 'Talla', value: 'XL', priceModifier: 5000, stock: 2 },
    ],
  });

  // Pantalón Atlas
  const prodPantalon = await prisma.product.upsert({
    where: { sku: 'ATL-PAN-001' },
    update: {},
    create: {
      categoryId: catPantalones.id,
      name: 'Pantalón Atlas Casual',
      description: 'Pantalón casual de corte recto con logo bordado en bolsillo. Tejido resistente.',
      sku: 'ATL-PAN-001',
      price: 90000,
      stock: 12,
      image: '/images/prod-pantalon.jpg',
    },
  });

  await prisma.productVariant.createMany({
    skipDuplicates: true,
    data: [
      { productId: prodPantalon.id, name: 'Talla', value: '28', priceModifier: 0, stock: 3 },
      { productId: prodPantalon.id, name: 'Talla', value: '30', priceModifier: 0, stock: 4 },
      { productId: prodPantalon.id, name: 'Talla', value: '32', priceModifier: 0, stock: 3 },
      { productId: prodPantalon.id, name: 'Talla', value: '34', priceModifier: 0, stock: 2 },
    ],
  });

  // Pantalón Atlas Sport
  const prodPantalonSport = await prisma.product.upsert({
    where: { sku: 'ATL-PAN-002' },
    update: {},
    create: {
      categoryId: catPantalones.id,
      name: 'Pantalón Atlas Sport',
      description: 'Pantalón deportivo con cintura elástica y cordón. Perfecto para actividades deportivas.',
      sku: 'ATL-PAN-002',
      price: 75000,
      stock: 14,
      image: '/images/prod-pantalon-sport.jpg',
    },
  });

  // Chaqueta Atlas Lluvia
  const prodChaquetaLluvia = await prisma.product.upsert({
    where: { sku: 'ATL-CHA-002' },
    update: {},
    create: {
      categoryId: catChaquetas.id,
      name: 'Chaqueta Atlas Impermeable',
      description: 'Chaqueta impermeable con capucha removible. Protección total contra la lluvia.',
      sku: 'ATL-CHA-002',
      price: 150000,
      stock: 6,
      image: '/images/prod-chaqueta-lluvia.jpg',
    },
  });

  console.log('✅ Productos creados: 8');

  // ─── Conversación demo ───────────────────────────────────────
  const conversacionDemo = await prisma.conversation.upsert({
    where: { id: 'conv-demo-001' },
    update: {},
    create: {
      id: 'conv-demo-001',
      phone: '3001234567',
      status: ConversationStatus.OPEN,
      channel: ConversationChannel.WHATSAPP,
    },
  });

  // Mensajes de ejemplo en la conversación demo
  const existingMessages = await prisma.message.count({
    where: { conversationId: conversacionDemo.id },
  });

  if (existingMessages === 0) {
    await prisma.message.createMany({
      data: [
        {
          conversationId: conversacionDemo.id,
          sender: MessageSender.CUSTOMER,
          content: 'Hola',
        },
        {
          conversationId: conversacionDemo.id,
          sender: MessageSender.BOT,
          content: '¡Hola! 👋 Bienvenido a Atlas Demo Store. Soy el asistente virtual y estoy aquí para ayudarte.\n\nPuedo ayudarte a:\n🛍️ Ver productos\n🔎 Buscar un producto\n📦 Consultar un pedido\n👤 Hablar con un asesor\n\n¿En qué puedo ayudarte?',
        },
        {
          conversationId: conversacionDemo.id,
          sender: MessageSender.CUSTOMER,
          content: 'quiero ver las camisetas',
        },
        {
          conversationId: conversacionDemo.id,
          sender: MessageSender.BOT,
          content: '¡Aquí tienes nuestras camisetas! 👕\n\n1. *Camiseta Atlas Blanca* - $45.000 COP\n   Tallas: S, M, L, XL | Stock: 20 unidades\n\n2. *Camiseta Atlas Negra* - $45.000 COP\n   Tallas: S, M, L, XL | Stock: 18 unidades\n\n¿Te interesa alguna? Puedo darte más detalles o preguntas. 😊',
        },
      ],
    });
  }
  console.log('✅ Conversación demo creada');

  console.log('\n🎉 Seed completado exitosamente!');
  console.log('\n📋 Credenciales de desarrollo:');
  console.log('   Admin:  admin@atlas.local / Admin123!');
  console.log('   Agente: agente@atlas.local / Agent123!');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
