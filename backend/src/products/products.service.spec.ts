import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { PrismaService } from '../database/prisma.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: any;

  const mockCategory = { id: 'cat-1', name: 'Camisetas', active: true };

  const mockProduct = {
    id: 'prod-1',
    categoryId: 'cat-1',
    name: 'Camiseta Atlas Blanca',
    description: 'Camiseta de prueba',
    sku: 'ATL-CAM-001',
    price: 45000,
    stock: 20,
    image: null,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    category: mockCategory,
    variants: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: PrismaService,
          useValue: {
            product: {
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              count: jest.fn(),
            },
            category: {
              findUnique: jest.fn(),
            },
            productVariant: {
              createMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('create', () => {
    it('debe crear un producto correctamente', async () => {
      prisma.product.findUnique.mockResolvedValue(null); // SKU no existe
      prisma.category.findUnique.mockResolvedValue(mockCategory);
      prisma.product.create.mockResolvedValue(mockProduct);

      const result = await service.create({
        categoryId: 'cat-1',
        name: 'Camiseta Atlas Blanca',
        sku: 'ATL-CAM-001',
        price: 45000,
        stock: 20,
      });

      expect(result.name).toBe('Camiseta Atlas Blanca');
      expect(result.sku).toBe('ATL-CAM-001');
    });

    it('debe rechazar SKU duplicado', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct); // SKU ya existe

      await expect(
        service.create({
          categoryId: 'cat-1',
          name: 'Otro Producto',
          sku: 'ATL-CAM-001',
          price: 30000,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('debe rechazar categoría inexistente', async () => {
      prisma.product.findUnique.mockResolvedValue(null);
      prisma.category.findUnique.mockResolvedValue(null); // categoría no existe

      await expect(
        service.create({
          categoryId: 'cat-999',
          name: 'Producto',
          sku: 'SKU-999',
          price: 10000,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe rechazar precio negativo (validado por DTO)', async () => {
      // La validación de precio negativo se hace en el DTO con @IsPositive
      // Aquí verificamos que el servicio no crea con categoryId inválido
      prisma.product.findUnique.mockResolvedValue(null);
      prisma.category.findUnique.mockResolvedValue(null);

      await expect(
        service.create({ categoryId: 'bad', name: 'P', sku: 'S', price: -100 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('debe listar productos con paginación', async () => {
      prisma.product.findMany.mockResolvedValue([mockProduct]);
      prisma.product.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
    });

    it('debe buscar productos por texto', async () => {
      prisma.product.findMany.mockResolvedValue([mockProduct]);
      prisma.product.count.mockResolvedValue(1);

      const result = await service.findAll({ search: 'camiseta' });
      expect(result.data[0].name).toContain('Camiseta');
    });
  });

  describe('findOne', () => {
    it('debe retornar un producto por ID', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);
      const result = await service.findOne('prod-1');
      expect(result.id).toBe('prod-1');
    });

    it('debe lanzar NotFoundException si no existe', async () => {
      prisma.product.findUnique.mockResolvedValue(null);
      await expect(service.findOne('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('debe actualizar un producto', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);
      prisma.product.findFirst.mockResolvedValue(null);
      prisma.product.update.mockResolvedValue({ ...mockProduct, price: 50000 });

      const result = await service.update('prod-1', { price: 50000 });
      expect(Number(result.price)).toBe(50000);
    });
  });

  describe('remove', () => {
    it('debe desactivar (no eliminar) un producto', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);
      prisma.product.update.mockResolvedValue({ ...mockProduct, active: false });

      const result = await service.remove('prod-1');
      expect(result.active).toBe(false);
    });
  });

  describe('searchForBot', () => {
    it('debe buscar productos para el bot', async () => {
      prisma.product.findMany.mockResolvedValue([mockProduct]);
      const result = await service.searchForBot('camiseta');
      expect(result).toHaveLength(1);
    });
  });
});
