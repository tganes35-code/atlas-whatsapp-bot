<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">💬 Simulador de Chat</div>
        <div class="page-subtitle">Simula una conversación de WhatsApp con el bot</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <span class="badge" :class="providerBadge">{{ providerLabel }}</span>
        <button class="btn btn-secondary btn-sm" @click="resetChat">🔄 Nueva conversación</button>
      </div>
    </div>

    <div class="page-body" style="display:flex;gap:20px;height:calc(100vh - var(--header-height) - 40px)">

      <!-- Chat window -->
      <div style="flex:1;display:flex;flex-direction:column">
        <!-- Phone config -->
        <div style="margin-bottom:12px;display:flex;gap:10px;align-items:center">
          <label class="form-label" style="margin:0;white-space:nowrap">📱 Número del cliente:</label>
          <input v-model="clientPhone" class="form-input" style="max-width:200px" placeholder="3001234567" />
          <div style="font-size:12px;color:var(--color-text-muted)">
            ConvID: <code>{{ conversationId?.slice(-12) ?? '—' }}</code>
          </div>
        </div>

        <!-- Message window -->
        <div class="card" style="flex:1;display:flex;flex-direction:column;overflow:hidden">
          <!-- Chat header -->
          <div style="padding:12px 16px;background:var(--color-primary);border-radius:8px 8px 0 0;display:flex;align-items:center;gap:10px">
            <div style="width:36px;height:36px;background:rgba(255,255,255,.2);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px">🏪</div>
            <div>
              <div style="color:white;font-weight:700;font-size:15px">Atlas Demo Store</div>
              <div style="color:rgba(255,255,255,.75);font-size:11px">
                <span v-if="humanMode">🔔 En espera de agente</span>
                <span v-else>🤖 Bot activo</span>
              </div>
            </div>
          </div>

          <!-- Messages -->
          <div ref="chatContainer" style="flex:1;overflow-y:auto;padding:16px;background:#f0f2f5;display:flex;flex-direction:column;gap:8px">
            <div v-if="!chatMessages.length" style="text-align:center;color:var(--color-text-muted);margin-top:40px">
              <div style="font-size:32px;margin-bottom:8px">💬</div>
              <p>Escribe un mensaje para iniciar la conversación</p>
              <div style="margin-top:16px;display:flex;flex-wrap:wrap;gap:6px;justify-content:center">
                <button v-for="s in suggestions" :key="s" class="btn btn-secondary btn-sm" @click="sendSuggestion(s)">{{ s }}</button>
              </div>
            </div>

            <div
              v-for="(msg, i) in chatMessages"
              :key="i"
              :style="msg.from === 'client' ? 'display:flex;justify-content:flex-end' : 'display:flex;justify-content:flex-start'"
            >
              <!-- System message -->
              <div v-if="msg.from === 'system'" style="width:100%;text-align:center">
                <span style="font-size:11px;background:rgba(0,0,0,.1);color:#555;padding:3px 10px;border-radius:20px">{{ msg.text }}</span>
              </div>

              <!-- Client/Bot message -->
              <div
                v-else
                :style="msg.from === 'client'
                  ? 'background:#dcf8c6;padding:10px 14px;border-radius:12px 12px 3px 12px;max-width:70%;box-shadow:0 1px 2px rgba(0,0,0,.1)'
                  : 'background:white;padding:10px 14px;border-radius:12px 12px 12px 3px;max-width:75%;box-shadow:0 1px 2px rgba(0,0,0,.1)'"
              >
                <div style="white-space:pre-wrap;font-size:13.5px;line-height:1.5">{{ msg.text }}</div>
                <div style="font-size:10px;color:#888;text-align:right;margin-top:4px">
                  {{ msg.time }}
                  <span v-if="msg.from === 'client'"> ✓✓</span>
                </div>
              </div>
            </div>

            <!-- Typing indicator -->
            <div v-if="botTyping" style="display:flex;justify-content:flex-start">
              <div style="background:white;padding:12px 16px;border-radius:12px 12px 12px 3px;box-shadow:0 1px 2px rgba(0,0,0,.1)">
                <span style="display:inline-flex;gap:4px">
                  <span class="dot-anim">●</span>
                  <span class="dot-anim" style="animation-delay:.2s">●</span>
                  <span class="dot-anim" style="animation-delay:.4s">●</span>
                </span>
              </div>
            </div>
          </div>

          <!-- Human mode banner -->
          <div v-if="humanMode" style="background:#fef3c7;border-top:1px solid #fde68a;padding:10px 16px;font-size:12px;color:#92400e;display:flex;align-items:center;gap:8px">
            🔔 <strong>Modo humano activo.</strong> El bot no responderá hasta que un agente devuelva la conversación.
            <RouterLink v-if="conversationId" :to="`/conversations/${conversationId}`" style="color:var(--color-primary);font-weight:600">Ver conversación →</RouterLink>
          </div>

          <!-- Input area -->
          <div style="padding:12px 16px;background:white;border-top:1px solid var(--color-border);display:flex;gap:8px;align-items:center">
            <input
              ref="inputRef"
              v-model="inputText"
              class="form-input"
              placeholder="Escribe un mensaje..."
              style="flex:1"
              :disabled="sending"
              @keydown.enter.prevent="send"
            />
            <button
              class="btn btn-primary"
              style="border-radius:50%;width:40px;height:40px;padding:0;justify-content:center"
              :disabled="!inputText.trim() || sending"
              @click="send"
            >
              {{ sending ? '⏳' : '➤' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Right panel -->
      <div style="width:240px;display:flex;flex-direction:column;gap:12px">
        <div class="card">
          <div class="card-header"><span class="card-title">Comandos rápidos</span></div>
          <div style="padding:12px;display:flex;flex-direction:column;gap:6px">
            <button v-for="s in suggestions" :key="s" class="btn btn-secondary btn-sm" style="text-align:left;justify-content:flex-start" @click="sendSuggestion(s)">{{ s }}</button>
          </div>
        </div>

        <div class="card" v-if="conversationId">
          <div class="card-header"><span class="card-title">Conversación</span></div>
          <div style="padding:12px;font-size:12px;display:flex;flex-direction:column;gap:6px">
            <RouterLink :to="`/conversations/${conversationId}`" class="btn btn-secondary btn-sm" style="justify-content:center">📋 Ver en panel</RouterLink>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><span class="card-title">ℹ️ Info</span></div>
          <div style="padding:12px;font-size:11.5px;color:var(--color-text-muted);line-height:1.6">
            <p>Este simulador usa el mismo motor de conversación que WhatsApp.</p>
            <br/>
            <p>El número de teléfono identifica al cliente en la base de datos.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, computed } from 'vue';
import { RouterLink } from 'vue-router';
import { chatbotService } from '../services/conversations.service';
import api from '../services/api';

interface ChatMsg {
  from: 'client' | 'bot' | 'system';
  text: string;
  time: string;
}

const clientPhone = ref('3009999999');
const inputText = ref('');
const chatMessages = ref<ChatMsg[]>([]);
const conversationId = ref<string | null>(null);
const botTyping = ref(false);
const sending = ref(false);
const humanMode = ref(false);
const chatContainer = ref<HTMLElement | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);
const aiProvider = ref<'mock' | 'openai'>('mock');

const providerLabel = computed(() => aiProvider.value === 'openai' ? '🟢 OpenAI activo' : '🟡 MockAI activo');
const providerBadge = computed(() => aiProvider.value === 'openai' ? 'badge-green' : 'badge-yellow');

const suggestions = [
  'Hola', 'Ver productos', 'Buscar camisetas', '¿Cuánto cuesta?',
  'Agregar al carrito', 'Mi carrito', 'Quiero comprar', 'Estado de mi pedido',
  'Quiero hablar con un asesor', 'Horarios',
];

function now() {
  return new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}

function addMessage(from: ChatMsg['from'], text: string) {
  chatMessages.value.push({ from, text, time: now() });
  nextTick(() => {
    if (chatContainer.value) chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
  });
}

async function send() {
  const text = inputText.value.trim();
  if (!text || sending.value) return;

  inputText.value = '';
  addMessage('client', text);
  sending.value = true;
  botTyping.value = true;

  try {
    const res = await chatbotService.sendMessage(clientPhone.value, text);
    conversationId.value = res.conversationId;
    humanMode.value = res.humanMode;

    botTyping.value = false;

    if (res.humanMode) {
      addMessage('system', '🔔 Conversación transferida a agente humano');
    } else if (res.botResponse) {
      addMessage('bot', res.botResponse);
    }
  } catch (e: any) {
    botTyping.value = false;
    addMessage('system', '❌ Error: ' + (e.response?.data?.message ?? e.message));
  } finally {
    sending.value = false;
    nextTick(() => inputRef.value?.focus());
  }
}

function sendSuggestion(text: string) {
  inputText.value = text;
  send();
}

function resetChat() {
  chatMessages.value = [];
  conversationId.value = null;
  humanMode.value = false;
  clientPhone.value = `300${Math.floor(Math.random() * 9000000 + 1000000)}`;
}

async function checkProvider() {
  try {
    const res = await api.get('/messages/process', { params: { provider: true } }).catch(() => null);
    // Intentar detectar si OpenAI está activo via una llamada indirecta
    aiProvider.value = 'mock'; // Por defecto mock
  } catch { /* ignorar */ }
}

onMounted(() => {
  checkProvider();
  nextTick(() => inputRef.value?.focus());
});
</script>

<style scoped>
@keyframes blink {
  0%, 80%, 100% { opacity: .15; transform: scale(.8); }
  40% { opacity: 1; transform: scale(1); }
}
.dot-anim {
  animation: blink 1.4s infinite;
  font-size: 10px;
  color: var(--color-primary);
  display: inline-block;
}
</style>
