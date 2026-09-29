# 🎯 SIGUIENTE PASO: CONECTAR CON META WHATSAPP

Tu chatbot está **100% funcional localmente**. Ahora vamos a conectarlo con **WhatsApp Business real**.

---

## 📋 NECESITO QUE ME PROPORCIONES:

Abre una terminal y ejecuta:

```bash
cd /home/juam/Descargas/PROYECTOS/CHATBOT/atlas-whatsapp-bot
./setup-meta.sh
```

El script te pedirá:

1. **Access Token** (de Meta)
   - Obtén en: https://developers.facebook.com/apps/
   - Tu App → WhatsApp → Getting Started
   - Copia el "Access Token"

2. **Phone Number ID**
   - Obtén en: https://developers.facebook.com/apps/
   - Tu App → WhatsApp → Phone Numbers
   - Copia el "Phone Number ID"

3. **App Secret**
   - Obtén en: https://developers.facebook.com/apps/
   - Tu App → Settings → Basic
   - Copia el "App Secret"

4. **URL del servidor**
   - Ej: `https://atlas-whatsapp.onrender.com`
   - (O `http://localhost:3001` para testing local)

---

## 🚀 SI PREFIERES HACERLO MANUALMENTE:

### Opción 1: Script Automático (RECOMENDADO)

```bash
./setup-meta.sh
```

### Opción 2: Editar .env directamente

Edita `backend/.env`:

```env
WHATSAPP_ACCESS_TOKEN=EAAX9C6hGVd4BSnhABoQ41NAC6TAZACaTZCMdjXqWvX3Z... (tu token)
WHATSAPP_PHONE_NUMBER_ID=1240602945813907 (tu ID)
WHATSAPP_VERIFY_TOKEN=atlas-verify-token (NO cambiar)
WHATSAPP_APP_SECRET=abcdef123456... (tu secret)
LOCAL_MODE=false  ← IMPORTANTE: cambiar a false
```

### Opción 3: Variables de Entorno (Producción)

```bash
export WHATSAPP_ACCESS_TOKEN=tu_token
export WHATSAPP_PHONE_NUMBER_ID=tu_id
export WHATSAPP_APP_SECRET=tu_secret
npm run start:prod
```

---

## 🌍 DESPLEGAR EN SERVIDOR PÚBLICO

Para que Meta pueda enviar mensajes, el servidor debe estar en internet.

### OPCIÓN A: Render.com (RECOMENDADO - Gratis)

```bash
# 1. Ir a https://render.com
# 2. Crear cuenta (gratis)
# 3. Conectar GitHub
# 4. Crear nuevo "Web Service"
# 5. Seleccionar este repositorio
# 6. Build: npm install && npm run build
# 7. Start: npm run start:prod
# 8. Te dará URL: https://tu-app.onrender.com
```

### OPCIÓN B: Railway.app

```bash
# 1. Ir a https://railway.app
# 2. Crear cuenta (gratis)
# 3. Crear nuevo proyecto
# 4. Conectar GitHub
# 5. Deploy automático
# 6. URL: https://tu-proyecto.railway.app
```

### OPCIÓN C: Heroku

```bash
heroku login
heroku create atlas-whatsapp-bot
git push heroku main
# URL: https://atlas-whatsapp-bot.herokuapp.com
```

---

## 🔧 CONFIGURAR WEBHOOK EN META

Una vez que tengas servidor público:

1. Ve a https://developers.facebook.com/apps/
2. Tu App → **WhatsApp** → **Configuration**
3. En **Webhook Configuration**, haz click en **Edit**:

   **Callback URL**:
   ```
   https://tu-servidor.com/api/webhooks/whatsapp
   ```

   **Verify Token**:
   ```
   atlas-verify-token
   ```

4. Click en **Verify and Save**
5. Meta te enviará una petición GET para verificar
6. Tu backend responde automáticamente ✅

---

## ✅ VERIFICACIÓN FINAL

### Test 1: Webhook está registrado

```bash
curl -X GET "https://tu-servidor.com/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=atlas-verify-token&hub.challenge=TEST123"

# Debe retornar: TEST123
```

### Test 2: Bot responde en WhatsApp

1. Abre WhatsApp en tu móvil
2. Envía un mensaje a tu número de negocio
3. El bot debe responder en 5 segundos
4. ✅ ¡Listo!

---

## 🚨 SI ALGO SALE MAL

### "Invalid OAuth access token"

**Solución**: Token expiró

```bash
# 1. Ve a Meta Developer Portal
# 2. Genera nuevo token
# 3. Actualiza .env
# 4. Reinicia servidor
```

### "Webhook not reachable"

**Solución**: URL no es accesible

```bash
# 1. Verifica que servidor está corriendo
# 2. Verifica URL pública es correcta
# 3. Intenta: curl https://tu-url.com
# 4. Debe retornar 200
```

### "Phone number not found"

**Solución**: Phone Number ID incorrecto

```bash
# 1. Ve a Meta → WhatsApp → Phone Numbers
# 2. Copia el ID correcto
# 3. Actualiza .env
# 4. Reinicia
```

---

## 📖 DOCUMENTACIÓN COMPLETA

Lee estos archivos para más detalles:

- **CONECTAR_META_WHATSAPP.md** - Guía paso a paso (20 mins)
- **GUIA_RAPIDA.md** - Referencia rápida
- **RESUMEN_FINAL.md** - Documentación técnica

---

## 🎯 RESUMEN RÁPIDO

```bash
# 1. Configurar credenciales
./setup-meta.sh

# 2. Compilar
cd backend && npm run build

# 3. Desplegar (Render, Railway, Heroku, etc.)
./deploy.sh

# 4. Registrar webhook en Meta
   URL: https://tu-app.com/api/webhooks/whatsapp
   Token: atlas-verify-token

# 5. Probar
   Enviar WhatsApp → Bot responde ✅
```

---

## ⏱️ TIEMPO ESTIMADO

- Setup credenciales: **5 minutos**
- Desplegar servidor: **10-15 minutos**
- Registrar webhook: **5 minutos**
- **Total: 20-30 minutos**

---

## 🎉 UNA VEZ CONFIGURADO

El chatbot:
- ✅ Recibe mensajes reales de WhatsApp
- ✅ Responde automáticamente con IA
- ✅ Crea órdenes en la BD
- ✅ Puede derivar a agentes
- ✅ Registra estadísticas

**¡Tu chatbot estará 100% operativo!** 🚀

---

**¿Necesitas ayuda?** Lee CONECTAR_META_WHATSAPP.md
