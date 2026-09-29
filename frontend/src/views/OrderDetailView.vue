<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">Pedido #{{ orderId?.slice(-8).toUpperCase() }}</div>
        <div class="page-subtitle">Detalle completo del pedido</div>
      </div>
      <button class="btn btn-secondary" @click="$router.back()">← Volver</button>
    </div>

    <div class="page-body">
      <div v-if="loading" class="loading">Cargando...</div>
      <template v-else-if="order">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
          <!-- Info -->
          <div class="card">
            <div class="card-header"><span class="card-title">Información del pedido</span></div>
            <div class="card-body">
              <table style="border:none">
                <tr><td style="padding:6px 0;color:var(--color-text-muted);border:none">Estado</td><td style="border:none"><span :class="orderBadge(order.status)">{{ order.status }}</span></td></tr>
                <tr><td style="padding:6px 0;color:var(--color-text-muted);border:none">Cliente</td><td style="border:none">{{ order.customer?.name }}</td></tr>
                <tr><td style="padding:6px 0;color:var(--color-text-muted);border:none">Teléfono</td><td style="border:none">{{ order.customer?.phone }}</td></tr>
                <tr><td style="padding:6px 0;color:var(--color-text-muted);border:none">Dirección</td><td style="border:none">{{ order.shippingAddress ?? '—' }}</td></tr>
                <tr><td style="padding:6px 0;color:var(--color-text-muted);border:none">Pago</td><td style="border:none">{{ order.paymentMethod }}</td></tr>
                <tr><td style="padding:6px 0;color:var(--color-text-muted);border:none">Subtotal</td><td style="border:none">{{ formatCurrency(order.subtotal) }}</td></tr>
                <tr><td style="padding:6px 0;color:var(--color-text-muted);border:none">Envío</td><td style="border:none">{{ formatCurrency(order.shipping) }}</td></tr>
                <tr><td style="padding:6px 0;color:var(--color-text-muted);font-weight:700;border:none">Total</td><td style="border:none;font-weight:700;font-size:16px">{{ formatCurrency(order.total) }}</td></tr>
              </table>

              <div style="margin-top:16px">
                <label class="form-label">Cambiar estado</label>
                <div style="display:flex;gap:8px">
                  <select v-model="newStatus" class="form-select">
                    <option v-for="s in statuses" :key="s" :value="s">{{ s }}</option>
                  </select>
                  <button class="btn btn-primary" @click="changeStatus">Actualizar</button>
                </div>
              </div>
            </div>
          </div>

          <!-- History -->
          <div class="card">
            <div class="card-header"><span class="card-title">Historial de estados</span></div>
            <div class="card-body">
              <div v-for="h in order.statusHistory" :key="h.id" style="display:flex;gap:12px;margin-bottom:12px">
                <span :class="orderBadge(h.status)" style="flex-shrink:0">{{ h.status }}</span>
                <div>
                  <div style="font-size:12px;color:var(--color-text-muted)">{{ formatDate(h.createdAt) }}</div>
                  <div v-if="h.notes" style="font-size:12px">{{ h.notes }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Items -->
        <div class="card" style="margin-top:20px">
          <div class="card-header"><span class="card-title">Productos del pedido</span></div>
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Variante</th>
                <th>Cantidad</th>
                <th>Precio unitario</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in order.items" :key="item.id">
                <td>{{ item.productName }}</td>
                <td>{{ item.variantInfo ?? '—' }}</td>
                <td>{{ item.quantity }}</td>
                <td>{{ formatCurrency(item.unitPrice) }}</td>
                <td>{{ formatCurrency(item.subtotal) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { ordersService } from '../services/orders.service';
import type { Order, OrderStatus } from '../types';

const route = useRoute();
const orderId = computed(() => route.params.id as string);
const order = ref<Order | null>(null);
const loading = ref(false);
const newStatus = ref<OrderStatus>('PENDING');
const statuses: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

async function load() {
  loading.value = true;
  order.value = await ordersService.findOne(orderId.value);
  newStatus.value = order.value.status;
  loading.value = false;
}

async function changeStatus() {
  await ordersService.updateStatus(orderId.value, newStatus.value);
  await load();
}

function formatCurrency(val: number) { return `$${Number(val).toLocaleString('es-CO')} COP`; }
function formatDate(d: string) { return new Date(d).toLocaleString('es-CO'); }
function orderBadge(s: string) {
  const map: Record<string, string> = { PENDING:'badge badge-yellow', CONFIRMED:'badge badge-blue', PREPARING:'badge badge-purple', READY:'badge badge-orange', SHIPPED:'badge badge-blue', DELIVERED:'badge badge-green', CANCELLED:'badge badge-red' };
  return map[s] ?? 'badge badge-gray';
}

onMounted(load);
</script>
