import { UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { MessagesService } from '../messages/messages.service';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappService } from './whatsapp.service';

describe('WhatsappController', () => {
  const rawBody = Buffer.from('{"entry":[]}');
  let whatsappService: jest.Mocked<
    Pick<
      WhatsappService,
      'isValidWebhookSignature' | 'parseWebhookMessages' | 'sendTextMessage'
    >
  >;
  let messagesService: jest.Mocked<
    Pick<MessagesService, 'processIncomingMessage' | 'markBotResponseSent'>
  >;
  let controller: WhatsappController;

  beforeEach(() => {
    whatsappService = {
      isValidWebhookSignature: jest.fn().mockReturnValue(true),
      parseWebhookMessages: jest.fn().mockReturnValue([]),
      sendTextMessage: jest.fn().mockResolvedValue(undefined),
    };
    messagesService = {
      processIncomingMessage: jest.fn(),
      markBotResponseSent: jest.fn().mockResolvedValue(undefined),
    };
    controller = new WhatsappController(
      whatsappService as unknown as WhatsappService,
      messagesService as unknown as MessagesService,
    );
  });

  it('rejects requests with a missing or invalid signature', async () => {
    whatsappService.isValidWebhookSignature.mockReturnValue(false);

    await expect(
      controller.receiveMessage({}, {
        rawBody,
        headers: { 'x-hub-signature-256': 'invalid' },
      } as unknown as Request),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(messagesService.processIncomingMessage).not.toHaveBeenCalled();
  });

  it('sends each parsed message and marks its saved response as sent', async () => {
    whatsappService.parseWebhookMessages.mockReturnValue([
      { id: 'wamid.1', phone: '1001', message: 'Hola' },
      { id: 'wamid.2', phone: '1002', message: 'Precio' },
    ]);
    messagesService.processIncomingMessage
      .mockResolvedValueOnce({
        messageId: 'message-1',
        botResponse: 'Hola',
        shouldSend: true,
      } as Awaited<ReturnType<MessagesService['processIncomingMessage']>>)
      .mockResolvedValueOnce({
        messageId: 'message-2',
        botResponse: '¿Qué producto?',
        shouldSend: true,
      } as Awaited<ReturnType<MessagesService['processIncomingMessage']>>);

    const result = await controller.receiveMessage({}, {
      rawBody,
      headers: { 'x-hub-signature-256': 'valid' },
    } as unknown as Request);

    expect(result).toEqual({ status: 'ok' });
    expect(whatsappService.sendTextMessage.mock.calls).toEqual([
      ['1001', 'Hola'],
      ['1002', '¿Qué producto?'],
    ]);
    expect(messagesService.markBotResponseSent.mock.calls).toEqual([
      ['message-1'],
      ['message-2'],
    ]);
  });

  it('does not acknowledge a failed Meta send as success', async () => {
    whatsappService.parseWebhookMessages.mockReturnValue([
      { id: 'wamid.1', phone: '1001', message: 'Hola' },
    ]);
    messagesService.processIncomingMessage.mockResolvedValue({
      messageId: 'message-1',
      botResponse: 'Hola',
      shouldSend: true,
    } as Awaited<ReturnType<MessagesService['processIncomingMessage']>>);
    whatsappService.sendTextMessage.mockRejectedValue(
      new Error('Meta send failed'),
    );

    await expect(
      controller.receiveMessage({}, {
        rawBody,
        headers: { 'x-hub-signature-256': 'valid' },
      } as unknown as Request),
    ).rejects.toThrow('Meta send failed');
    expect(messagesService.markBotResponseSent).not.toHaveBeenCalled();
  });
});
