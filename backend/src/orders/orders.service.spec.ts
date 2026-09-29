import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { PrismaService } from '../database/prisma.service';

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: any;

  const mockCustomer = {
    id: 'cust-1',
    name: 'Juan Pérez',
    phone: '3001234567',
    address: 'Calle 1 # 1-1',
    active: true,
  };

  const mockProduct = {
    id: 'prod-1',
    name: 'Camiseta Atlas',
    price: 45000,
    stock: 20,
    active: true,
  };

  const mockCartWithItems = {
    id: 'cart-1',
    customerId: 'cust-1',
    status: 'ACTIVE',
    items: [
      {
        id: 'item-1',
        productId: 'prod-1',
        variantId: null,
        quantity: 2,
        unitPrice: 45000,
        subtotal: 90000,
        product: mockProduct,
        variant: null,
      },
    ],
  };

  const mockOrder = {
    id: 'order-1',
    customerId: 'cust-1',
    status: 'PENDING',
    subtotal: 90000,
    shipping: 10000,
    total: 100000,
    paymentMethod: 'EFECTIVO',
    items: [],
    statusHistory: [],
    customer: mockCustomer,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: PrismaService,
          useValue: {
            cart: {
              findFirst: jest.fn(),
            },
            customer: {
              findUnique: jest.fn(),
            },
            order: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              count: jest.fn(),
              aggregate: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('createFromCart', () => {
    it('debe crear pedido y calcular total en backend', async () => {
      prisma.cart.findFirst.mockResolvedValue(mockCartWithItems);
      prisma.customer.findUnique.mockResolvedValue(mockCustomer);
      prisma.$transaction.mockImplementation(async (fn: any) => {
        const txPrisma = {
          order: { create: jest.fn().mockResolvedValue(mockOrder) },
          product: { update: jest.fn() },
          productVariant: { update: jest.fn() },
          cart: { update: jest.fn() },
        };
        return fn(txPrisma);
      });

      const result = await service.createFromCart({
        customerId: 'cust-1',
        paymentMethod: 'EFECTIVO' as any,
        shippingAddress: 'Calle 1',
      });

      // El total debe calcularse en backend: 90000 + 10000 = 100000
      expect(result.total).toBe(100000);
      expect(result.status).toBe('PENDING');
    });

    it('debe rechazar si el carrito está vacío', async () => {
      prisma.cart.findFirst.mockResolvedValue(null);

      await expect(
        service.createFromCart({
          customerId: 'cust-1',
          paymentMethod: 'EFECTIVO' as any,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe rechazar si cliente no existe', async () => {
      prisma.cart.findFirst.mockResolvedValue(mockCartWithItems);
      prisma.customer.findUnique.mockResolvedValue(null);

      await expect(
        service.createFromCart({
          customerId: 'bad-id',
          paymentMethod: 'EFECTIVO' as any,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe rechazar si stock insuficiente', async () => {
      const cartWithLowStock = {
        ...mockCartWithItems,
        items: [
          {
            ...mockCartWithItems.items[0],
            quantity: 50, // más de lo disponible
            product: { ...mockProduct, stock: 5 },
          },
        ],
      };
      prisma.cart.findFirst.mockResolvedValue(cartWithLowStock);
      prisma.customer.findUnique.mockResolvedValue(mockCustomer);

      await expect(
        service.createFromCart({
          customerId: 'cust-1',
          paymentMethod: 'EFECTIVO' as any,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('debe listar pedidos con paginación', async () => {
      prisma.order.findMany.mockResolvedValue([mockOrder]);
      prisma.order.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('debe filtrar por estado', async () => {
      prisma.order.findMany.mockResolvedValue([mockOrder]);
      prisma.order.count.mockResolvedValue(1);

      const result = await service.findAll({ status: 'PENDING' as any });
      expect(result.data[0].status).toBe('PENDING');
    });
  });

  describe('updateStatus', () => {
    it('debe cambiar el estado del pedido', async () => {
      prisma.order.findUnique.mockResolvedValue(mockOrder);
      prisma.order.update.mockResolvedValue({ ...mockOrder, status: 'CONFIRMED' });

      const result = await service.updateStatus('order-1', { status: 'CONFIRMED' }, 'user-1');
      expect(result.status).toBe('CONFIRMED');
    });

    it('debe rechazar estado inválido', async () => {
      prisma.order.findUnique.mockResolvedValue(mockOrder);

      await expect(
        service.updateStatus('order-1', { status: 'ESTADO_INVALIDO' }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
