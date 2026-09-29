<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">Empresa</div>
        <div class="page-subtitle">Información y configuración de la empresa</div>
      </div>
    </div>

    <div class="page-body">
      <div v-if="loading" class="loading">Cargando...</div>

      <div v-else class="card" style="max-width:700px">
        <div class="card-header">
          <span class="card-title">🏪 Datos de la empresa</span>
          <button class="btn btn-primary btn-sm" @click="save" :disabled="saving">
            {{ saving ? 'Guardando...' : '💾 Guardar cambios' }}
          </button>
        </div>
        <div class="card-body">
          <div v-if="successMsg" class="alert alert-success">{{ successMsg }}</div>
          <div v-if="errorMsg" class="alert alert-error">{{ errorMsg }}</div>

          <div class="form-grid form-grid-2">
            <div class="form-group">
              <label class="form-label">Nombre</label>
              <input v-model="form.name" class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label">Email</label>
              <input v-model="form.email" type="email" class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label">Teléfono</label>
              <input v-model="form.phone" class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label">País</label>
              <input v-model="form.country" class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label">Moneda</label>
              <input v-model="form.currency" class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label">Ciudad / Dirección</label>
              <input v-model="form.address" class="form-input" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Descripción</label>
            <textarea v-model="form.description" class="form-textarea" rows="3" />
          </div>

          <div class="form-group">
            <label class="form-label">Horarios (texto libre o JSON)</label>
            <textarea v-model="form.schedules" class="form-textarea" rows="4"
              placeholder='{"lunes_viernes":"8am-6pm","sabado":"9am-2pm"}' />
          </div>

          <div class="form-group">
            <label class="form-label">Políticas de la empresa</label>
            <textarea v-model="form.policies" class="form-textarea" rows="4"
              placeholder="Devoluciones, garantías, envíos..." />
          </div>

          <div class="form-group">
            <label class="form-label">Información adicional (contexto para la IA)</label>
            <textarea v-model="form.extraInfo" class="form-textarea" rows="4"
              placeholder="Texto adicional que el bot puede usar para responder preguntas..." />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useCompanyStore } from '../stores/company.store';

const companyStore = useCompanyStore();
const loading = ref(true);
const saving = ref(false);
const successMsg = ref('');
const errorMsg = ref('');

const form = ref({
  name: '',
  email: '',
  phone: '',
  country: '',
  currency: '',
  address: '',
  description: '',
  schedules: '',
  policies: '',
  extraInfo: '',
});

async function load() {
  loading.value = true;
  await companyStore.fetch();
  if (companyStore.company) {
    const c = companyStore.company;
    form.value = {
      name: c.name ?? '',
      email: c.email ?? '',
      phone: c.phone ?? '',
      country: c.country ?? '',
      currency: c.currency ?? '',
      address: c.address ?? '',
      description: c.description ?? '',
      schedules: c.schedules ?? '',
      policies: c.policies ?? '',
      extraInfo: c.extraInfo ?? '',
    };
  }
  loading.value = false;
}

async function save() {
  saving.value = true;
  successMsg.value = '';
  errorMsg.value = '';
  try {
    const ok = await companyStore.update(form.value);
    if (ok) successMsg.value = '✅ Información actualizada correctamente';
    else errorMsg.value = '❌ Error al guardar';
  } catch {
    errorMsg.value = '❌ Error al guardar';
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>
