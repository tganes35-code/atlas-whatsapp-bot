# ✅ Deploy Checklist - Atlas WhatsApp Bot

**Estado del Deploy**: Credenciales configuradas, listo para Railway

---

## 🚀 Paso 1: Deploy a Railway (Haz esto ahora)

1. Ve a: https://railway.app/new
2. Click "Deploy from GitHub"
3. Selecciona: `atlas-whatsapp-bot`
4. Espera 3-5 minutos
5. Copia la URL que aparece (ejemplo: `https://atlas-bot-xxx.railway.app`)

---

## 🔗 Paso 2: Configurar Webhook en Meta (Después del deploy)

Una vez que Railway termina y te da la URL:

1. Ve a: https://developers.facebook.com/apps/
2. Selecciona tu app "chatbot"
3. Ve a: Webhooks (o API Setup → Webhooks)
4. Click "Edit Subscription" o "Configure Webhook"
5. Llena estos datos:

```
Callback URL: https://atlas-bot-xxx.railway.app/api/webhooks/whatsapp
Verify Token: 4f8a778432797258fdcdbdd45dfe6920
Events: messages, message_template_status_update
```

6. Click "Save"

---

## ✅ Paso 3: Verificar que funciona

```bash
# Reemplaza tu-url-railway con la URL que te dio Railway
curl "https://tu-url-railway.app/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=4f8a778432797258fdcdbdd45dfe6920&hub.challenge=test123"

# Debe responder: test123
```

---

## 🎉 Paso 4: Probar el chatbot

1. Agrega el número de WhatsApp de prueba a tus contactos
2. Envía un mensaje: "Hola"
3. El bot debe responder automáticamente ✅

---

## 📊 Credenciales Guardadas

```
WHATSAPP_ACCESS_TOKEN ........... ✓ Configurado
WHATSAPP_PHONE_NUMBER_ID ........ 1240602945813907 ✓
WHATSAPP_APP_SECRET ............. ✓ Configurado
WHATSAPP_VERIFY_TOKEN ........... 4f8a778432797258fdcdbdd45dfe6920 ✓
JWT_SECRET ....................... ✓ Configurado
NODE_ENV ......................... production ✓
```

---

## 🔑 Variables ya en el código

No necesitas hacer nada más. Todo está en:
- `backend/.env.production` (credenciales guardadas)
- `railway.json` (config automática)
- `docker-compose.prod.yml` (stack Docker)

---

## 📝 Notas Importantes

- Railway crea la base de datos automáticamente
- SSL/HTTPS es automático
- El backend se compila automáticamente
- Las migraciones se ejecutan automáticamente
- El admin panel estará en: https://tu-url-railway.app (solo backend por ahora)

---

## 🚨 Si algo falla

Revisa los logs en Railway:
1. Dashboard de Railway
2. Tu proyecto
3. Click "View Logs"
4. Busca el error

---

**¡Ese es TODO lo que necesitas hacer!** 🎉
