import { Injectable, Logger } from '@nestjs/common';
import { ConversationChannel, Prisma } from '@prisma/client';
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

  async processIncomingMessage(
    dto: ProcessMessageDto,
    whatsappMessageId?: string,
  ) {
    const existingMessage = whatsappMessageId
      ? await this.prisma.message.findUnique({ where: { whatsappMessageId } })
      : null;

    let incomingMessage = existingMessage;
    let conversationId = existingMessage?.conversationId;
    if (!incomingMessage) {
      let conversation = await this.prisma.conversation.findFirst({
        where: { phone: dto.phone, status: 'OPEN' },
      });
      if (!conversation) {
        conversation = await this.prisma.conversation.create({
          data: {
            phone: dto.phone,
            status: 'OPEN',
            channel: dto.channel ?? ConversationChannel.WHATSAPP,
          },
        });
      }
      conversationId = conversation.id;

      try {
        incomingMessage = await this.prisma.message.create({
          data: {
            conversationId,
            content: dto.message,
            sender: 'CUSTOMER',
            whatsappMessageId,
          },
        });
      } catch (error) {
        if (
          !(error instanceof Prisma.PrismaClientKnownRequestError) ||
          error.code !== 'P2002' ||
          !whatsappMessageId
        ) {
          throw error;
        }

        incomingMessage = await this.prisma.message.findUnique({
          where: { whatsappMessageId },
        });
        if (!incomingMessage) {
          throw error;
        }
        conversationId = incomingMessage.conversationId;
      }
    }

    if (incomingMessage.botResponseSentAt) {
      return {
        conversationId,
        phoneNumber: dto.phone,
        messageId: incomingMessage.id,
        botResponse: incomingMessage.botResponse ?? '',
        shouldSend: false,
      };
    }

    const botResponse =
      incomingMessage.botResponse ??
      (await this.aiService.processMessage(
        conversationId,
        incomingMessage.content,
        incomingMessage.id,
      ));

    if (!incomingMessage.botResponse) {
      await this.prisma.message.update({
        where: { id: incomingMessage.id },
        data: { botResponse },
      });
    }

    this.logger.log(
      `[${dto.phone}] mensaje recibido; respuesta preparada (${botResponse.length} caracteres)`,
    );

    return {
      conversationId,
      phoneNumber: dto.phone,
      messageId: incomingMessage.id,
      botResponse,
      shouldSend: Boolean(botResponse),
    };
  }

  async markBotResponseSent(messageId: string) {
    await this.prisma.message.updateMany({
      where: { id: messageId, botResponseSentAt: null },
      data: { botResponseSentAt: new Date() },
    });
  }
}
