import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AddToCartDto, UpdateCartItemDto } from './dto/add-to-cart.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class CartsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateActiveCart(customerId: string) {
    let cart = await this.prisma.cart.findFirst({
      where: { customerId, status: 'ACTIVE' },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, price: true, image: true, stock: true } },
            variant: true,
          },
        },
      },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { customerId },
        include: {
          items: {
            include: {
              product: { select: { id: true, name: true, price: true, image: true, stock: true } },
              variant: true,
            },
          },
        },
      });
    }

    return this.enrichCart(cart);
  }

  async addItem(customerId: string, dto: AddToCartDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      include: { variants: true },
    });

    if (!product || !product.active) {
      throw new NotFoundException('Producto no encontrado o inactivo');
    }

    let unitPrice = Number(product.price);
    let availableStock = product.stock;

    if (dto.variantId) {
      const variant = product.variants.find((v) => v.id === dto.variantId);
      if (!variant || !variant.active) {
        throw new NotFoundException('Variante no encontrada o inactiva');
      }
      unitPrice += Number(variant.priceModifier);
      availableStock = variant.stock;
    }

    if (availableStock < dto.quantity) {
      throw new BadRequestException(
        `Stock insuficiente. Disponible: ${availableStock}`,
      );
    }

    const cart = await this.getOrCreateActiveCartRaw(customerId);

    const existingItem = cart.items.find(
      (i) => i.productId === dto.productId && i.variantId === (dto.variantId ?? null),
    );

    if (existingItem) {
      const newQuantity = existingItem.quantity + dto.quantity;
      if (availableStock < newQuantity) {
        throw new BadRequestException(
          `Stock insuficiente para la cantidad total. Disponible: ${availableStock}`,
        );
      }
      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: newQuantity,
          subtotal: new Decimal(unitPrice * newQuantity),
        },
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: dto.productId,
          variantId: dto.variantId ?? null,
          quantity: dto.quantity,
          unitPrice: new Decimal(unitPrice),
          subtotal: new Decimal(unitPrice * dto.quantity),
        },
      });
    }

    return this.getOrCreateActiveCart(customerId);
  }

  async updateItem(customerId: string, itemId: string, dto: UpdateCartItemDto) {
    const cart = await this.getOrCreateActiveCartRaw(customerId);
    const item = cart.items.find((i) => i.id === itemId);

    if (!item) throw new NotFoundException('Item no encontrado en el carrito');

    if (dto.quantity === 0) {
      await this.prisma.cartItem.delete({ where: { id: itemId } });
    } else {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
        include: { variants: true },
      });

      let availableStock = product?.stock ?? 0;
      if (item.variantId) {
        const variant = product?.variants.find((v) => v.id === item.variantId);
        availableStock = variant?.stock ?? 0;
      }

      if (availableStock < dto.quantity) {
        throw new BadRequestException(
          `Stock insuficiente. Disponible: ${availableStock}`,
        );
      }

      await this.prisma.cartItem.update({
        where: { id: itemId },
        data: {
          quantity: dto.quantity,
          subtotal: new Decimal(Number(item.unitPrice) * dto.quantity),
        },
      });
    }

    return this.getOrCreateActiveCart(customerId);
  }

  async removeItem(customerId: string, itemId: string) {
    const cart = await this.getOrCreateActiveCartRaw(customerId);
    const item = cart.items.find((i) => i.id === itemId);
    if (!item) throw new NotFoundException('Item no encontrado en el carrito');

    await this.prisma.cartItem.delete({ where: { id: itemId } });
    return this.getOrCreateActiveCart(customerId);
  }

  async clearCart(customerId: string) {
    const cart = await this.getOrCreateActiveCartRaw(customerId);
    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return this.getOrCreateActiveCart(customerId);
  }

  private async getOrCreateActiveCartRaw(customerId: string) {
    let cart = await this.prisma.cart.findFirst({
      where: { customerId, status: 'ACTIVE' },
      include: { items: true },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { customerId },
        include: { items: true },
      });
    }

    return cart;
  }

  private enrichCart(cart: any) {
    const subtotal = cart.items.reduce(
      (sum: number, item: any) => sum + Number(item.subtotal),
      0,
    );
    const itemCount = cart.items.reduce(
      (sum: number, item: any) => sum + item.quantity,
      0,
    );

    return {
      ...cart,
      subtotal,
      itemCount,
    };
  }
}
