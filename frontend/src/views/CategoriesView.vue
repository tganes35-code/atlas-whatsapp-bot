<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">Categorías</div>
        <div class="page-subtitle">Gestiona las categorías del catálogo</div>
      </div>
      <button class="btn btn-primary" @click="openCreate">+ Nueva categoría</button>
    </div>

    <div class="page-body">
      <div v-if="loading" class="loading">Cargando categorías...</div>

      <div v-else class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Productos</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!categories.length">
              <td colspan="5" class="empty-state"><p>Sin categorías</p></td>
            </tr>
            <tr v-for="cat in categories" :key="cat.id">
              <td><strong>{{ cat.name }}</strong></td>
              <td style="color:var(--color-text-muted)">{{ cat.description ?? '—' }}</td>
              <td>{{ cat._count?.products ?? 0 }}</td>
              <td>
                <span :class="cat.active ? 'badge badge-green' : 'badge badge-gray'">
                  {{ cat.active ? 'Activa' : 'Inactiva' }}
                </span>
              </td>
              <td>
                <button class="btn btn-secondary btn-sm" @click="openEdit(cat)" style="margin-right:6px">✏️ Editar</button>
                <button class="btn btn-danger btn-sm" @click="remove(cat.id)">🗑️ Eliminar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal">
        <div class="modal-header">
          <span class="modal-title">{{ editing ? 'Editar categoría' : 'Nueva categoría' }}</span>
          <button class="modal-close" @click="showModal = false">×</button>
        </div>
        <div class="modal-body">
          <div v-if="modalError" class="alert alert-error">{{ modalError }}</div>
          <div class="form-group">
            <label class="form-label">Nombre *</label>
            <input v-model="form.name" class="form-input" placeholder="Camisetas" required />
          </div>
          <div class="form-group">
            <label class="form-label">Descripción</label>
            <textarea v-model="form.description" class="form-textarea" />
          </div>
          <div class="form-group" v-if="editing">
            <label class="form-label">Estado</label>
            <select v-model="form.active" class="form-select">
              <option :value="true">Activa</option>
              <option :value="false">Inactiva</option>
            </select>
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
import { categoriesService } from '../services/catalog.service';
import type { Category } from '../types';

const categories = ref<Category[]>([]);
const loading = ref(false);
const showModal = ref(false);
const editing = ref<string | null>(null);
const saving = ref(false);
const modalError = ref('');

const form = ref({ name: '', description: '', active: true });

async function load() {
  loading.value = true;
  categories.value = await categoriesService.findAll(true);
  loading.value = false;
}

function openCreate() {
  editing.value = null;
  form.value = { name: '', description: '', active: true };
  modalError.value = '';
  showModal.value = true;
}

function openEdit(cat: Category) {
  editing.value = cat.id;
  form.value = { name: cat.name, description: cat.description ?? '', active: cat.active };
  modalError.value = '';
  showModal.value = true;
}

async function save() {
  if (!form.value.name) { modalError.value = 'El nombre es obligatorio'; return; }
  saving.value = true;
  modalError.value = '';
  try {
    if (editing.value) {
      await categoriesService.update(editing.value, form.value);
    } else {
      await categoriesService.create(form.value);
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
  if (!confirm('¿Eliminar/desactivar esta categoría?')) return;
  await categoriesService.remove(id);
  await load();
}

onMounted(load);
</script>
