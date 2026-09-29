import { defineStore } from 'pinia';
import { ref } from 'vue';
import { companyService } from '../services/company.service';
import type { Company } from '../types';

export const useCompanyStore = defineStore('company', () => {
  const company = ref<Company | null>(null);
  const loading = ref(false);

  async function fetch() {
    loading.value = true;
    try {
      company.value = await companyService.get();
    } finally {
      loading.value = false;
    }
  }

  async function update(data: Partial<Company>) {
    loading.value = true;
    try {
      company.value = await companyService.update(data);
      return true;
    } catch {
      return false;
    } finally {
      loading.value = false;
    }
  }

  return { company, loading, fetch, update };
});
