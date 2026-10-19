import { Injectable, Logger } from '@nestjs/common';
import {
  AiProvider,
  AiResponse,
  ChatMessage,
} from '../interfaces/ai-provider.interface';

/**
 * MockAIProvider — se usa cuando no hay OPENAI_API_KEY configurada.
 * Implementa un sistema de reglas simple que permite probar TODO el flujo
 * del chatbot sin pagar API.
 */
@Injectable()
export class MockAiProvider implements AiProvider {
  private readonly logger = new Logger(MockAiProvider.name);

  isAvailable(): boolean {
    return true; // Siempre disponible
  }

  async chat(messages: ChatMessage[]): Promise<AiResponse> {
    this.logger.debug('MockAI procesando mensaje...');

    const lastUserMessage =
      messages
        .filter((m) => m.role === 'user')
        .pop()
        ?.content?.toLowerCase() ?? '';

    // ─── Detección de intenciones ───────────────────────────────

    // Saludo
    if (
      this.matches(lastUserMessage, [
        'hola',
        'buenas',
        'buenos días',
        'hey',
        'hi',
        'hello',
        'buen día',
      ])
    ) {
      return this.response('¡Hola! ¿En qué puedo ayudarte hoy?');
    }

    if (
      this.matches(lastUserMessage, [
        'asesor',
        'persona',
        'humano',
        'agente',
        'hablar con alguien',
        'quiero hablar con',
      ])
    ) {
      return this.response(
        'No puedo transferirte automáticamente en este momento. Cuéntame brevemente qué necesitas y te indicaré cómo continuar.',
      );
    }

    if (
      this.matches(lastUserMessage, [
        'carrito',
        'mi carrito',
        'qué tengo',
        'que tengo',
        'mi pedido actual',
      ])
    ) {
      return this.response(
        'Todavía no puedo consultar un carrito desde este chat. Si me dices qué producto te interesa, puedo ayudarte con la información disponible.',
      );
    }

    if (
      this.matches(lastUserMessage, [
        'quiero comprar',
        'confirmar',
        'proceder',
        'finalizar',
        'hacer pedido',
        'ordenar',
      ])
    ) {
      return this.response(
        'Puedo orientarte sobre los productos, pero no puedo crear pedidos automáticamente todavía. ¿Qué producto te interesa?',
      );
    }

    if (
      this.matches(lastUserMessage, [
        'estado de mi pedido',
        'mi pedido',
        'donde está',
        'dónde está',
        'seguimiento',
      ])
    ) {
      return this.response(
        'No tengo acceso al seguimiento de pedidos en este momento. Si compartes tu número de pedido, un asesor podrá ayudarte.',
      );
    }

    const productSearchTerms = [
      'camiseta',
      'gorra',
      'chaqueta',
      'pantalón',
      'pantalon',
      'ropa',
      'productos',
      'catálogo',
      'catalogo',
      'ver productos',
      'qué tienen',
      'que tienen',
    ];
    const searchMatch = productSearchTerms.find((term) =>
      lastUserMessage.includes(term),
    );
    if (searchMatch) {
      const catalog = messages[0]?.content.split(
        'Información actual del catálogo',
      )[1];
      if (catalog) {
        return this.response(
          `Esta es la información que encontré en el catálogo:${catalog.split('\n\nNo se encontraron productos')[0]}`,
        );
      }
      return this.response(
        'No encontré información de productos para esa consulta en el catálogo disponible. ¿Quieres que te ayude con otra cosa?',
      );
    }

    // Precio
    if (
      this.matches(lastUserMessage, [
        'precio',
        'cuánto cuesta',
        'cuanto cuesta',
        'valor',
        'costo',
        'cuánto vale',
        'cuanto vale',
      ])
    ) {
      return this.response(
        'Para consultarte el precio necesito saber qué producto te interesa. ¿Puedes decirme el nombre del producto? 😊',
      );
    }

    // Despedida
    if (
      this.matches(lastUserMessage, [
        'gracias',
        'hasta luego',
        'adiós',
        'adios',
        'bye',
        'chao',
      ])
    ) {
      return this.response(
        '¡Hasta luego! 👋 Fue un placer atenderte. Si necesitas algo más, aquí estaré. ¡Que tengas un excelente día! 😊',
      );
    }

    if (
      this.matches(lastUserMessage, [
        'horario',
        'dirección',
        'dirección',
        'teléfono',
        'telefono',
        'información',
        'información',
        'política',
        'devolución',
      ])
    ) {
      return this.response(
        'No tengo configurada la información de horarios, dirección o políticas de la empresa. Un asesor podrá confirmártela.',
      );
    }

    return this.response(
      'Gracias por escribirnos. Cuéntame qué necesitas y te ayudaré con la información disponible.',
    );
  }

  private matches(text: string, keywords: string[]): boolean {
    return keywords.some((kw) => text.includes(kw));
  }

  private response(content: string): AiResponse {
    return { content };
  }
}
