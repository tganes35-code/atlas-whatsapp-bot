<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">Pedidos</div>
        <div class="page-subtitle">{{ meta?.total ?? 0 }} pedidos en total</div>
      </div>
    </div>

    <div class="page-body">
      <div class="search-bar">
        <select v-model="filterStatus" class="form-select" style="width:auto" @change="load">
          <option value="">Todos los estados</option>
          <option v-for="s in statuses" :key="s" :value="s">{{ s }}</option>
        </select>
      </div>

      <div v-if="loading" class="loading">Cargando pedidos...</div>

      <div v-else class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>ID Pedido</th>
              <th>Cliente</th>
              <th>Items</th>
              <th>Total</th>
              <th>Pago</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!orders.length">
              <td colspan="8" class="empty-state"><p>Sin pedidos</p></td>
            </tr>
            <tr v-for="o in orders" :key="o.id" style="cursor:pointer" @click="$router.push(`/orders/${o.id}`)">
              <td style="font-family:monospace;font-size:12px">#{{ o.id.slice(-8).toUpperCase() }}</td>
              <td>
                <div style="font-weight:600">{{ o.customer?.name ?? '—' }}</div>
                <div style="font-size:11px;color:var(--color-text-muted)">{{ o.customer?.phone }}</div>
              </td>
              <td>{{ (o as any)._count?.items ?? o.items?.length ?? '—' }}</td>
              <td style="font-weight:600">{{ formatCurrency(o.total) }}</td>
              <td><span class="badge badge-gray">{{ o.paymentMethod }}</span></td>
              <td><span :class="orderBadge(o.status)">{{ o.status }}</span></td>
              <td style="color:var(--color-text-muted);font-size:12px">{{ formatDate(o.createdAt) }}</td>
              <td @click.stop>
                <select
                  :value="o.status"
                  class="form-select"
                  style="width:auto;padding:4px 8px;font-size:12px"
                  @change="(e) => updateStatus(o.id, (e.target as HTMLSelectElement).value)"
                >
                  <option v-for="s in statuses" :key="s" :value="s">{{ s }}</option>
                </select>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="meta && meta.totalPages > 1" class="pagination">
        <button class="page-btn" :disabled="page === 1" @click="page--; load()">‹</button>
        <button v-for="p in meta.totalPages" :key="p" class="page-btn" :class="{ active: p === page }" @click="page = p; load()">{{ p }}</button>
        <button class="page-btn" :disabled="page === meta.totalPages" @click="page++; load()">›</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ordersService } from '../services/orders.service';
import type { Order, OrderStatus } from '../types';

const orders = ref<Order[]>([]);
const meta = ref<any>(null);
const loading = ref(false);
const filterStatus = ref('');
const page = ref(1);

const statuses: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

async function load() {
  loading.value = true;
  const res = await ordersService.findAll({
    status: filterStatus.value as OrderStatus || undefined,
    page: page.value, limit: 20,
  });
  orders.value = res.data;
  meta.value = res.meta;
  loading.value = false;
}

async function updateStatus(id: string, status: string) {
  await ordersService.updateStatus(id, status as OrderStatus);
  await load();
}

function formatCurrency(val: number) {
  return `$${Number(val).toLocaleString('es-CO')} COP`;
}
function formatDate(d: string) {
  return new Date(d).toLocaleDateString('es-CO', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function orderBadge(status: string) {
  const map: Record<string, string> = {
    PENDING: 'badge badge-yellow', CONFIRMED: 'badge badge-blue',
    PREPARING: 'badge badge-purple', READY: 'badge badge-orange',
    SHIPPED: 'badge badge-blue', DELIVERED: 'badge badge-green', CANCELLED: 'badge badge-red',
  };
  return map[status] ?? 'badge badge-gray';
}

onMounted(load);
</script>
