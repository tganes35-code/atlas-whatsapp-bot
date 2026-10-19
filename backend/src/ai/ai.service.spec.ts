import { ConfigService } from '@nestjs/config';
import { AiService } from './ai.service';
import { PrismaService } from '../database/prisma.service';
import { ProductsService } from '../products/products.service';
import { OpenAiProvider } from './providers/openai.provider';
import { MockAiProvider } from './providers/mock-ai.provider';

describe('AiService', () => {
  const catalogProduct = {
    name: 'Camiseta azul',
    sku: 'CAM-001',
    price: { toString: () => '45000.00' },
    stock: 3,
    category: { name: 'Camisetas' },
    variants: [{ name: 'Talla', value: 'M', stock: 2 }],
  };

  function createService(localMode: string, apiKey?: string) {
    const config = {
      get: jest.fn((key: string) => {
        if (key === 'LOCAL_MODE') return localMode;
        if (key === 'OPENAI_API_KEY') return apiKey;
        return undefined;
      }),
    } as unknown as ConfigService;
    const prisma = {
      message: { findMany: jest.fn().mockResolvedValue([]) },
    } as unknown as PrismaService;
    const products = {
      searchForBot: jest.fn().mockResolvedValue([catalogProduct]),
    } as unknown as ProductsService;
    const openAiChat = jest
      .fn()
      .mockResolvedValue({ content: 'Respuesta de prueba' });
    const openAi = {
      chat: openAiChat,
    } as unknown as OpenAiProvider;
    const mockAiChat = jest
      .fn()
      .mockResolvedValue({ content: 'Respuesta local' });
    const mockAi = {
      chat: mockAiChat,
    } as unknown as MockAiProvider;

    return {
      service: new AiService(config, prisma, products, openAi, mockAi),
      prisma,
      products,
      openAiChat,
      mockAiChat,
    };
  }

  it('includes catalog facts for product questions and excludes the current message from history', async () => {
    const { service, prisma, products, openAiChat } = createService(
      'false',
      'test-key',
    );

    await expect(
      service.processMessage(
        'conversation-1',
        '¿Cuánto cuesta la camiseta?',
        'message-1',
      ),
    ).resolves.toBe('Respuesta de prueba');

    expect(products.searchForBot).toHaveBeenCalledWith(
      '¿Cuánto cuesta la camiseta?',
    );
    expect(prisma.message.findMany).toHaveBeenCalledWith({
      where: { conversationId: 'conversation-1', id: { not: 'message-1' } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    const systemMessage = openAiChat.mock.calls[0][0][0];
    expect(systemMessage.content).toContain('Camiseta azul');
    expect(systemMessage.content).toContain('45000.00');
    expect(
      openAiChat.mock.calls[0][0].filter((message) => message.role === 'user'),
    ).toHaveLength(1);
  });

  it('uses MockAI in WhatsApp production mode when no OpenAI key is configured', async () => {
    const { service, openAiChat, mockAiChat } = createService('false');

    await expect(
      service.processMessage('conversation-1', 'Hola'),
    ).resolves.toBe('Respuesta local');
    expect(mockAiChat).toHaveBeenCalledTimes(1);
    expect(openAiChat).not.toHaveBeenCalled();
  });

  it('uses MockAI only in local mode', async () => {
    const { service, openAiChat, mockAiChat } = createService('true');

    await expect(
      service.processMessage('conversation-1', 'Hola'),
    ).resolves.toBe('Respuesta local');
    expect(mockAiChat).toHaveBeenCalledTimes(1);
    expect(openAiChat).not.toHaveBeenCalled();
  });
});
