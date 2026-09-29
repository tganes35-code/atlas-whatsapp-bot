<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">Conversaciones</div>
        <div class="page-subtitle">{{ meta?.total ?? 0 }} conversaciones</div>
      </div>
    </div>

    <div class="page-body">
      <div class="search-bar">
        <select v-model="filterStatus" class="form-select" style="width:auto" @change="load">
          <option value="">Todos los estados</option>
          <option value="OPEN">OPEN</option>
          <option value="WAITING">WAITING</option>
          <option value="HUMAN">HUMAN 🔔</option>
          <option value="CLOSED">CLOSED</option>
        </select>
        <button class="btn btn-secondary btn-sm" @click="load">🔄 Actualizar</button>
      </div>

      <div v-if="loading" class="loading">Cargando conversaciones...</div>

      <div v-else class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Estado</th>
              <th>Canal</th>
              <th>Último mensaje</th>
              <th>Agente</th>
              <th>Actualizado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!conversations.length">
              <td colspan="7" class="empty-state"><p>Sin conversaciones</p></td>
            </tr>
            <tr
              v-for="conv in conversations"
              :key="conv.id"
              style="cursor:pointer"
              :style="conv.status === 'HUMAN' ? 'background:#fff5f5' : ''"
              @click="$router.push(`/conversations/${conv.id}`)"
            >
              <td>
                <div style="font-weight:600">{{ conv.customer?.name ?? '—' }}</div>
                <div style="font-size:11px;color:var(--color-text-muted)">{{ conv.customer?.phone }}</div>
              </td>
              <td><span :class="convBadge(conv.status)">{{ conv.status }}</span></td>
              <td><span class="badge badge-gray">{{ conv.channel }}</span></td>
              <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;color:var(--color-text-muted)">
                {{ conv.messages?.[0]?.content ?? '—' }}
              </td>
              <td>{{ conv.assignedUser?.name ?? '—' }}</td>
              <td style="color:var(--color-text-muted);font-size:12px">{{ formatDate(conv.updatedAt) }}</td>
              <td @click.stop>
                <button class="btn btn-secondary btn-sm" @click="$router.push(`/conversations/${conv.id}`)">👁️ Ver</button>
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
import { conversationsService } from '../services/conversations.service';
import type { Conversation, ConversationStatus } from '../types';

const conversations = ref<Conversation[]>([]);
const meta = ref<any>(null);
const loading = ref(false);
const filterStatus = ref('');
const page = ref(1);

async function load() {
  loading.value = true;
  const res = await conversationsService.findAll({
    status: filterStatus.value as ConversationStatus || undefined,
    page: page.value, limit: 20,
  });
  conversations.value = res.data;
  meta.value = res.meta;
  loading.value = false;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('es-CO', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function convBadge(status: string) {
  const map: Record<string, string> = { OPEN:'badge badge-green', WAITING:'badge badge-yellow', HUMAN:'badge badge-red', CLOSED:'badge badge-gray' };
  return map[status] ?? 'badge badge-gray';
}

onMounted(load);
</script>
