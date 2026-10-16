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
    // Encontrar conversación abierta por teléfono
    let conversation = await this.prisma.conversation.findFirst({
      where: {
        phone: dto.phone,
        status: 'OPEN',
      },
    });

    // Si no existe, crear nueva
    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          phone: dto.phone,
          status: 'OPEN',
          channel: (dto.channel ?? 'WHATSAPP') as any,
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
        dto.phone,
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

    this.logger.log(`[${conversation.phone}] "${dto.message.substring(0, 40)}" → BOT: "${botResponse?.substring(0, 60)}"`);

    return {
      conversationId: conversation.id,
      phoneNumber: conversation.phone,
      botResponse,
    };
  }
}
