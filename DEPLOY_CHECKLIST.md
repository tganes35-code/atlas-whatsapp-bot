# ✅ Deploy Checklist - Atlas WhatsApp Bot

**Estado del Deploy**: Credenciales configuradas, listo para RENDER (100% GRATIS)

---

## 🚀 Paso 1: Deploy a RENDER (3-5 minutos)

### 1.1 Acceder a Render
1. Ve a: https://render.com
2. Click "Sign up" o "Sign in"
3. Elige "Continue with GitHub"
4. Autoriza Render en GitHub

### 1.2 Crear nuevo servicio
1. En tu dashboard de Render, click "New +"
2. Selecciona "Web Service"
3. Conecta tu repositorio GitHub: `atlas-whatsapp-bot`
4. Render auto-detectará `render.yaml`

### 1.3 Configurar variables de entorno
Render te pide rellenar variables. Usa EXACTAMENTE estos valores:

```
JWT_SECRET = 2c06ea44798166564bed642b45a77be91ddfbc47748e213acc36ed8f2cc2ad79
WHATSAPP_ACCESS_TOKEN = EAAX9C6hGVd4BS5fNtZBZA3ZAiF8GTJBb5ooZC83KZBp9TwliyAMEu3RyxO1lq3RfQ2APLrmwvvLbuSVnQxP1tlMSA9OS11qp7oWLZBHghXsZBOwZBQlQKGyqx7hkdoZAZAZCFyGlDcsvTBwdBBaKKRLvJyFbNxDtgG4GgtC2eyqUqAy0j7pIotn2NpJvwkZB6OwVVIZCLZBGBEbeGfME8qCT0mu8c8fRB4duXwcQO3tTSQNcO2OMzs2LHoFg05GmASB4Mt7FyNJbiEDwV8nSAedr6cl7dUZCgZDZD
WHATSAPP_PHONE_NUMBER_ID = 1240602945813907
WHATSAPP_APP_SECRET = 32dc8f5736a1cf7e7f89e031f5aa8c34
WHATSAPP_VERIFY_TOKEN = 4f8a778432797258fdcdbdd45dfe6920
NODE_ENV = production
PORT = 3000
LOCAL_MODE = false
CORS_ORIGIN = *
```

### 1.4 Crear el servicio
1. Click "Create Web Service"
2. Render crea automáticamente:
   - Base de datos PostgreSQL
   - Backend API en Node.js
   - SSL/HTTPS
3. Espera 5-10 minutos mientras se compila y despliega

### 1.5 Obtener tu URL pública
Una vez terminado, Render te muestra en el dashboard:
```
URL: https://atlas-chatbot-api.onrender.com
```

**GUARDA ESTA URL** - la necesitas para Meta Webhooks

---

## 🔗 Paso 2: Configurar Webhook en Meta

Una vez que Render termina y tienes tu URL:

1. Ve a: https://developers.facebook.com/apps
2. Selecciona tu app "chatbot"
3. En el menú izquierdo: **Webhooks** (bajo Configuración)
4. Click **"Edit Subscription"** o **"Add Webhook"**
5. Llena EXACTAMENTE estos valores:

```
Callback URL: https://atlas-chatbot-api.onrender.com/api/webhooks/whatsapp
Verify Token: 4f8a778432797258fdcdbdd45dfe6920
Subscribed Fields: messages, message_template_status_update
```

6. Click **"Verify and Save"**

Meta enviará una petición GET a tu URL para verificar que funciona.

---

## ✅ Paso 3: Verificar que el webhook funciona

Meta debe confirmar: ✅ **"Verified"**

Para verificar manualmente desde terminal:

```bash
curl "https://atlas-chatbot-api.onrender.com/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=4f8a778432797258fdcdbdd45dfe6920&hub.challenge=test_challenge_123"
```

Debe responder: `test_challenge_123`

---

## 🎉 Paso 4: Probar el chatbot

1. Agrega el número de WhatsApp de prueba a tus contactos
2. Envía un mensaje: **"Hola"**
3. El bot debe responder automáticamente ✅

---

## 📊 Credenciales Guardadas en el Proyecto

```
✓ WHATSAPP_ACCESS_TOKEN ........ Configurado
✓ WHATSAPP_PHONE_NUMBER_ID .... 1240602945813907
✓ WHATSAPP_APP_SECRET ......... Configurado
✓ WHATSAPP_VERIFY_TOKEN ...... 4f8a778432797258fdcdbdd45dfe6920
✓ JWT_SECRET .................. Configurado
✓ NODE_ENV .................... production
```

---

## ✅ Archivos de configuración

Todo está listo:
- `render.yaml` - Configuración automática para Render
- `backend/.env.production` - Variables de entorno (credenciales guardadas)
- `backend/src/init-production.ts` - Inicializa BD con admin

---

## 🔍 Información sobre Render FREE TIER

**Límites (más que suficiente para testing):**
- 750 horas/mes (suficiente para 1 mes continuo)
- Base de datos PostgreSQL gratuita
- Almacenamiento: 100 MB gratuito
- Inactividad: se "duerme" después de 15 min sin peticiones
- Al recibir un mensaje de WhatsApp: **se activa en 30 segundos**
- SSL/HTTPS automático
- Backups automáticos

**Ideal para testing** porque:
- El "sleep" NO afecta WhatsApp (se activa cuando llega mensaje)
- 100% gratis sin tarjeta de crédito
- Base de datos incluida
- Escalable si necesitas pasar a producción

---

## 🚨 Si algo falla

Revisa los logs en Render:
1. Ve a tu dashboard de Render
2. Click en tu servicio "atlas-chatbot-api"
3. Tab **"Logs"** (abajo)
4. Busca mensajes de error en rojo

**Problemas comunes:**

| Error | Causa | Solución |
|-------|-------|----------|
| Build failed | Falta dependencia | Revisa `backend/package.json` |
| Database connection error | BD no se creó | Reinicia el servicio en Render |
| 502 Bad Gateway | Backend no responde | Revisa logs, es probable timeout |
| Webhook verification failed | URL incorrecta | Copia exactamente la URL de Render |
| No response from bot | Token incorrecto | Verifica los 4 tokens de Meta |

---

## 🚀 Próximos pasos (IMPORTANTE)

1. **Hacer commit de render.yaml** (ya está en Git):
   ```bash
   git add render.yaml
   git commit -m "config: add render.yaml for render production deployment"
   ```

2. **Ir a Render** → https://render.com
3. **Conectar GitHub** y seguir pasos 1.1 a 1.5 arriba
4. **Esperar a que termine el deploy** (~10 minutos)
5. **Obtener URL pública** y seguir Paso 2 (configurar webhook en Meta)
6. **Probar con WhatsApp** (Paso 4)

---

**¡Listo para desplegarse! 🎉**

**Tiempo total:** 15-20 minutos (5-10 deploy + 5-10 config en Meta + pruebas)
