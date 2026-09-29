import api from './api';
import type { Conversation, Message, PaginatedResponse, ConversationStatus } from '../types';

export const conversationsService = {
  async findAll(params?: {
    status?: ConversationStatus;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Conversation>> {
    const res = await api.get('/conversations', { params });
    return res.data.data;
  },

  async findOne(id: string): Promise<Conversation> {
    const res = await api.get(`/conversations/${id}`);
    return res.data.data;
  },

  async getMessages(id: string): Promise<Message[]> {
    const res = await api.get(`/conversations/${id}/messages`);
    return res.data.data;
  },

  async sendMessage(id: string, content: string): Promise<Message> {
    const res = await api.post(`/conversations/${id}/messages`, { content });
    return res.data.data;
  },

  async assignAgent(id: string, userId: string): Promise<Conversation> {
    const res = await api.patch(`/conversations/${id}/assign`, { userId });
    return res.data.data;
  },

  async handoff(id: string): Promise<Conversation> {
    const res = await api.patch(`/conversations/${id}/handoff`);
    return res.data.data;
  },

  async returnToBot(id: string): Promise<Conversation> {
    const res = await api.patch(`/conversations/${id}/return-to-bot`);
    return res.data.data;
  },

  async close(id: string): Promise<Conversation> {
    const res = await api.patch(`/conversations/${id}/close`);
    return res.data.data;
  },
};

export const chatbotService = {
  async sendMessage(phone: string, message: string): Promise<{
    conversationId: string;
    customerId: string;
    botResponse: string | null;
    humanMode: boolean;
  }> {
    const res = await api.post('/messages/process', { phone, message, channel: 'LOCAL' });
    return res.data.data;
  },
};
