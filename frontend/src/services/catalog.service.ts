import api from './api';
import type { Category, Product, PaginatedResponse } from '../types';

export const categoriesService = {
  async findAll(includeInactive = false): Promise<Category[]> {
    const res = await api.get('/categories', {
      params: { includeInactive },
    });
    return res.data.data;
  },

  async findOne(id: string): Promise<Category> {
    const res = await api.get(`/categories/${id}`);
    return res.data.data;
  },

  async create(data: Partial<Category>): Promise<Category> {
    const res = await api.post('/categories', data);
    return res.data.data;
  },

  async update(id: string, data: Partial<Category>): Promise<Category> {
    const res = await api.patch(`/categories/${id}`, data);
    return res.data.data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/categories/${id}`);
  },
};

export const productsService = {
  async findAll(params?: {
    search?: string;
    categoryId?: string;
    active?: boolean;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Product>> {
    const res = await api.get('/products', { params });
    return res.data.data;
  },

  async findOne(id: string): Promise<Product> {
    const res = await api.get(`/products/${id}`);
    return res.data.data;
  },

  async create(data: Partial<Product> & { variants?: any[] }): Promise<Product> {
    const res = await api.post('/products', data);
    return res.data.data;
  },

  async update(id: string, data: Partial<Product>): Promise<Product> {
    const res = await api.patch(`/products/${id}`, data);
    return res.data.data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/products/${id}`);
  },
};
