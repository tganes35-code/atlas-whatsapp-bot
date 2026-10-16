<template>
  <div class="layout">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-logo">
        <div class="logo-icon">A</div>
        <div class="logo-text">
          Atlas Bot
          <span>Gestión de Catálogo</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <span class="nav-section-title">Catálogo</span>
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
import { computed } from 'vue';
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const navItems = [
  { to: '/categories', icon: '🏷️', label: 'Categorías' },
  { to: '/products', icon: '📦', label: 'Productos' },
];

const userInitials = computed(() => {
  const name = authStore.user?.name ?? '';
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
});

function handleLogout() {
  authStore.logout();
  router.push('/login');
}
</script>
