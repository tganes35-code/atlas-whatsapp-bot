import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../database/prisma.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/create-order.dto';

const SHIPPING_COST = 10000; // COP fijo para esta versión

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createFromCart(dto: CreateOrderDto) {
    const cart = await this.prisma.cart.findFirst({
      where: { customerId: dto.customerId, status: 'ACTIVE' },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('El carrito está vacío');
    }

    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
    });
    if (!customer) throw new NotFoundException('Cliente no encontrado');

    // Validar stock antes de crear el pedido
    for (const item of cart.items) {
      const product = item.product;
      if (!product.active) {
        throw new BadRequestException(
          `El producto "${product.name}" ya no está disponible`,
        );
      }

      const availableStock = item.variantId
        ? (item.variant?.stock ?? 0)
        : product.stock;

      if (availableStock < item.quantity) {
        throw new BadRequestException(
          `Stock insuficiente para "${product.name}". Disponible: ${availableStock}`,
        );
      }
    }

    // Calcular totales en BACKEND (nunca confiar en el cliente)
    const subtotal = cart.items.reduce(
      (sum, item) => sum + Number(item.subtotal),
      0,
    );
    const shipping = SHIPPING_COST;
    const total = subtotal + shipping;

    // Crear el pedido dentro de una transacción
    const order = await this.prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          customerId: dto.customerId,
          paymentMethod: dto.paymentMethod,
          shippingAddress: dto.shippingAddress ?? customer.address ?? '',
          notes: dto.notes,
          subtotal: new Decimal(subtotal),
          shipping: new Decimal(shipping),
          total: new Decimal(total),
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              variantId: item.variantId ?? null,
              productName: item.product.name,
              variantInfo: item.variant
                ? `${item.variant.name}: ${item.variant.value}`
                : null,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              subtotal: item.subtotal,
            })),
          },
          statusHistory: {
            create: [
              {
                status: OrderStatus.PENDING,
                notes: 'Pedido creado',
                changedBy: 'BOT',
              },
            ],
          },
        },
        include: {
          items: true,
          statusHistory: true,
          customer: { select: { id: true, name: true, phone: true } },
        },
      });

      // Descontar stock
      for (const item of cart.items) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } },
          });
        } else {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        }
      }

      // Marcar carrito como convertido
      await tx.cart.update({
        where: { id: cart.id },
        data: { status: 'CONVERTED' },
      });

      return newOrder;
    });

    this.logger.log(
      `Pedido creado: ${order.id} | Cliente: ${customer.name} | Total: $${total}`,
    );

    return order;
  }

  async findAll(options?: {
    status?: OrderStatus;
    customerId?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, customerId, page = 1, limit = 20 } = options ?? {};
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          items: true,
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        items: {
          include: {
            product: { select: { id: true, name: true, image: true } },
            variant: true,
          },
        },
        statusHistory: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!order) throw new NotFoundException('Pedido no encontrado');
    return order;
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto, changedBy?: string) {
    const order = await this.findOne(id);

    const validStatus = Object.values(OrderStatus);
    if (!validStatus.includes(dto.status as OrderStatus)) {
      throw new BadRequestException('Estado inválido');
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: {
        status: dto.status as OrderStatus,
        statusHistory: {
          create: {
            status: dto.status as OrderStatus,
            notes: dto.notes,
            changedBy: changedBy ?? 'SYSTEM',
          },
        },
      },
      include: {
        items: true,
        statusHistory: { orderBy: { createdAt: 'asc' } },
        customer: { select: { id: true, name: true, phone: true } },
      },
    });

    this.logger.log(`Pedido ${id} → ${dto.status}`);
    return updatedOrder;
  }
}
