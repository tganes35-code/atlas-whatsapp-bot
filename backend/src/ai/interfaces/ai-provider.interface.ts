export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AiResponse {
  content: string;
  toolCalls?: ToolCall[];
  usage?: {
    promptTokens: number;
    completionTokens: number;
  };
}

export interface ToolCall {
  name: string;
  arguments: Record<string, any>;
}

export interface AiProvider {
  chat(messages: ChatMessage[], tools?: ToolDefinition[]): Promise<AiResponse>;
  isAvailable(): boolean;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>;
}
