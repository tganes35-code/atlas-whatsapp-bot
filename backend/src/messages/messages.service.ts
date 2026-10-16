import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AiService } from '../ai/ai.service';
import { ProcessMessageDto } from './dto/send-message.dto';

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  async processIncomingMessage(dto: ProcessMessageDto) {
    // Encontrar o crear cliente por teléfono
    let customer = await this.prisma.customer.findUnique({
      where: { phone: dto.phone },
    });

    if (!customer) {
      customer = await this.prisma.customer.create({
        data: {
          phone: dto.phone,
          name: `Cliente ${dto.phone}`,
        },
      });
    }

    // Encontrar conversación abierta del cliente
    let conversation = await this.prisma.conversation.findFirst({
      where: {
        customerId: customer.id,
        status: 'OPEN',
      },
    });

    // Si no existe, crear nueva
    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          customerId: customer.id,
          status: 'OPEN',
          channel: (dto.channel ?? 'LOCAL') as any,
        },
      });
    }

    // Guardar mensaje del cliente
    await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        content: dto.message,
        sender: 'CUSTOMER',
      },
    });

    // Procesar con IA
    let botResponse = '';
    try {
      botResponse = await this.aiService.processMessage(
        conversation.id,
        customer.id,
        dto.message,
      );
    } catch (error: any) {
      this.logger.error('Error procesando mensaje:', error.message);
      botResponse = 'Lo siento, tuve un problema. Por favor intenta de nuevo.';
    }

    // Guardar respuesta del bot
    if (botResponse) {
      await this.prisma.message.create({
        data: {
          conversationId: conversation.id,
          content: botResponse,
          sender: 'BOT',
        },
      });
    }

    this.logger.log(`[${customer.phone}] "${dto.message.substring(0, 40)}" → BOT: "${botResponse?.substring(0, 60)}"`);

    return {
      conversationId: conversation.id,
      customerId: customer.id,
      phoneNumber: customer.phone,
      botResponse,
    };
  }
}
