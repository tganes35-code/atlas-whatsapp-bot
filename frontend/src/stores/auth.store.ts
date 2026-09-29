import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authService } from '../services/auth.service';
import type { User } from '../types';

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('atlas_token'));
  const user = ref<User | null>(
    JSON.parse(localStorage.getItem('atlas_user') ?? 'null'),
  );
  const loading = ref(false);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => !!token.value && !!user.value);
  const isAdmin = computed(() => user.value?.role === 'ADMIN');

  async function login(email: string, password: string) {
    loading.value = true;
    error.value = null;
    try {
      const res = await authService.login(email, password);
      token.value = res.access_token;
      user.value = res.user;
      localStorage.setItem('atlas_token', res.access_token);
      localStorage.setItem('atlas_user', JSON.stringify(res.user));
      return true;
    } catch (e: any) {
      error.value =
        e.response?.data?.message ?? 'Error al iniciar sesión';
      return false;
    } finally {
      loading.value = false;
    }
  }

  function logout() {
    token.value = null;
    user.value = null;
    authService.logout();
  }

  async function refreshUser() {
    if (!token.value) return;
    try {
      user.value = await authService.getMe();
      localStorage.setItem('atlas_user', JSON.stringify(user.value));
    } catch {
      logout();
    }
  }

  return { token, user, loading, error, isAuthenticated, isAdmin, login, logout, refreshUser };
});
