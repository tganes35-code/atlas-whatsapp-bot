<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">Conversación — {{ conversation?.customer?.name ?? '...' }}</div>
        <div class="page-subtitle">
          <span :class="convBadge(conversation?.status ?? 'OPEN')">{{ conversation?.status }}</span>
          &nbsp;·&nbsp; Canal: {{ conversation?.channel }}
        </div>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-secondary btn-sm" @click="$router.back()">← Volver</button>
        <button v-if="conversation?.status !== 'HUMAN'" class="btn btn-warning btn-sm" @click="handoff">🔔 Pasar a humano</button>
        <button v-if="conversation?.status === 'HUMAN'" class="btn btn-success btn-sm" @click="returnToBot">🤖 Devolver al bot</button>
        <button v-if="conversation?.status !== 'CLOSED'" class="btn btn-danger btn-sm" @click="close">✅ Cerrar</button>
      </div>
    </div>

    <div class="page-body" style="display:flex;gap:20px;height:calc(100vh - var(--header-height) - 40px)">
      <!-- Messages -->
      <div style="flex:1;display:flex;flex-direction:column">
        <div class="card" style="flex:1;display:flex;flex-direction:column;overflow:hidden">
          <div class="card-header"><span class="card-title">Historial de mensajes ({{ messages.length }})</span></div>
          <div ref="messagesContainer" style="flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px">
            <div v-if="loading" class="loading">Cargando mensajes...</div>
            <div v-else-if="!messages.length" class="empty-state"><p>Sin mensajes</p></div>
            <div
              v-for="msg in messages"
              :key="msg.id"
              :style="msgStyle(msg.sender)"
            >
              <div :style="msgBubbleStyle(msg.sender)">
                <div style="font-size:10px;font-weight:600;margin-bottom:4px;opacity:0.7">
                  {{ senderLabel(msg.sender) }}
                </div>
                <div style="white-space:pre-wrap;font-size:13.5px">{{ msg.content }}</div>
                <div style="font-size:10px;opacity:0.6;margin-top:4px;text-align:right">{{ formatTime(msg.createdAt) }}</div>
              </div>
            </div>
          </div>

          <!-- Reply box -->
          <div style="padding:12px 16px;border-top:1px solid var(--color-border);display:flex;gap:8px">
            <input
              v-model="replyText"
              class="form-input"
              placeholder="Responder como agente..."
              style="flex:1"
              @keydown.enter.prevent="sendReply"
            />
            <button class="btn btn-primary" @click="sendReply" :disabled="!replyText.trim()">Enviar</button>
          </div>
        </div>
      </div>

      <!-- Sidebar info -->
      <div style="width:260px;display:flex;flex-direction:column;gap:16px">
        <div class="card">
          <div class="card-header"><span class="card-title">👤 Cliente</span></div>
          <div class="card-body" style="font-size:13px">
            <div><strong>{{ conversation?.customer?.name }}</strong></div>
            <div style="color:var(--color-text-muted)">{{ conversation?.customer?.phone }}</div>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><span class="card-title">⚙️ Acciones</span></div>
          <div class="card-body" style="display:flex;flex-direction:column;gap:8px">
            <button class="btn btn-secondary" style="justify-content:center" @click="load">🔄 Actualizar</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, computed } from 'vue';
import { useRoute } from 'vue-router';
import { conversationsService } from '../services/conversations.service';
import { useAuthStore } from '../stores/auth.store';
import type { Conversation, Message } from '../types';

const route = useRoute();
const authStore = useAuthStore();
const convId = computed(() => route.params.id as string);
const conversation = ref<Conversation | null>(null);
const messages = ref<Message[]>([]);
const loading = ref(false);
const replyText = ref('');
const messagesContainer = ref<HTMLElement | null>(null);

async function load() {
  loading.value = true;
  [conversation.value, messages.value] = await Promise.all([
    conversationsService.findOne(convId.value),
    conversationsService.getMessages(convId.value),
  ]);
  loading.value = false;
  await nextTick();
  scrollToBottom();
}

function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
}

async function sendReply() {
  if (!replyText.value.trim()) return;
  await conversationsService.sendMessage(convId.value, replyText.value);
  replyText.value = '';
  await load();
}

async function handoff() {
  await conversationsService.handoff(convId.value);
  await load();
}

async function returnToBot() {
  await conversationsService.returnToBot(convId.value);
  await load();
}

async function close() {
  if (!confirm('¿Cerrar esta conversación?')) return;
  await conversationsService.close(convId.value);
  await load();
}

function senderLabel(sender: string) {
  const map: Record<string, string> = { CUSTOMER: '👤 Cliente', BOT: '🤖 Bot', AGENT: '👨‍💼 Agente', SYSTEM: '⚙️ Sistema' };
  return map[sender] ?? sender;
}

function msgStyle(sender: string) {
  if (sender === 'CUSTOMER') return 'display:flex;justify-content:flex-start';
  if (sender === 'BOT') return 'display:flex;justify-content:flex-end';
  if (sender === 'AGENT') return 'display:flex;justify-content:flex-end';
  return 'display:flex;justify-content:center';
}

function msgBubbleStyle(sender: string) {
  const base = 'padding:10px 14px;border-radius:12px;max-width:75%;';
  if (sender === 'CUSTOMER') return base + 'background:#f1f5f9;border-bottom-left-radius:3px;';
  if (sender === 'BOT') return base + 'background:var(--color-primary-light);border-bottom-right-radius:3px;';
  if (sender === 'AGENT') return base + 'background:#dcfce7;border-bottom-right-radius:3px;';
  return 'font-size:11px;color:var(--color-text-muted);font-style:italic;text-align:center;padding:4px 8px;';
}

function formatTime(d: string) {
  return new Date(d).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}

function convBadge(status: string) {
  const map: Record<string, string> = { OPEN:'badge badge-green', WAITING:'badge badge-yellow', HUMAN:'badge badge-red', CLOSED:'badge badge-gray' };
  return map[status] ?? 'badge badge-gray';
}

onMounted(load);
</script>
