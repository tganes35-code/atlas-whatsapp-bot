<template>
  <div class="layout">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-logo">
        <div class="logo-icon">A</div>
        <div class="logo-text">
          Atlas Bot
          <span>Panel administrativo</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <span class="nav-section-title">General</span>
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="nav-item"
          :class="{ active: route.path.startsWith(item.to) }"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          {{ item.label }}
        </RouterLink>

        <span class="nav-section-title" style="margin-top:8px">Chatbot</span>
        <RouterLink to="/simulator" class="nav-item" :class="{ active: route.path === '/simulator' }">
          <span class="nav-icon">💬</span>
          Simulador Chat
        </RouterLink>
        <RouterLink to="/conversations" class="nav-item" :class="{ active: route.path.startsWith('/conversations') }">
          <span class="nav-icon">🗨️</span>
          Conversaciones
          <span v-if="humanCount > 0" class="badge badge-red" style="margin-left:auto;font-size:10px">{{ humanCount }}</span>
        </RouterLink>
      </nav>

      <div class="sidebar-footer">
        <div class="user-info">
          <div class="user-avatar">{{ userInitials }}</div>
          <div>
            <div class="user-name">{{ authStore.user?.name }}</div>
            <div class="user-role">{{ authStore.user?.role }}</div>
          </div>
        </div>
        <button class="btn-logout" @click="handleLogout">🚪 Cerrar sesión</button>
      </div>
    </aside>

    <!-- Content -->
    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';
import { conversationsService } from '../services/conversations.service';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const humanCount = ref(0);

const navItems = [
  { to: '/dashboard', icon: '📊', label: 'Dashboard' },
  { to: '/company', icon: '🏪', label: 'Empresa' },
  { to: '/categories', icon: '🏷️', label: 'Categorías' },
  { to: '/products', icon: '📦', label: 'Productos' },
  { to: '/customers', icon: '👥', label: 'Clientes' },
  { to: '/orders', icon: '🛒', label: 'Pedidos' },
  { to: '/settings', icon: '⚙️', label: 'Configuración' },
];

const userInitials = computed(() => {
  const name = authStore.user?.name ?? '';
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
});

async function loadHumanCount() {
  try {
    const res = await conversationsService.findAll({ status: 'HUMAN', limit: 1 });
    humanCount.value = res.meta.total;
  } catch { /* ignorar */ }
}

let interval: ReturnType<typeof setInterval>;
onMounted(() => {
  loadHumanCount();
  interval = setInterval(loadHumanCount, 15000);
});
onUnmounted(() => clearInterval(interval));

function handleLogout() {
  authStore.logout();
  router.push('/login');
}
</script>
