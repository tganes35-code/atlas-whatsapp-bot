# 📱 GUÍA COMPLETA: CONECTAR CON META WHATSAPP

**Objective**: Hacer que tu chatbot reciba mensajes reales de WhatsApp y responda automáticamente.

**Tiempo estimado**: 20-30 minutos

---

## 🎯 REQUISITOS PREVIOS

✅ **Cuenta Meta** (Facebook/Instagram)  
✅ **Número de WhatsApp Business** (meta.com/es/business/suite/)  
✅ **App ID** de Meta (developers.facebook.com)  
✅ **Access Token** válido (tiene expiración)  
✅ **Phone Number ID** del número de negocio  
✅ **APP Secret** (se genera en Meta)  

---

## PASO 1️⃣: ACCEDER A META DEVELOPER PORTAL

### 1.1 - Ir a Meta Developer Portal

```
https://developers.facebook.com/apps/
```

### 1.2 - Crear o seleccionar App

- Si no tienes app, haz click en **"Create App"**
- **App Name**: `atlas-whatsapp-bot`
- **App Type**: `Business`
- **Purpose**: `Manage WhatsApp messaging`

### 1.3 - Obtener credenciales

En el panel de la app, ve a **Settings** → **Basic**:

- **App ID**: `[cópialo]`
- **App Secret**: `[cópialo]` ← **Esto lo necesitas para .env**

---

## PASO 2️⃣: CONFIGURAR WHATSAPP BUSINESS

### 2.1 - Acceder a WhatsApp Business

```
https://developers.facebook.com/docs/whatsapp/cloud-api/get-started
```

### 2.2 - Crear/Seleccionar Número de Negocio

- Ve a **Apps** → Tu app → **WhatsApp** → **Getting Started**
- Si no tienes número, haz click en **"Create Test Phone Number"**
- O conecta tu número real (premium)

### 2.3 - Obtener Phone Number ID

En **Phone Numbers**, copia el:
- **Phone Number ID**: `[cópialo]` ← Ya lo tienes en .env

---

## PASO 3️⃣: GENERAR ACCESS TOKEN

### 3.1 - Token Temporal de Prueba

En **Getting Started**, verás un token pre-generado:

```
Access Token: EAAX9C6hGVd4...
```

✅ **Ya lo tienes en tu .env**

### 3.2 - Token Permanente (Recomendado)

Para producción, genera un **System User Access Token**:

1. Ve a **Settings** → **Users and Permissions** → **System Users**
2. Haz click en **Create System User**
3. Asígnale role: **Admin**
4. Genera un nuevo Access Token
5. **Guárdalo en lugar seguro** (no expira, pero no la compartas)

⚠️ **Para ahora, usa el token temporal de Getting Started**

---

## PASO 4️⃣: REGISTRAR EL WEBHOOK

Este es el paso crítico - aquí le dices a Meta dónde enviar los mensajes.

### 4.1 - Configurar Webhook en Meta

1. Ve a **Apps** → Tu app → **WhatsApp** → **Configuration**

2. En **Webhook Configuration**, haz click en **Edit**:

   - **Callback URL**: 
     ```
     https://tu-servidor/api/webhooks/whatsapp
     ```
     (Reemplaza `tu-servidor` con tu URL real, ver paso 5)

   - **Verify Token**: 
     ```
     atlas-verify-token
     ```
     (Ya configurado en tu backend)

3. Haz click en **Verify and Save**

Meta enviará una solicitud GET para verificar. Tu backend debe responder con el `hub.challenge`.

### 4.2 - Verificación Automática

Tu backend (`/api/webhooks/whatsapp` GET) ya hace esto:

```typescript
@Get()
verifyWebhook(
  @Query('hub.mode') mode: string,
  @Query('hub.challenge') challenge: string,
  @Query('hub.verify_token') token: string,
) {
  if (mode === 'subscribe' && token === 'atlas-verify-token') {
    return challenge; // Meta valida el webhook
  }
}
```

---

## PASO 5️⃣: OBTENER URL PÚBLICA DEL SERVIDOR

Tu backend necesita estar accesible desde internet para que Meta envíe los mensajes.

### OPCIÓN A: Render.com (Recomendado - Fácil)

```bash
# 1. Ve a render.com
# 2. Crea una cuenta gratis
# 3. Conecta tu repositorio GitHub
# 4. Deploy automático
# 5. URL resultante: https://atlas-whatsapp-bot-api.onrender.com
```

### OPCIÓN B: Railway.app

```bash
# 1. Ve a railway.app
# 2. Conecta GitHub
# 3. Deploy
# 4. URL: https://tu-proyecto.railway.app
```

### OPCIÓN C: Heroku

```bash
# 1. heroku login
# 2. heroku create atlas-whatsapp-bot
# 3. git push heroku main
# 4. URL: https://atlas-whatsapp-bot.herokuapp.com
```

### OPCIÓN D: Servidor VPS propio (AWS, DigitalOcean, etc.)

```bash
# 1. SSH a tu servidor
# 2. Clone el repo
# 3. npm install && npm run build
# 4. npm run start:prod
# 5. Configura nginx como proxy
# 6. URL: https://tu-dominio.com
```

---

## PASO 6️⃣: ACTUALIZAR VARIABLES DE ENTORNO

Aún en el servidor elegido, configura estas variables:

```env
# .env en el servidor

# Base de datos (usa BD en nube si es posible)
DATABASE_URL=postgresql://user:pass@host:5432/atlas_db

# JWT
JWT_SECRET=your-secret-key-min-32-chars
JWT_EXPIRES_IN=7d

# IA
OPENAI_API_KEY=sk-proj-... (si quieres usar OpenAI)
OPENAI_MODEL=gpt-4o-mini

# WhatsApp ← ESTO ES LO IMPORTANTE
WHATSAPP_ACCESS_TOKEN=EAAX9C6hGVd4BSnhABoQ41NAC6TAZ... (de Meta)
WHATSAPP_PHONE_NUMBER_ID=1240602945813907
WHATSAPP_VERIFY_TOKEN=atlas-verify-token
WHATSAPP_APP_SECRET=abcdef123456... (de Meta Settings → Basic)

# Modo
LOCAL_MODE=false  ← ⭐ IMPORTANTE: false para WhatsApp real

# Servidor
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://tu-frontend.onrender.com
```

---

## PASO 7️⃣: REGISTRAR WEBHOOK EN META (FINAL)

1. Ve a **Apps** → Tu app → **WhatsApp** → **Configuration**

2. En **Webhook Configuration**, edita:

   **Callback URL**: `https://tu-servidor-public.com/api/webhooks/whatsapp`

   **Verify Token**: `atlas-verify-token`

3. Haz click en **Edit** o **Verify and Save**

Meta enviará una petición GET de verificación. Tu backend responderá automáticamente.

---

## PASO 8️⃣: SUSCRIBIRSE A EVENTOS DE MENSAJES

En **Webhook Configuration**, bajo **Webhook Fields**, selecciona:

```
✓ messages        (Recibir mensajes)
✓ message_status  (Confirmar envíos)
✓ message_template_status_update
```

Click en **Save**

---

## PASO 9️⃣: PROBAR EL WEBHOOK

### Test 1: Verificación Manual

```bash
curl -X GET "https://tu-servidor.com/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=atlas-verify-token&hub.challenge=TEST123"

# Debe retornar: TEST123
```

### Test 2: Enviar WhatsApp Real

1. Abre WhatsApp en tu móvil
2. Copia el número de negocio desde Meta
3. Envía un mensaje: `"Hola"`
4. El chatbot debe responder automáticamente

### Verificar Logs

```bash
# Si está en servidor:
ssh user@server
tail -f /var/log/atlas-backend.log

# O en Render:
Render Dashboard → Logs
```

Deberías ver:

```
[WhatsappController] Received message from 3001234567: "Hola"
[MessagesService] Processing message...
[AIService] MockAI response: "¡Hola! Aquí está nuestro catálogo..."
[WhatsappService] Sending message back to Meta...
```

---

## 🔟 CONFIGURAR RESPUESTA AUTOMÁTICA (OPCIONAL)

En **WhatsApp Business** → **Settings** → **Messaging**:

```
Auto-reply: "Gracias por tu mensaje. Un agente te responderá pronto."
```

---

## ⚠️ TROUBLESHOOTING

### Meta no envía mensajes al webhook

**Síntomas**: El bot no recibe mensajes

**Solución**:
```bash
# 1. Verificar URL pública es accesible
curl https://tu-servidor.com/api/webhooks/whatsapp

# 2. Verificar token en Meta coincida con código
# En .env: WHATSAPP_VERIFY_TOKEN=atlas-verify-token
# En Meta: Verify Token = atlas-verify-token

# 3. Verificar LOCAL_MODE=false en .env

# 4. Verificar tokens no estén expirados
```

### Bot responde pero Meta no lo envía

**Síntomas**: Los logs muestran que el bot responde, pero cliente no recibe

**Solución**:
```bash
# 1. Verificar WHATSAPP_ACCESS_TOKEN es válido
curl -X GET "https://graph.instagram.com/me?access_token=TU_TOKEN"
# Debe retornar: {"id": "..."}

# 2. Verificar WHATSAPP_PHONE_NUMBER_ID es correcto

# 3. Verificar que el formato del mensaje es válido
```

### Token expiró

**Síntomas**: Error 190 "Invalid OAuth access token"

**Solución**:
```bash
# 1. Ve a Meta Developer Portal
# 2. En Getting Started, genera nuevo token
# 3. Actualiza .env con el nuevo token
# 4. Reinicia el servidor
```

---

## 📞 FLUJO COMPLETO (EJEMPLO)

```
Cliente:
  Envía WhatsApp: "¿Qué productos tienen?"
  
Meta:
  Recibe el mensaje
  Lo envía a tu webhook: POST /api/webhooks/whatsapp
  
Tu Backend:
  Recibe en WhatsappController
  Extrae: phone, message, timestamp
  Llama a MessagesService.processIncomingMessage()
  
MockAI / OpenAI:
  Analiza: "productos"
  Genera respuesta: "Aquí están nuestros 8 productos..."
  
Tu Backend:
  Llama a Meta API
  POST https://graph.instagram.com/v18.0/{PHONE_ID}/messages
  Con: recipient_id, message_type, text
  
Meta:
  Envía el mensaje de vuelta al cliente
  
Cliente:
  Recibe en WhatsApp: "Aquí están nuestros 8 productos..."
```

---

## ✅ CHECKLIST FINAL

- [ ] Tienes credenciales Meta (App ID, App Secret, Access Token)
- [ ] Tienes Phone Number ID
- [ ] Servidor está en URL pública (Render, Railway, etc.)
- [ ] Webhook URL configurada en Meta
- [ ] Verify Token coincide en Meta y .env
- [ ] LOCAL_MODE=false en .env del servidor
- [ ] Tokens válidos (no expirados)
- [ ] Suscrito a eventos: messages, message_status
- [ ] Base de datos conectada en servidor
- [ ] Logs muestran que webhook recibe mensajes
- [ ] Bot responde en WhatsApp

---

## 🚀 RESUMEN RÁPIDO

1. **Obtén credenciales de Meta** (App Secret, Access Token)
2. **Despliega el backend** en servidor público (Render, Railway, etc.)
3. **Registra Webhook en Meta** con tu URL pública
4. **Actualiza .env** con credenciales Meta
5. **Prueba**: Envía un WhatsApp, debe responder automáticamente
6. **¡Listo!** El chatbot está conectado

---

**Última actualización**: 29 de Septiembre de 2026  
**Duración total**: ~30 minutos  
**Dificultad**: Media (pasos repetitivos)  
**Costo**: Gratis (Render free tier + Meta free tier)
