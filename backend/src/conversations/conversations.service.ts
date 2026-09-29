import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import {
  ConversationStatus,
  ConversationChannel,
  MessageSender,
  MessageType,
} from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import {
  AssignAgentDto,
  CreateConversationDto,
  SendMessageDto,
} from './dto/create-conversation.dto';

@Injectable()
export class ConversationsService {
  private readonly logger = new Logger(ConversationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateConversationDto) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
    });
    if (!customer) throw new NotFoundException('Cliente no encontrado');

    const existing = await this.prisma.conversation.findFirst({
      where: {
        customerId: dto.customerId,
        status: { in: [ConversationStatus.OPEN, ConversationStatus.WAITING] },
      },
    });
    if (existing) return existing;

    return this.prisma.conversation.create({
      data: {
        customerId: dto.customerId,
        channel: dto.channel ?? ConversationChannel.LOCAL,
        status: ConversationStatus.OPEN,
      },
      include: {
        customer: true,
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });
  }

  async findAll(options?: {
    status?: ConversationStatus;
    channel?: ConversationChannel;
    page?: number;
    limit?: number;
  }) {
    const { status, channel, page = 1, limit = 20 } = options ?? {};
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (channel) where.channel = channel;

    const [data, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          assignedUser: { select: { id: true, name: true, email: true } },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          _count: { select: { messages: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.conversation.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const conv = await this.prisma.conversation.findUnique({
      where: { id },
      include: {
        customer: true,
        assignedUser: { select: { id: true, name: true, email: true } },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!conv) throw new NotFoundException('Conversación no encontrada');
    return conv;
  }

  /**
   * Busca o crea conversación por teléfono.
   * IMPORTANTE: NO reutiliza conversaciones en HUMAN — esas las deja
   * para el agente y crea una nueva conversación activa si es necesario.
   * Si la conversación está CLOSED también crea una nueva.
   */
  async findOrCreateByPhone(
    phone: string,
    channel: ConversationChannel = ConversationChannel.LOCAL,
  ) {
    // Buscar o crear cliente
    let customer = await this.prisma.customer.findUnique({ where: { phone } });
    if (!customer) {
      customer = await this.prisma.customer.create({
        data: { name: `Cliente ${phone}`, phone },
      });
    }

    // Solo reutilizar conversaciones OPEN o WAITING — NUNCA HUMAN
    const existing = await this.prisma.conversation.findFirst({
      where: {
        customerId: customer.id,
        status: { in: [ConversationStatus.OPEN, ConversationStatus.WAITING] },
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        customer: true,
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (existing) return { conversation: existing, customer };

    // Crear nueva conversación (sea que la anterior era HUMAN, CLOSED o no existía)
    const conv = await this.prisma.conversation.create({
      data: { customerId: customer.id, channel, status: ConversationStatus.OPEN },
      include: {
        customer: true,
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    return { conversation: conv, customer };
  }

  async addMessage(
    conversationId: string,
    sender: MessageSender,
    content: string,
    type: MessageType = MessageType.TEXT,
    metadata?: any,
  ) {
    const message = await this.prisma.message.create({
      data: {
        conversationId,
        sender,
        content,
        type,
        metadata: metadata ?? undefined,
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return message;
  }

  async sendAgentMessage(
    conversationId: string,
    dto: SendMessageDto,
    agentId: string,
  ) {
    const conv = await this.findOne(conversationId);
    const message = await this.addMessage(conv.id, MessageSender.AGENT, dto.content);
    this.logger.log(`Agente ${agentId} respondió en conversación ${conversationId}`);
    return message;
  }

  async assignAgent(conversationId: string, dto: AssignAgentDto) {
    await this.findOne(conversationId);

    const agent = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!agent) throw new NotFoundException('Agente no encontrado');

    const updated = await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { assignedUserId: dto.userId },
      include: {
        customer: true,
        assignedUser: { select: { id: true, name: true, email: true } },
      },
    });

    await this.addMessage(
      conversationId,
      MessageSender.SYSTEM,
      `Conversación asignada a ${agent.name}`,
    );

    return updated;
  }

  async handoffToHuman(conversationId: string) {
    const conv = await this.findOne(conversationId);

    const updated = await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { status: ConversationStatus.HUMAN },
      include: { customer: true },
    });

    await this.addMessage(
      conversationId,
      MessageSender.SYSTEM,
      '🔔 El cliente solicita hablar con un asesor. La conversación fue transferida.',
    );

    this.logger.log(
      `Conversación ${conversationId} → HUMAN (${conv.customer.name})`,
    );
    return updated;
  }

  async returnToBot(conversationId: string) {
    await this.findOne(conversationId);

    const updated = await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { status: ConversationStatus.OPEN, assignedUserId: null },
      include: { customer: true },
    });

    await this.addMessage(
      conversationId,
      MessageSender.SYSTEM,
      '🤖 La conversación fue devuelta al bot.',
    );

    return updated;
  }

  async closeConversation(conversationId: string) {
    await this.findOne(conversationId);

    const updated = await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { status: ConversationStatus.CLOSED },
    });

    await this.addMessage(
      conversationId,
      MessageSender.SYSTEM,
      '✅ Conversación cerrada.',
    );

    return updated;
  }

  async getMessages(conversationId: string) {
    await this.findOne(conversationId);
    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
