import { Prisma } from '@prisma/client';
import { AiService } from '../ai/ai.service';
import { PrismaService } from '../database/prisma.service';
import { MessagesService } from './messages.service';

describe('MessagesService WhatsApp retry handling', () => {
  it('reuses the stored reply after a webhook retry and skips replies already sent', async () => {
    const conversation = { id: 'conversation-1', phone: '1001' };
    const incomingMessage = {
      id: 'message-1',
      conversationId: 'conversation-1',
      content: 'Hola',
      botResponse: null,
      botResponseSentAt: null,
    };
    const prisma = {
      conversation: {
        findFirst: jest.fn().mockResolvedValue(conversation),
      },
      message: {
        create: jest.fn().mockResolvedValue(incomingMessage),
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue(undefined),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    } as unknown as PrismaService;
    const aiService = {
      processMessage: jest.fn().mockResolvedValue('Respuesta guardada'),
    } as unknown as AiService;
    const service = new MessagesService(prisma, aiService);

    const first = await service.processIncomingMessage(
      { phone: '1001', message: 'Hola', channel: 'WHATSAPP' },
      'wamid.1',
    );
    expect(first.shouldSend).toBe(true);
    expect(prisma.message.update).toHaveBeenCalledWith({
      where: { id: 'message-1' },
      data: { botResponse: 'Respuesta guardada' },
    });

    (prisma.message.create as jest.Mock).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Duplicate message', {
        code: 'P2002',
        clientVersion: '5.22.0',
      }),
    );
    (prisma.message.findUnique as jest.Mock).mockResolvedValue({
      ...incomingMessage,
      botResponse: 'Respuesta guardada',
    });

    const retry = await service.processIncomingMessage(
      { phone: '1001', message: 'Hola', channel: 'WHATSAPP' },
      'wamid.1',
    );
    expect(retry.botResponse).toBe('Respuesta guardada');
    expect(retry.shouldSend).toBe(true);
    expect(aiService.processMessage).toHaveBeenCalledTimes(1);

    (prisma.message.findUnique as jest.Mock).mockResolvedValue({
      ...incomingMessage,
      botResponse: 'Respuesta guardada',
    });
    const duplicate = await service.processIncomingMessage(
      { phone: '1001', message: 'Hola', channel: 'WHATSAPP' },
      'wamid.1',
    );
    expect(duplicate.conversationId).toBe('conversation-1');
    expect(prisma.conversation.findFirst).toHaveBeenCalledTimes(1);

    (prisma.message.findUnique as jest.Mock).mockResolvedValue({
      ...incomingMessage,
      botResponse: 'Respuesta guardada',
      botResponseSentAt: new Date(),
    });
    const alreadySent = await service.processIncomingMessage(
      { phone: '1001', message: 'Hola', channel: 'WHATSAPP' },
      'wamid.1',
    );
    expect(alreadySent.shouldSend).toBe(false);
  });
});
