import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { PrismaService } from '../database/prisma.service';

describe('CustomersService', () => {
  let service: CustomersService;
  let prisma: any;

  const mockCustomer = {
    id: 'cust-1',
    name: 'Juan Pérez',
    phone: '3001234567',
    email: 'juan@test.com',
    address: 'Calle 1',
    city: 'Bogotá',
    notes: null,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: { orders: 0, conversations: 0 },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        {
          provide: PrismaService,
          useValue: {
            customer: {
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              count: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('create', () => {
    it('debe crear un cliente nuevo', async () => {
      prisma.customer.findUnique.mockResolvedValue(null);
      prisma.customer.create.mockResolvedValue(mockCustomer);

      const result = await service.create({
        name: 'Juan Pérez',
        phone: '3001234567',
      });

      expect(result.name).toBe('Juan Pérez');
      expect(result.phone).toBe('3001234567');
    });

    it('debe rechazar teléfono duplicado activo', async () => {
      prisma.customer.findUnique.mockResolvedValue(mockCustomer); // ya existe y activo

      await expect(
        service.create({ name: 'Otro', phone: '3001234567' }),
      ).rejects.toThrow(ConflictException);
    });

    it('debe reactivar cliente inactivo con mismo teléfono', async () => {
      const inactiveCustomer = { ...mockCustomer, active: false };
      prisma.customer.findUnique.mockResolvedValue(inactiveCustomer);
      prisma.customer.update.mockResolvedValue({ ...inactiveCustomer, active: true, name: 'Juan Nuevo' });

      const result = await service.create({ name: 'Juan Nuevo', phone: '3001234567' });
      expect(result.active).toBe(true);
    });
  });

  describe('findAll', () => {
    it('debe listar clientes con paginación', async () => {
      prisma.customer.findMany.mockResolvedValue([mockCustomer]);
      prisma.customer.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('findByPhone', () => {
    it('debe encontrar cliente por teléfono', async () => {
      prisma.customer.findUnique.mockResolvedValue(mockCustomer);
      const result = await service.findByPhone('3001234567');
      expect(result?.phone).toBe('3001234567');
    });

    it('debe retornar null si no existe', async () => {
      prisma.customer.findUnique.mockResolvedValue(null);
      const result = await service.findByPhone('0000000000');
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('debe actualizar un cliente', async () => {
      prisma.customer.findUnique.mockResolvedValue(mockCustomer);
      prisma.customer.findFirst.mockResolvedValue(null);
      prisma.customer.update.mockResolvedValue({ ...mockCustomer, city: 'Medellín' });

      const result = await service.update('cust-1', { city: 'Medellín' });
      expect(result.city).toBe('Medellín');
    });
  });

  describe('remove', () => {
    it('debe desactivar un cliente', async () => {
      prisma.customer.findUnique.mockResolvedValue(mockCustomer);
      prisma.customer.update.mockResolvedValue({ ...mockCustomer, active: false });

      const result = await service.remove('cust-1');
      expect(result.active).toBe(false);
    });
  });
});
