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
    this.logger.log(
      `Proveedor IA activo: ${hasApiKey ? 'OpenAI' : 'MockAI (sin API key)'}`,
    );
  }

  getProviderName(): string {
    return this.config.get<string>('OPENAI_API_KEY') ? 'openai' : 'mock';
  }

  async processMessage(
    conversationId: string,
    userMessage: string,
    currentMessageId?: string,
  ): Promise<string> {
    const history = await this.prisma.message.findMany({
      where: {
        conversationId,
        ...(currentMessageId ? { id: { not: currentMessageId } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    history.reverse();

    const normalizedMessage = userMessage.toLocaleLowerCase('es');
    const asksAboutProducts =
      /\b(product|catálogo|catalogo|camiseta|gorra|chaqueta|pantal[oó]n|precio|stock|disponible)\w*\b/i.test(
        normalizedMessage,
      );
    const asksForCatalog =
      /\b(productos|catálogo|catalogo|qué tienen|que tienen|ver productos)\b/i.test(
        normalizedMessage,
      );
    const products = asksAboutProducts
      ? await this.productsService.searchForBot(
          asksForCatalog ? '' : userMessage,
        )
      : [];
    const catalogContext = products.length
      ? `\n\nInformación actual del catálogo (úsala como única fuente para precios y existencias):\n${products
          .map(
            (product) =>
              `- ${product.name}; categoría: ${product.category.name}; SKU: ${product.sku}; precio: ${product.price.toString()}; unidades disponibles: ${product.stock}; variantes: ${product.variants.map((variant) => `${variant.name} ${variant.value} (${variant.stock} unidades)`).join(', ') || 'ninguna'}`,
          )
          .join('\n')}`
      : asksAboutProducts
        ? '\n\nNo se encontraron productos coincidentes en el catálogo. No inventes productos, precios ni existencias; indícalo amablemente y ofrece pasar la consulta a un asesor.'
        : '';

    const historyMessages: ChatMessage[] = history.flatMap((message) => [
      {
        role: (message.sender === 'CUSTOMER' ? 'user' : 'assistant') as
          'user' | 'assistant',
        content: message.content,
      },
      ...(message.botResponseSentAt && message.botResponse
        ? [{ role: 'assistant' as const, content: message.botResponse }]
        : []),
    ]);

    const chatMessages: ChatMessage[] = [
      {
        role: 'system',
        content: `Eres un asistente de atención al cliente de una empresa. Responde en español, con amabilidad y concisión. Usa el historial para entender el contexto. No inventes políticas, horarios, direcciones, productos, pedidos ni capacidades que no estén en la información proporcionada. Si no conoces la respuesta, dilo con claridad y ofrece ayuda de un asesor.${catalogContext}`,
      },
      ...historyMessages,
      { role: 'user', content: userMessage },
    ];

    const response = await this.aiProvider.chat(chatMessages, []);
    const content = response.content?.trim();
    if (!content) {
      this.logger.error('El proveedor de IA devolvió una respuesta vacía');
      throw new Error('El proveedor de IA devolvió una respuesta vacía');
    }
    return content;
  }
}
