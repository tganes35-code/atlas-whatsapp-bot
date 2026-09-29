import api from './api';
import type { Company } from '../types';

export const companyService = {
  async get(): Promise<Company> {
    const res = await api.get('/company');
    return res.data.data;
  },

  async update(data: Partial<Company>): Promise<Company> {
    const res = await api.patch('/company', data);
    return res.data.data;
  },
};
