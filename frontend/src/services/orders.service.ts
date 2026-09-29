import api from './api';
import type { Order, PaginatedResponse, OrderStatus } from '../types';

export const ordersService = {
  async findAll(params?: {
    status?: OrderStatus;
    customerId?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Order>> {
    const res = await api.get('/orders', { params });
    return res.data.data;
  },

  async findOne(id: string): Promise<Order> {
    const res = await api.get(`/orders/${id}`);
    return res.data.data;
  },

  async updateStatus(id: string, status: OrderStatus, notes?: string): Promise<Order> {
    const res = await api.patch(`/orders/${id}/status`, { status, notes });
    return res.data.data;
  },
};
