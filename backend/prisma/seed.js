"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const argon2 = require("argon2");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Iniciando seed de Atlas WhatsApp Bot...');
    const company = await prisma.company.upsert({
        where: { id: 'company-atlas-demo' },
        update: {},
        create: {
            id: 'company-atlas-demo',
            name: 'Atlas Demo Store',
            description: 'Tienda de productos de prueba para validar Atlas WhatsApp Bot.',
            phone: '+573000000000',
            email: 'info@atlasdemo.local',
            address: 'Calle 1 # 1-1, Centro',
            country: 'Colombia',
            currency: 'COP',
            schedules: JSON.stringify({
                lunes_viernes: '8:00 AM - 6:00 PM',
                sabado: '9:00 AM - 2:00 PM',
                domingo: 'Cerrado',
            }),
            policies: 'Cambios y devoluciones dentro de los 15 días posteriores a la compra, con el producto en perfecto estado y con su empaque original. Envíos a todo Colombia con costo adicional de $10.000 COP.',
            extraInfo: 'Somos una tienda especializada en ropa y accesorios de la marca Atlas. Aceptamos pago en efectivo, transferencia bancaria y pago contra entrega. WhatsApp: +573000000000',
        },
    });
    console.log('✅ Empresa creada:', company.name);
    const adminPassword = await argon2.hash('Admin123!');
    const admin = await prisma.user.upsert({
        where: { email: 'admin@atlas.local' },
        update: {},
        create: {
            name: 'Administrador Atlas',
            email: 'admin@atlas.local',
            password: adminPassword,
            role: client_1.UserRole.ADMIN,
        },
    });
    console.log('✅ Admin creado:', admin.email);
    const agentPassword = await argon2.hash('Agent123!');
    const agent = await prisma.user.upsert({
        where: { email: 'agente@atlas.local' },
        update: {},
        create: {
            name: 'Agente Demo',
            email: 'agente@atlas.local',
            password: agentPassword,
            role: client_1.UserRole.AGENT,
        },
    });
    console.log('✅ Agente creado:', agent.email);
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
    await prisma.productVariant.createMany({
        skipDuplicates: true,
        data: [
            { productId: prodCamisetaBlanca.id, name: 'Talla', value: 'S', priceModifier: 0, stock: 5 },
            { productId: prodCamisetaBlanca.id, name: 'Talla', value: 'M', priceModifier: 0, stock: 7 },
            { productId: prodCamisetaBlanca.id, name: 'Talla', value: 'L', priceModifier: 0, stock: 5 },
            { productId: prodCamisetaBlanca.id, name: 'Talla', value: 'XL', priceModifier: 2000, stock: 3 },
        ],
    });
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
    const clienteDemo = await prisma.customer.upsert({
        where: { phone: '3001234567' },
        update: {},
        create: {
            name: 'Juan Pérez',
            phone: '3001234567',
            email: 'juan.perez@demo.local',
            address: 'Calle 45 # 23-10',
            city: 'Bogotá',
            notes: 'Cliente demo para pruebas del sistema',
        },
    });
    console.log('✅ Cliente demo creado:', clienteDemo.name);
    const conversacionDemo = await prisma.conversation.upsert({
        where: { id: 'conv-demo-001' },
        update: {},
        create: {
            id: 'conv-demo-001',
            customerId: clienteDemo.id,
            status: client_1.ConversationStatus.OPEN,
            channel: client_1.ConversationChannel.LOCAL,
        },
    });
    const existingMessages = await prisma.message.count({
        where: { conversationId: conversacionDemo.id },
    });
    if (existingMessages === 0) {
        await prisma.message.createMany({
            data: [
                {
                    conversationId: conversacionDemo.id,
                    sender: client_1.MessageSender.CUSTOMER,
                    content: 'Hola',
                },
                {
                    conversationId: conversacionDemo.id,
                    sender: client_1.MessageSender.BOT,
                    content: '¡Hola! 👋 Bienvenido a Atlas Demo Store. Soy el asistente virtual y estoy aquí para ayudarte.\n\nPuedo ayudarte a:\n🛍️ Ver productos\n🔎 Buscar un producto\n🛒 Crear un pedido\n📦 Consultar un pedido\n👤 Hablar con un asesor\n\n¿En qué puedo ayudarte?',
                },
                {
                    conversationId: conversacionDemo.id,
                    sender: client_1.MessageSender.CUSTOMER,
                    content: 'quiero ver las camisetas',
                },
                {
                    conversationId: conversacionDemo.id,
                    sender: client_1.MessageSender.BOT,
                    content: '¡Aquí tienes nuestras camisetas! 👕\n\n1. *Camiseta Atlas Blanca* - $45.000 COP\n   Tallas: S, M, L, XL | Stock: 20 unidades\n\n2. *Camiseta Atlas Negra* - $45.000 COP\n   Tallas: S, M, L, XL | Stock: 18 unidades\n\n¿Te interesa alguna? Puedo darte más detalles o agregarla a tu carrito. 😊',
                },
            ],
        });
    }
    console.log('✅ Conversación demo creada');
    const existingOrder = await prisma.order.findFirst({
        where: { customerId: clienteDemo.id },
    });
    if (!existingOrder) {
        const orderDemo = await prisma.order.create({
            data: {
                customerId: clienteDemo.id,
                status: client_1.OrderStatus.DELIVERED,
                subtotal: 90000,
                shipping: 10000,
                total: 100000,
                paymentMethod: client_1.PaymentMethod.EFECTIVO,
                shippingAddress: 'Calle 45 # 23-10, Bogotá',
                notes: 'Pedido demo de prueba',
                items: {
                    create: [
                        {
                            productId: prodCamisetaBlanca.id,
                            productName: 'Camiseta Atlas Blanca',
                            quantity: 2,
                            unitPrice: 45000,
                            subtotal: 90000,
                        },
                    ],
                },
                statusHistory: {
                    create: [
                        { status: client_1.OrderStatus.PENDING, notes: 'Pedido creado', changedBy: 'BOT' },
                        { status: client_1.OrderStatus.CONFIRMED, notes: 'Pedido confirmado', changedBy: admin.id },
                        { status: client_1.OrderStatus.DELIVERED, notes: 'Pedido entregado', changedBy: admin.id },
                    ],
                },
            },
        });
        console.log('✅ Pedido demo creado:', orderDemo.id);
    }
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
//# sourceMappingURL=seed.js.map