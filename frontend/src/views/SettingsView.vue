<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">Configuración</div>
        <div class="page-subtitle">Configuración del sistema</div>
      </div>
    </div>

    <div class="page-body">
      <div style="max-width:640px;display:flex;flex-direction:column;gap:20px">

        <!-- IA Status -->
        <div class="card">
          <div class="card-header"><span class="card-title">🤖 Estado de la IA</span></div>
          <div class="card-body">
            <div style="display:flex;flex-direction:column;gap:12px;font-size:13.5px">
              <div style="display:flex;justify-content:space-between;align-items:center">
                <span>Proveedor activo</span>
                <span class="badge badge-yellow">MockAI (sin API key)</span>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center">
                <span>OpenAI</span>
                <span class="badge badge-gray">No configurado</span>
              </div>
              <div class="alert alert-warning" style="font-size:12px">
                Para activar OpenAI, agrega <code>OPENAI_API_KEY=...</code> en el archivo <code>backend/.env</code> y reinicia el servidor.
              </div>
            </div>
          </div>
        </div>

        <!-- WhatsApp -->
        <div class="card">
          <div class="card-header"><span class="card-title">📱 WhatsApp</span></div>
          <div class="card-body">
            <div style="font-size:13.5px;display:flex;flex-direction:column;gap:10px">
              <div style="display:flex;justify-content:space-between;align-items:center">
                <span>Modo</span>
                <span class="badge badge-yellow">LOCAL (simulación)</span>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center">
                <span>Webhook URL</span>
                <code style="font-size:11px;background:var(--color-bg);padding:4px 8px;border-radius:4px">POST /api/webhooks/whatsapp</code>
              </div>
              <div class="alert alert-warning" style="font-size:12px">
                Para conectar WhatsApp real, configura <code>LOCAL_MODE=false</code> y las credenciales de Meta Cloud API en <code>backend/.env</code>.
              </div>
            </div>
          </div>
        </div>

        <!-- Links útiles -->
        <div class="card">
          <div class="card-header"><span class="card-title">🔗 Links del sistema</span></div>
          <div class="card-body">
            <div style="display:flex;flex-direction:column;gap:10px;font-size:13.5px">
              <div style="display:flex;justify-content:space-between;align-items:center">
                <span>Swagger / API Docs</span>
                <a href="http://localhost:3001/api/docs" target="_blank" class="btn btn-secondary btn-sm">Abrir →</a>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center">
                <span>Simulador de chat</span>
                <RouterLink to="/simulator" class="btn btn-secondary btn-sm">Abrir →</RouterLink>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center">
                <span>Dashboard</span>
                <RouterLink to="/dashboard" class="btn btn-secondary btn-sm">Abrir →</RouterLink>
              </div>
            </div>
          </div>
        </div>

        <!-- Credenciales -->
        <div class="card">
          <div class="card-header"><span class="card-title">🔑 Credenciales de desarrollo</span></div>
          <div class="card-body">
            <div style="background:var(--color-bg);border-radius:var(--radius);padding:14px;font-size:12.5px;font-family:monospace">
              <div>Admin: admin@atlas.local / Admin123!</div>
              <div style="margin-top:4px">Agente: agente@atlas.local / Agent123!</div>
            </div>
            <p style="font-size:11.5px;color:var(--color-text-muted);margin-top:8px">⚠️ Solo para uso en desarrollo local.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router';
</script>
