<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">Clientes</div>
        <div class="page-subtitle">{{ meta?.total ?? 0 }} clientes registrados</div>
      </div>
      <button class="btn btn-primary" @click="openCreate">+ Nuevo cliente</button>
    </div>

    <div class="page-body">
      <div class="search-bar">
        <input v-model="search" class="search-input" placeholder="Buscar por nombre, teléfono, email..." @input="debouncedLoad" />
      </div>

      <div v-if="loading" class="loading">Cargando clientes...</div>

      <div v-else class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Teléfono</th>
              <th>Ciudad</th>
              <th>Pedidos</th>
              <th>Conversaciones</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!customers.length">
              <td colspan="7" class="empty-state"><p>Sin clientes</p></td>
            </tr>
            <tr v-for="c in customers" :key="c.id">
              <td>
                <div style="font-weight:600">{{ c.name }}</div>
                <div style="font-size:11px;color:var(--color-text-muted)">{{ c.email ?? '—' }}</div>
              </td>
              <td style="font-family:monospace">{{ c.phone }}</td>
              <td>{{ c.city ?? '—' }}</td>
              <td><span class="badge badge-blue">{{ c._count?.orders ?? 0 }}</span></td>
              <td><span class="badge badge-purple">{{ c._count?.conversations ?? 0 }}</span></td>
              <td style="color:var(--color-text-muted);font-size:12px">{{ formatDate(c.createdAt) }}</td>
              <td>
                <button class="btn btn-secondary btn-sm" @click="openEdit(c)">✏️ Editar</button>
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

    <!-- Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal">
        <div class="modal-header">
          <span class="modal-title">{{ editing ? 'Editar cliente' : 'Nuevo cliente' }}</span>
          <button class="modal-close" @click="showModal = false">×</button>
        </div>
        <div class="modal-body">
          <div v-if="modalError" class="alert alert-error">{{ modalError }}</div>
          <div class="form-grid form-grid-2">
            <div class="form-group" style="grid-column:span 2">
              <label class="form-label">Nombre completo *</label>
              <input v-model="form.name" class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label">Teléfono *</label>
              <input v-model="form.phone" class="form-input" placeholder="3001234567" />
            </div>
            <div class="form-group">
              <label class="form-label">Email</label>
              <input v-model="form.email" type="email" class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label">Ciudad</label>
              <input v-model="form.city" class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label">Dirección</label>
              <input v-model="form.address" class="form-input" />
            </div>
            <div class="form-group" style="grid-column:span 2">
              <label class="form-label">Notas</label>
              <textarea v-model="form.notes" class="form-textarea" rows="2" />
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showModal = false">Cancelar</button>
          <button class="btn btn-primary" @click="save" :disabled="saving">{{ saving ? 'Guardando...' : 'Guardar' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { customersService } from '../services/customers.service';
import type { Customer } from '../types';

const customers = ref<Customer[]>([]);
const meta = ref<any>(null);
const loading = ref(false);
const showModal = ref(false);
const editing = ref<string | null>(null);
const saving = ref(false);
const modalError = ref('');
const search = ref('');
const page = ref(1);

const form = ref({ name: '', phone: '', email: '', city: '', address: '', notes: '' });

let debounceTimer: any;
function debouncedLoad() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => { page.value = 1; load(); }, 400);
}

async function load() {
  loading.value = true;
  const res = await customersService.findAll({ search: search.value || undefined, page: page.value, limit: 20 });
  customers.value = res.data;
  meta.value = res.meta;
  loading.value = false;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' });
}

function openCreate() {
  editing.value = null;
  form.value = { name: '', phone: '', email: '', city: '', address: '', notes: '' };
  modalError.value = '';
  showModal.value = true;
}

function openEdit(c: Customer) {
  editing.value = c.id;
  form.value = { name: c.name, phone: c.phone, email: c.email ?? '', city: c.city ?? '', address: c.address ?? '', notes: c.notes ?? '' };
  modalError.value = '';
  showModal.value = true;
}

async function save() {
  if (!form.value.name || !form.value.phone) { modalError.value = 'Nombre y teléfono son obligatorios'; return; }
  saving.value = true;
  modalError.value = '';
  try {
    if (editing.value) {
      await customersService.update(editing.value, form.value);
    } else {
      await customersService.create(form.value);
    }
    showModal.value = false;
    await load();
  } catch (e: any) {
    modalError.value = e.response?.data?.message ?? 'Error al guardar';
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>
