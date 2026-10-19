# 🚀 GUÍA COMPLETA: Deploy a Render (100% GRATIS)

> **Duración total:** 15-20 minutos  
> **Costo:** $0 USD  
> **Requisito:** Cuenta GitHub  

---

## 📋 Resumen de lo que haremos

```
┌─────────────────────────────────────────────────────────────────┐
│                   ATLAS WHATSAPP BOT DEPLOY                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Conectar proyecto GitHub a Render (5 min)                 │
│     ✓ Auto-detects render.yaml                                │
│     ✓ Crea base de datos PostgreSQL                          │
│     ✓ Compila y despliega backend                            │
│                                                                 │
│  2. Obtener URL pública (automático)                          │
│     ✓ https://atlas-chatbot-api.onrender.com                │
│     ✓ SSL/HTTPS automático                                   │
│                                                                 │
│  3. Configurar webhook en Meta (5 min)                        │
│     ✓ Conecta Render con WhatsApp                            │
│     ✓ Verifica que Meta puede enviar mensajes                │
│                                                                 │
│  4. Probar con WhatsApp (5 min)                               │
│     ✓ Envía mensaje "Hola"                                   │
│     ✓ Bot responde automáticamente                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## PASO 1: Conectar a Render

### 1.1 Ve a Render

Abre en tu navegador:
```
https://render.com
```

### 1.2 Sign up con GitHub

1. Click en el botón grande **"Sign up"**
2. Selecciona **"Continue with GitHub"**
3. Autoriza Render en tu cuenta GitHub

### 1.3 Acceder al Dashboard

Una vez autenticado, verás el dashboard de Render.

### 1.4 Crear nuevo servicio

1. Click en botón **"New +"** (arriba derecha)
2. Selecciona **"Web Service"**

### 1.5 Conectar repositorio

1. En **"GitHub Account"**, busca tu usuario
2. En **"Repository"**, busca: `atlas-whatsapp-bot`
3. Click en el repositorio para conectarlo

Render auto-detectará `render.yaml` ✅

### 1.6 Configurar servicio

Render te muestra un formulario:

```
Name:                  atlas-chatbot-api
Environment:           Node
Region:                Oregon (usa-1) ← por defecto está bien
Branch:                main (o master)
Build Command:         Detecta automáticamente desde render.yaml
Start Command:         Detecta automáticamente desde render.yaml
```

### 1.7 Agregar variables de entorno

Click en **"Advanced"** o baja en la página.

Verás una sección **"Environment"** o **"Env Vars"**.

Agrega EXACTAMENTE estas variables (copia-pega):

```
JWT_SECRET=2c06ea44798166564bed642b45a77be91ddfbc47748e213acc36ed8f2cc2ad79
WHATSAPP_ACCESS_TOKEN=EAAX9C6hGVd4BS5fNtZBZA3ZAiF8GTJBb5ooZC83KZBp9TwliyAMEu3RyxO1lq3RfQ2APLrmwvvLbuSVnQxP1tlMSA9OS11qp7oWLZBHghXsZBOwZBQlQKGyqx7hkdoZAZAZCFyGlDcsvTBwdBBaKKRLvJyFbNxDtgG4GgtC2eyqUqAy0j7pIotn2NpJvwkZB6OwVVIZCLZBGBEbeGfME8qCT0mu8c8fRB4duXwcQO3tTSQNcO2OMzs2LHoFg05GmASB4Mt7FyNJbiEDwV8nSAedr6cl7dUZCgZDZD
WHATSAPP_PHONE_NUMBER_ID=1240602945813907
WHATSAPP_APP_SECRET=32dc8f5736a1cf7e7f89e031f5aa8c34
WHATSAPP_VERIFY_TOKEN=4f8a778432797258fdcdbdd45dfe6920
NODE_ENV=production
PORT=3000
LOCAL_MODE=false
CORS_ORIGIN=*
```

> **Nota:** Render crea la base de datos automáticamente. No necesitas agregar `DATABASE_URL`.

### 1.8 Crear el servicio

Click en botón azul **"Create Web Service"**

Render comienza a compilar y desplegar.

---

## ⏳ ESPERAR (5-10 minutos)

Verás una pantalla con:

```
Building...
Fetching build environment...
Running build command...
Deploying...
```

El build compile el código, genera las migraciones de Prisma y sube todo a Render.

**No cierres esta ventana.**

---

## 🎉 URL Pública Lista

Una vez terminado, Render te muestra:

```
https://atlas-chatbot-api.onrender.com
```

**COPIA Y GUARDA ESTA URL** ← La necesitas para Meta

---

## PASO 2: Verificar que funciona

### 2.1 Test simple

En tu terminal, ejecuta:

```bash
curl "https://atlas-chatbot-api.onrender.com/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=4f8a778432797258fdcdbdd45dfe6920&hub.challenge=test123"
```

Debe responder:
```
test123
```

Si funciona ✅, continúa al Paso 3.

---

## PASO 3: Configurar Webhook en Meta

### 3.1 Ir a Facebook Developer Console

Abre:
```
https://developers.facebook.com/apps
```

### 3.2 Seleccionar tu app

1. Click en tu app **"chatbot"**
2. En el menú izquierdo, busca **"Webhooks"** (bajo Configuración)

### 3.3 Agregar webhook

1. Click **"Edit Subscription"** o **"Add Webhook"**
2. Llena estos EXACTAMENTE:

```
Callback URL: https://atlas-chatbot-api.onrender.com/api/webhooks/whatsapp
Verify Token: 4f8a778432797258fdcdbdd45dfe6920
Subscribed Fields: messages, message_template_status_update
```

3. Click **"Verify and Save"**

Meta enviará una petición GET a tu URL para verificar. Si todo está bien, verás:

```
✅ Verified
```

---

## PASO 4: Probar el Chatbot

### 4.1 Enviar un mensaje

1. En WhatsApp, abre la conversación con el número del bot
2. Escribe: **"Hola"**
3. Presiona enviar

### 4.2 Esperar respuesta

El bot debe responder automáticamente en 1-3 segundos.

Si funciona ✅:

```
Usuario: Hola
Bot:     👋 Hola! ¿En qué puedo ayudarte?
```

---

## 🚨 Solucionar Problemas

### Problema: "Webhook verification failed"

**Causa:** URL incorrecta o token equivocado

**Solución:**
1. Copia la URL exacta de Render
2. Verifica que el verify token sea: `4f8a778432797258fdcdbdd45dfe6920`
3. Prueba con curl primero (Paso 2.1)

---

### Problema: Bot no responde

**Causa:** Backend no recibió el mensaje

**Solución:**
1. Revisa los logs en Render:
   - Dashboard → tu servicio → Logs
2. Busca errores en rojo
3. Si hay error de BD: Reinicia el servicio

---

### Problema: Build failed en Render

**Causa:** Error durante la compilación

**Solución:**
1. Revisa los logs completos
2. Verifica que todos los archivos están en Git
3. Si persiste: Contacta soporte de Render

---

## 📊 Dashboard de Render

Una vez desplegado, siempre puedes:

1. Ver **Logs** (para debugging)
2. Ver **Metrics** (CPU, memoria, tiempo de respuesta)
3. Ver **Events** (historial de deploys)
4. **Redeploy** (si necesitas actualizar)

---

## ✅ Checklist Final

```
[✓] Proyecto en GitHub
[✓] render.yaml configurado
[✓] Credenciales de Meta guardadas
[✓] Deploy a Render completado
[✓] URL pública obtenida
[✓] Webhook verificado en Meta
[✓] Bot responde en WhatsApp
[✓] ¡100% FUNCIONAL!
```

---

## 🎊 ¡LISTO!

Tu chatbot está funcionando 100% con:
- ✅ Backend en Render (gratis)
- ✅ Base de datos PostgreSQL (gratis)
- ✅ SSL/HTTPS (gratis)
- ✅ WhatsApp integrado
- ✅ Capacidad de testing

**Ahora puedes hacer testing completo sin pagar nada.** 🚀

---

## Próximos pasos (opcional)

Si quieres mejorar:
- Agregar frontend (React/Vue)
- Agregar más categorías de productos
- Personalizar respuestas del bot
- Conectar con CRM externo

Avísame si necesitas ayuda con cualquier cosa. 👋
