import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { OrderStatus, ConversationStatus } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalCustomers,
      totalProducts,
      pendingOrders,
      ordersToday,
      openConversations,
      humanConversations,
      salesTodayAgg,
      latestOrders,
      latestConversations,
    ] = await Promise.all([
      this.prisma.customer.count({ where: { active: true } }),
      this.prisma.product.count({ where: { active: true } }),
      this.prisma.order.count({ where: { status: OrderStatus.PENDING } }),
      this.prisma.order.count({
        where: {
          createdAt: { gte: today, lt: tomorrow },
          status: { not: OrderStatus.CANCELLED },
        },
      }),
      this.prisma.conversation.count({
        where: { status: ConversationStatus.OPEN },
      }),
      this.prisma.conversation.count({
        where: { status: ConversationStatus.HUMAN },
      }),
      this.prisma.order.aggregate({
        where: {
          createdAt: { gte: today, lt: tomorrow },
          status: { not: OrderStatus.CANCELLED },
        },
        _sum: { total: true },
      }),
      this.prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true, phone: true } },
        },
      }),
      this.prisma.conversation.findMany({
        take: 5,
        orderBy: { updatedAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }),
    ]);

    return {
      totals: {
        customers: totalCustomers,
        products: totalProducts,
        pendingOrders,
        ordersToday,
        openConversations,
        humanConversations,
        salesToday: Number(salesTodayAgg._sum.total ?? 0),
      },
      latestOrders,
      latestConversations,
    };
  }
}
