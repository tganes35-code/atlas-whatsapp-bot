/**
 * Script de inicialización para producción
 * Ejecuta: npm run init:prod
 * 
 * Responsabilidades:
 * 1. Ejecutar migraciones de DB
 * 2. Crear usuario admin
 * 3. Poblar datos iniciales
 */

import { PrismaClient, UserRole } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Inicializando Atlas WhatsApp Bot en PRODUCCIÓN...\n');

  try {
    // ═════════════════════════════════════════════════════════════
    // 1️⃣ CREAR ADMIN USER
    // ═════════════════════════════════════════════════════════════
    console.log('📝 Verificando/creando usuario admin...');
    
    const adminEmail = 'admin@atlas.local';
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword || adminPassword.length < 16) {
      throw new Error('ADMIN_PASSWORD must be configured with at least 16 characters');
    }
    
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      console.log(`✅ Admin ya existe: ${adminEmail}`);
    } else {
      const hashedPassword = await argon2.hash(adminPassword);
      await prisma.user.create({
        data: {
          name: 'Administrador',
          email: adminEmail,
          password: hashedPassword,
          role: UserRole.ADMIN,
        },
      });
      console.log(`✅ Admin creado: ${adminEmail}`);
    }

    // ═════════════════════════════════════════════════════════════
    // 2️⃣ CREAR CATEGORÍAS INICIALES
    // ═════════════════════════════════════════════════════════════
    console.log('\n📦 Verificando/creando categorías...');
    
    const categories = [
      { name: 'Camisetas', description: 'Camisetas y tops' },
      { name: 'Pantalones', description: 'Jeans y pantalones' },
      { name: 'Accesorios', description: 'Gorras, cinturones y más' },
      { name: 'Chaquetas', description: 'Chaquetas y abrigos' },
    ];

    for (const cat of categories) {
      const existing = await prisma.category.findUnique({
        where: { name: cat.name },
      });
      if (existing) {
        console.log(`   ✓ ${cat.name} ya existe`);
      } else {
        await prisma.category.create({
          data: cat,
        });
        console.log(`   ✓ ${cat.name} creada`);
      }
    }

    // ═════════════════════════════════════════════════════════════
    // 3️⃣ CREAR PRODUCTOS DE EJEMPLO
    // ═════════════════════════════════════════════════════════════
    console.log('\n🛍️  Verificando/creando productos de ejemplo...');
    
    const camisetas = await prisma.category.findUnique({
      where: { name: 'Camisetas' },
    });

    if (camisetas) {
      const products = [
        { sku: 'CAM-001', name: 'Camiseta Clásica Blanca', price: 29.99, stock: 50 },
        { sku: 'CAM-002', name: 'Camiseta Clásica Negra', price: 29.99, stock: 45 },
        { sku: 'CAM-003', name: 'Camiseta Premium Azul', price: 39.99, stock: 30 },
      ];

      for (const prod of products) {
        const existing = await prisma.product.findUnique({
          where: { sku: prod.sku },
        });
        if (existing) {
          console.log(`   ✓ ${prod.name} ya existe`);
        } else {
          await prisma.product.create({
            data: {
              categoryId: camisetas.id,
              ...prod,
            },
          });
          console.log(`   ✓ ${prod.name} creada`);
        }
      }
    }

    console.log('\n✅ Inicialización completada exitosamente\n');
    console.log('═══════════════════════════════════════════════');
    console.log('INFORMACIÓN DE ACCESO:');
    console.log('═══════════════════════════════════════════════');
    console.log(`Email: ${adminEmail}`);
    console.log('Use the ADMIN_PASSWORD configured in the deployment environment.');
    console.log('═══════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error durante inicialización:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
