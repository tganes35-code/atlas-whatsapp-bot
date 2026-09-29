<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-logo">
        <div class="logo-icon">A</div>
        <div>
          <h1>Atlas WhatsApp Bot</h1>
          <p>Panel administrativo</p>
        </div>
      </div>

      <form @submit.prevent="handleLogin">
        <div v-if="authStore.error" class="alert alert-error">
          {{ authStore.error }}
        </div>

        <div class="form-group">
          <label class="form-label">Correo electrónico</label>
          <input
            v-model="email"
            type="email"
            class="form-input"
            placeholder="admin@atlas.local"
            required
            autocomplete="email"
          />
        </div>

        <div class="form-group">
          <label class="form-label">Contraseña</label>
          <input
            v-model="password"
            type="password"
            class="form-input"
            placeholder="••••••••"
            required
            autocomplete="current-password"
          />
        </div>

        <button
          type="submit"
          class="btn btn-primary"
          style="width:100%;justify-content:center;padding:11px"
          :disabled="authStore.loading"
        >
          {{ authStore.loading ? 'Iniciando sesión...' : 'Iniciar sesión' }}
        </button>
      </form>

      <p class="login-hint">
        Desarrollo local: <strong>admin@atlas.local</strong> / <strong>Admin123!</strong>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';

const router = useRouter();
const authStore = useAuthStore();
const email = ref('admin@atlas.local');
const password = ref('Admin123!');

async function handleLogin() {
  const ok = await authStore.login(email.value, password.value);
  if (ok) router.push('/dashboard');
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%);
}

.login-card {
  background: white;
  border-radius: 16px;
  padding: 40px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 8px 32px rgba(0,0,0,.08);
  border: 1px solid var(--color-border);
}

.login-logo {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 32px;
}

.logo-icon {
  width: 44px; height: 44px;
  background: var(--color-primary);
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  color: white; font-size: 20px; font-weight: 700;
  flex-shrink: 0;
}

.login-logo h1 { font-size: 17px; font-weight: 700; margin-bottom: 2px; }
.login-logo p { font-size: 12px; color: var(--color-text-muted); }

.login-hint {
  margin-top: 20px;
  font-size: 11.5px;
  color: var(--color-text-muted);
  text-align: center;
  background: var(--color-bg);
  padding: 10px;
  border-radius: var(--radius);
}
</style>
