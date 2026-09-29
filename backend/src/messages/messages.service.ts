import { Injectable, Logger } from '@nestjs/common';
import { ConversationStatus, MessageSender, ConversationChannel } from '@prisma/client';
import { ConversationsService } from '../conversations/conversations.service';
import { AiService } from '../ai/ai.service';
import { ProcessMessageDto } from './dto/send-message.dto';

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(
    private readonly conversationsService: ConversationsService,
    private readonly aiService: AiService,
  ) {}

  /**
   * Punto de entrada central para TODOS los mensajes del chatbot.
   * Simulador local y WhatsApp usan este mismo método.
   *
   * Flujo:
   * 1. Buscar/crear conversación OPEN (nunca reutilizar HUMAN)
   * 2. Guardar mensaje del cliente
   * 3. Si está en HUMAN → silencio, el agente atiende manualmente
   * 4. Pasar por el motor de lógica → IA como fallback
   * 5. Guardar respuesta del bot
   */
  async processIncomingMessage(dto: ProcessMessageDto) {
    const channel = ((dto.channel ?? 'LOCAL').toUpperCase() as ConversationChannel);

    // 1. Obtener o crear conversación (findOrCreateByPhone ya NO reutiliza HUMAN)
    const { conversation, customer } =
      await this.conversationsService.findOrCreateByPhone(dto.phone, channel);

    // 2. Guardar el mensaje del cliente
    await this.conversationsService.addMessage(
      conversation.id,
      MessageSender.CUSTOMER,
      dto.message,
    );

    // 3. Si está en HUMAN — el agente atiende, el bot no interviene
    if (conversation.status === ConversationStatus.HUMAN) {
      this.logger.log(
        `Conversación ${conversation.id} en HUMAN — esperando agente`,
      );
      return {
        conversationId: conversation.id,
        customerId: customer.id,
        botResponse: null,
        humanMode: true,
      };
    }

    // 4. Procesar con el motor lógico (lógica de reglas + IA como fallback)
    let botResponse = '';
    try {
      botResponse = await this.aiService.processMessage(
        conversation.id,
        customer.id,
        dto.message,
      );
    } catch (error: any) {
      this.logger.error('Error en motor de chat:', error.message);
      botResponse =
        'Lo siento, tuve un problema procesando tu mensaje. Por favor intenta de nuevo. 🙏';
    }

    // 5. Verificar si durante el procesamiento se activó el handoff a HUMAN
    const updatedConv = await this.conversationsService
      .findOne(conversation.id)
      .catch(() => conversation);

    const wentHuman = updatedConv.status === ConversationStatus.HUMAN;

    // 6. Guardar la respuesta del bot (sea handoff o respuesta normal)
    if (botResponse) {
      await this.conversationsService.addMessage(
        conversation.id,
        MessageSender.BOT,
        botResponse,
      );
    }

    this.logger.log(
      `[${customer.phone}] "${dto.message.substring(0, 40)}" → ${wentHuman ? 'HUMAN' : 'BOT'}: "${botResponse?.substring(0, 60) ?? 'null'}"`,
    );

    return {
      conversationId: conversation.id,
      customerId: customer.id,
      botResponse,
      humanMode: wentHuman,
    };
  }
}
