<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">Dashboard</div>
        <div class="page-subtitle">Resumen en tiempo real — {{ companyName }}</div>
      </div>
      <button class="btn btn-secondary btn-sm" @click="load">🔄 Actualizar</button>
    </div>

    <div class="page-body">
      <div v-if="loading" class="loading">Cargando estadísticas...</div>

      <template v-else-if="stats">
        <!-- Stats grid -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">👥</div>
            <div class="stat-label">Clientes</div>
            <div class="stat-value">{{ stats.totals.customers }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📦</div>
            <div class="stat-label">Productos</div>
            <div class="stat-value">{{ stats.totals.products }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">⏳</div>
            <div class="stat-label">Pedidos pendientes</div>
            <div class="stat-value" style="color:var(--color-warning)">{{ stats.totals.pendingOrders }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🛒</div>
            <div class="stat-label">Pedidos hoy</div>
            <div class="stat-value">{{ stats.totals.ordersToday }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">💬</div>
            <div class="stat-label">Conversaciones abiertas</div>
            <div class="stat-value" style="color:var(--color-primary)">{{ stats.totals.openConversations }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🔔</div>
            <div class="stat-label">Esperando agente</div>
            <div class="stat-value" :style="stats.totals.humanConversations > 0 ? 'color:var(--color-danger)' : ''">
              {{ stats.totals.humanConversations }}
            </div>
          </div>
          <div class="stat-card" style="grid-column: span 2">
            <div class="stat-icon">💰</div>
            <div class="stat-label">Ventas hoy</div>
            <div class="stat-value" style="color:var(--color-success)">{{ formatCurrency(stats.totals.salesToday) }}</div>
          </div>
        </div>

        <!-- Two columns -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
          <!-- Latest orders -->
          <div class="card">
            <div class="card-header">
              <span class="card-title">Últimos pedidos</span>
              <RouterLink to="/orders" class="btn btn-secondary btn-sm">Ver todos</RouterLink>
            </div>
            <div v-if="!stats.latestOrders.length" class="empty-state" style="padding:24px">
              <p>Sin pedidos aún</p>
            </div>
            <table v-else>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Total</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="order in stats.latestOrders"
                  :key="order.id"
                  style="cursor:pointer"
                  @click="$router.push(`/orders/${order.id}`)"
                >
                  <td>{{ order.customer?.name ?? '—' }}</td>
                  <td>{{ formatCurrency(order.total) }}</td>
                  <td><span :class="orderBadge(order.status)">{{ order.status }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Latest conversations -->
          <div class="card">
            <div class="card-header">
              <span class="card-title">Últimas conversaciones</span>
              <RouterLink to="/conversations" class="btn btn-secondary btn-sm">Ver todas</RouterLink>
            </div>
            <div v-if="!stats.latestConversations.length" class="empty-state" style="padding:24px">
              <p>Sin conversaciones aún</p>
            </div>
            <table v-else>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Estado</th>
                  <th>Último mensaje</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="conv in stats.latestConversations"
                  :key="conv.id"
                  style="cursor:pointer"
                  @click="$router.push(`/conversations/${conv.id}`)"
                >
                  <td>{{ conv.customer?.name ?? '—' }}</td>
                  <td><span :class="convBadge(conv.status)">{{ conv.status }}</span></td>
                  <td style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--color-text-muted);font-size:12px">
                    {{ conv.messages?.[0]?.content ?? '—' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { RouterLink } from 'vue-router';
import { dashboardService } from '../services/dashboard.service';
import { useCompanyStore } from '../stores/company.store';
import type { DashboardStats } from '../types';

const companyStore = useCompanyStore();
const stats = ref<DashboardStats | null>(null);
const loading = ref(false);
const companyName = computed(() => companyStore.company?.name ?? 'Atlas Demo Store');

async function load() {
  loading.value = true;
  try {
    stats.value = await dashboardService.getStats();
  } finally {
    loading.value = false;
  }
}

function formatCurrency(val: number) {
  return `$${Number(val).toLocaleString('es-CO')} COP`;
}

function orderBadge(status: string) {
  const map: Record<string, string> = {
    PENDING: 'badge badge-yellow',
    CONFIRMED: 'badge badge-blue',
    PREPARING: 'badge badge-purple',
    READY: 'badge badge-orange',
    SHIPPED: 'badge badge-blue',
    DELIVERED: 'badge badge-green',
    CANCELLED: 'badge badge-red',
  };
  return map[status] ?? 'badge badge-gray';
}

function convBadge(status: string) {
  const map: Record<string, string> = {
    OPEN: 'badge badge-green',
    WAITING: 'badge badge-yellow',
    HUMAN: 'badge badge-red',
    CLOSED: 'badge badge-gray',
  };
  return map[status] ?? 'badge badge-gray';
}

onMounted(() => {
  load();
  companyStore.fetch();
});
</script>
