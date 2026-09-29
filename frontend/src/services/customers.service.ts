import api from './api';
import type { Customer, PaginatedResponse } from '../types';

export const customersService = {
  async findAll(params?: { search?: string; page?: number; limit?: number }): Promise<PaginatedResponse<Customer>> {
    const res = await api.get('/customers', { params });
    return res.data.data;
  },

  async findOne(id: string): Promise<Customer> {
    const res = await api.get(`/customers/${id}`);
    return res.data.data;
  },

  async create(data: Partial<Customer>): Promise<Customer> {
    const res = await api.post('/customers', data);
    return res.data.data;
  },

  async update(id: string, data: Partial<Customer>): Promise<Customer> {
    const res = await api.patch(`/customers/${id}`, data);
    return res.data.data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/customers/${id}`);
  },
};
