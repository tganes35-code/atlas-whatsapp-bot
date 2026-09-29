import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import {
  AiProvider,
  AiResponse,
  ChatMessage,
  ToolDefinition,
} from '../interfaces/ai-provider.interface';

@Injectable()
export class OpenAiProvider implements AiProvider {
  private readonly logger = new Logger(OpenAiProvider.name);
  private client: OpenAI | null = null;
  private model: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    this.model = this.config.get<string>('OPENAI_MODEL') ?? 'gpt-4o-mini';

    if (apiKey) {
      this.client = new OpenAI({ apiKey });
      this.logger.log(`OpenAI configurado con modelo: ${this.model}`);
    } else {
      this.logger.warn('OPENAI_API_KEY no configurada — usando MockAI');
    }
  }

  isAvailable(): boolean {
    return this.client !== null;
  }

  async chat(messages: ChatMessage[], tools?: ToolDefinition[]): Promise<AiResponse> {
    if (!this.client) {
      throw new Error('OpenAI no está disponible');
    }

    try {
      const openaiTools = tools?.map((t) => ({
        type: 'function' as const,
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        },
      }));

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        tools: openaiTools?.length ? openaiTools : undefined,
        tool_choice: openaiTools?.length ? 'auto' : undefined,
        temperature: 0.3,
        max_tokens: 1000,
      });

      const choice = response.choices[0];
      const message = choice.message;

      if (message.tool_calls?.length) {
        return {
          content: message.content ?? '',
          toolCalls: message.tool_calls.map((tc) => ({
            name: tc.function.name,
            arguments: JSON.parse(tc.function.arguments),
          })),
          usage: {
            promptTokens: response.usage?.prompt_tokens ?? 0,
            completionTokens: response.usage?.completion_tokens ?? 0,
          },
        };
      }

      return {
        content: message.content ?? '',
        usage: {
          promptTokens: response.usage?.prompt_tokens ?? 0,
          completionTokens: response.usage?.completion_tokens ?? 0,
        },
      };
    } catch (error) {
      this.logger.error('Error llamando OpenAI:', error);
      throw error;
    }
  }
}
