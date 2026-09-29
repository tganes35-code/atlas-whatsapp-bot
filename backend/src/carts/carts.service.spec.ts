import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CartsService } from './carts.service';
import { PrismaService } from '../database/prisma.service';

describe('CartsService', () => {
  let service: CartsService;
  let prisma: any;

  const mockProduct = {
    id: 'prod-1',
    name: 'Camiseta Atlas',
    price: 45000,
    stock: 20,
    image: null,
    active: true,
    variants: [],
  };

  const mockCart = {
    id: 'cart-1',
    customerId: 'cust-1',
    status: 'ACTIVE',
    items: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCartWithItem = {
    ...mockCart,
    items: [
      {
        id: 'item-1',
        cartId: 'cart-1',
        productId: 'prod-1',
        variantId: null,
        quantity: 2,
        unitPrice: 45000,
        subtotal: 90000,
        product: { id: 'prod-1', name: 'Camiseta Atlas', price: 45000, image: null, stock: 20 },
        variant: null,
      },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartsService,
        {
          provide: PrismaService,
          useValue: {
            cart: {
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            cartItem: {
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              deleteMany: jest.fn(),
            },
            product: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<CartsService>(CartsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('getOrCreateActiveCart', () => {
    it('debe retornar carrito existente', async () => {
      prisma.cart.findFirst.mockResolvedValue(mockCartWithItem);

      const result = await service.getOrCreateActiveCart('cust-1');
      expect(result.id).toBe('cart-1');
      expect(result.items).toHaveLength(1);
    });

    it('debe crear carrito si no existe', async () => {
      prisma.cart.findFirst.mockResolvedValue(null);
      prisma.cart.create.mockResolvedValue(mockCart);

      const result = await service.getOrCreateActiveCart('cust-1');
      expect(result.id).toBe('cart-1');
    });

    it('debe calcular subtotal correctamente', async () => {
      prisma.cart.findFirst.mockResolvedValue(mockCartWithItem);

      const result = await service.getOrCreateActiveCart('cust-1');
      expect(result.subtotal).toBe(90000);
      expect(result.itemCount).toBe(2);
    });
  });

  describe('addItem', () => {
    it('debe agregar producto al carrito', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);

      // Primera llamada: carrito vacío, segunda: con item
      prisma.cart.findFirst
        .mockResolvedValueOnce({ ...mockCart, items: [] })
        .mockResolvedValueOnce(mockCartWithItem);
      prisma.cart.create.mockResolvedValue(mockCart);
      prisma.cartItem.create.mockResolvedValue({});

      const result = await service.addItem('cust-1', {
        productId: 'prod-1',
        quantity: 2,
      });

      expect(prisma.cartItem.create).toHaveBeenCalled();
    });

    it('debe rechazar si stock insuficiente', async () => {
      prisma.product.findUnique.mockResolvedValue({
        ...mockProduct,
        stock: 1, // solo 1 en stock
      });
      prisma.cart.findFirst.mockResolvedValue({ ...mockCart, items: [] });

      await expect(
        service.addItem('cust-1', { productId: 'prod-1', quantity: 5 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe rechazar producto inexistente', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(
        service.addItem('cust-1', { productId: 'bad-id', quantity: 1 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe rechazar producto inactivo', async () => {
      prisma.product.findUnique.mockResolvedValue({
        ...mockProduct,
        active: false,
      });

      await expect(
        service.addItem('cust-1', { productId: 'prod-1', quantity: 1 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeItem', () => {
    it('debe eliminar item del carrito', async () => {
      prisma.cart.findFirst.mockResolvedValue({ ...mockCart, items: [{ id: 'item-1' }] });
      prisma.cartItem.delete.mockResolvedValue({});

      // Segunda llamada retorna carrito vacío
      prisma.cart.findFirst
        .mockResolvedValueOnce({ ...mockCart, items: [{ id: 'item-1' }] }) // para removeItem
        .mockResolvedValueOnce(mockCart); // para getOrCreateActiveCart

      await service.removeItem('cust-1', 'item-1');
      expect(prisma.cartItem.delete).toHaveBeenCalledWith({
        where: { id: 'item-1' },
      });
    });
  });

  describe('clearCart', () => {
    it('debe vaciar el carrito', async () => {
      prisma.cart.findFirst.mockResolvedValue(mockCart);
      prisma.cartItem.deleteMany.mockResolvedValue({});

      await service.clearCart('cust-1');
      expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith({
        where: { cartId: 'cart-1' },
      });
    });
  });
});
