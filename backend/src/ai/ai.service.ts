import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { ProductsService } from '../products/products.service';
import { AiProvider, ChatMessage } from './interfaces/ai-provider.interface';
import { OpenAiProvider } from './providers/openai.provider';
import { MockAiProvider } from './providers/mock-ai.provider';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly aiProvider: AiProvider;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly productsService: ProductsService,
    private readonly openAiProvider: OpenAiProvider,
    private readonly mockAiProvider: MockAiProvider,
  ) {
    const hasApiKey = !!this.config.get<string>('OPENAI_API_KEY');
    this.aiProvider = hasApiKey ? this.openAiProvider : this.mockAiProvider;
    this.logger.log(`Proveedor IA activo: ${hasApiKey ? 'OpenAI' : 'MockAI (sin API key)'}`);
  }

  getProviderName(): string {
    return this.config.get<string>('OPENAI_API_KEY') ? 'openai' : 'mock';
  }

  async processMessage(
    conversationId: string,
    customerId: string,
    userMessage: string,
  ): Promise<string> {
    try {
      // Obtener contexto de historial
      const history = await this.prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });
      history.reverse();

      const chatMessages: ChatMessage[] = [
        {
          role: 'system',
          content: `Eres un asistente de chatbot para una tienda. Responde en español. Sé amable y conciso. Si el usuario pregunta por productos, ayuda con información general de la tienda.`,
        },
        ...history.map((m) => ({
          role: (m.sender === 'CUSTOMER' ? 'user' : 'assistant') as 'user' | 'assistant',
          content: m.content,
        })),
        { role: 'user', content: userMessage },
      ];

      const response = await this.aiProvider.chat(chatMessages, []);
      return response.content || 'No entendí tu mensaje. Por favor intenta de nuevo.';
    } catch (error: any) {
      this.logger.error('Error procesando mensaje:', error.message);
      return 'Lo siento, tuve un problema procesando tu mensaje. Por favor intenta de nuevo.';
    }
  }
}
