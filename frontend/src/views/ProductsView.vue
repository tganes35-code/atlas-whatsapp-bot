<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">Productos</div>
        <div class="page-subtitle">{{ meta?.total ?? 0 }} productos en el catálogo</div>
      </div>
      <button class="btn btn-primary" @click="openCreate">+ Nuevo producto</button>
    </div>

    <div class="page-body">
      <div class="search-bar">
        <input v-model="search" class="search-input" placeholder="Buscar por nombre, SKU..." @input="debouncedLoad" />
        <select v-model="filterCategory" class="form-select" style="width:auto" @change="load">
          <option value="">Todas las categorías</option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
        </select>
        <select v-model="filterActive" class="form-select" style="width:auto" @change="load">
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
          <option value="">Todos</option>
        </select>
      </div>

      <div v-if="loading" class="loading">Cargando productos...</div>

      <div v-else class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>SKU</th>
              <th>Categoría</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!products.length">
              <td colspan="7" class="empty-state"><p>Sin productos</p></td>
            </tr>
            <tr v-for="p in products" :key="p.id">
              <td>
                <div style="display:flex;align-items:center;gap:10px">
                  <div style="width:36px;height:36px;background:var(--color-bg);border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">📦</div>
                  <div>
                    <div style="font-weight:600">{{ p.name }}</div>
                    <div style="font-size:11px;color:var(--color-text-muted)">{{ p.variants?.length ?? 0 }} variantes</div>
                  </div>
                </div>
              </td>
              <td style="font-family:monospace;font-size:12px">{{ p.sku }}</td>
              <td>{{ p.category?.name ?? '—' }}</td>
              <td>{{ formatCurrency(p.price) }}</td>
              <td>
                <span :style="p.stock <= 5 ? 'color:var(--color-danger);font-weight:600' : ''">
                  {{ p.stock }}
                </span>
              </td>
              <td>
                <span :class="p.active ? 'badge badge-green' : 'badge badge-gray'">
                  {{ p.active ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td>
                <button class="btn btn-secondary btn-sm" @click="openEdit(p)" style="margin-right:6px">✏️</button>
                <button class="btn btn-danger btn-sm" @click="remove(p.id)">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="meta && meta.totalPages > 1" class="pagination">
        <button class="page-btn" :disabled="page === 1" @click="page--; load()">‹</button>
        <button
          v-for="p in meta.totalPages"
          :key="p"
          class="page-btn"
          :class="{ active: p === page }"
          @click="page = p; load()"
        >{{ p }}</button>
        <button class="page-btn" :disabled="page === meta.totalPages" @click="page++; load()">›</button>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal">
        <div class="modal-header">
          <span class="modal-title">{{ editing ? 'Editar producto' : 'Nuevo producto' }}</span>
          <button class="modal-close" @click="showModal = false">×</button>
        </div>
        <div class="modal-body">
          <div v-if="modalError" class="alert alert-error">{{ modalError }}</div>
          <div class="form-grid form-grid-2">
            <div class="form-group" style="grid-column:span 2">
              <label class="form-label">Nombre *</label>
              <input v-model="form.name" class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label">SKU *</label>
              <input v-model="form.sku" class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label">Categoría *</label>
              <select v-model="form.categoryId" class="form-select">
                <option value="">Seleccionar...</option>
                <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Precio (COP) *</label>
              <input v-model.number="form.price" type="number" min="1" class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label">Stock</label>
              <input v-model.number="form.stock" type="number" min="0" class="form-input" />
            </div>
            <div class="form-group" style="grid-column:span 2">
              <label class="form-label">Descripción</label>
              <textarea v-model="form.description" class="form-textarea" rows="3" />
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showModal = false">Cancelar</button>
          <button class="btn btn-primary" @click="save" :disabled="saving">
            {{ saving ? 'Guardando...' : 'Guardar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { productsService, categoriesService } from '../services/catalog.service';
import type { Product, Category } from '../types';

const products = ref<Product[]>([]);
const categories = ref<Category[]>([]);
const meta = ref<any>(null);
const loading = ref(false);
const showModal = ref(false);
const editing = ref<string | null>(null);
const saving = ref(false);
const modalError = ref('');
const search = ref('');
const filterCategory = ref('');
const filterActive = ref('true');
const page = ref(1);

let debounceTimer: any;
function debouncedLoad() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => { page.value = 1; load(); }, 400);
}

const form = ref({ name: '', sku: '', categoryId: '', price: 0, stock: 0, description: '', active: true });

async function load() {
  loading.value = true;
  const params: any = { page: page.value, limit: 15 };
  if (search.value) params.search = search.value;
  if (filterCategory.value) params.categoryId = filterCategory.value;
  if (filterActive.value !== '') params.active = filterActive.value === 'true';
  const res = await productsService.findAll(params);
  products.value = res.data;
  meta.value = res.meta;
  loading.value = false;
}

function formatCurrency(val: number) {
  return `$${Number(val).toLocaleString('es-CO')}`;
}

function openCreate() {
  editing.value = null;
  form.value = { name: '', sku: '', categoryId: '', price: 0, stock: 0, description: '', active: true };
  modalError.value = '';
  showModal.value = true;
}

function openEdit(p: Product) {
  editing.value = p.id;
  form.value = {
    name: p.name, sku: p.sku, categoryId: p.categoryId,
    price: Number(p.price), stock: p.stock,
    description: p.description ?? '', active: p.active,
  };
  modalError.value = '';
  showModal.value = true;
}

async function save() {
  if (!form.value.name || !form.value.sku || !form.value.categoryId) {
    modalError.value = 'Nombre, SKU y categoría son obligatorios';
    return;
  }
  if (form.value.price <= 0) { modalError.value = 'El precio debe ser mayor a 0'; return; }
  saving.value = true;
  modalError.value = '';
  try {
    if (editing.value) {
      await productsService.update(editing.value, form.value);
    } else {
      await productsService.create(form.value);
    }
    showModal.value = false;
    await load();
  } catch (e: any) {
    modalError.value = e.response?.data?.message ?? 'Error al guardar';
  } finally {
    saving.value = false;
  }
}

async function remove(id: string) {
  if (!confirm('¿Desactivar este producto?')) return;
  await productsService.remove(id);
  await load();
}

onMounted(async () => {
  categories.value = await categoriesService.findAll();
  await load();
});
</script>
