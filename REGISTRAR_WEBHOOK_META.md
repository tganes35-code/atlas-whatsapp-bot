# 📱 REGISTRAR WEBHOOK EN META (PASO FINAL)

Una vez que tu chatbot está desplegado en Railway, necesitas **conectarlo con Meta WhatsApp**.

Este es el ÚLTIMO paso. Toma **5 minutos**.

---

## 🎯 PASO 1: OBTENER URL DE RAILWAY

Cuando Railway termina el deployment, verás:

**Dashboard → Tu proyecto → Deployments**

Busca la URL pública. Algo como:

```
https://atlas-whatsapp-bot-api.railway.app
```

O similar. **Cópiala.**

---

## 🎯 PASO 2: IR A META DEVELOPER PORTAL

Abre en navegador:

```
https://developers.facebook.com/apps/
```

Selecciona tu app de WhatsApp.

---

## 🎯 PASO 3: CONFIGURAR WEBHOOK

En el menú de la izquierda:

1. Selecciona tu app
2. Ve a **"WhatsApp"**
3. Click en **"Configuration"**

---

## 🎯 PASO 4: WEBHOOK CONFIGURATION

En la sección **"Webhook Configuration"**, haz click en **"Edit"** o **"Manage"**.

Te pedirá:

### Campo 1: Callback URL

**Ingresa:**

```
https://atlas-whatsapp-bot-api.railway.app/api/webhooks/whatsapp
```

(Reemplaza `atlas-whatsapp-bot-api.railway.app` con tu URL de Railway)

### Campo 2: Verify Token

**Ingresa:**

```
atlas-verify-token
```

---

## 🎯 PASO 5: GUARDAR

Click en:

- **"Verify and Save"** o
- **"Update"** o
- **"Save"**

Dependiendo de tu interfaz de Meta.

Meta enviará una petición GET a tu webhook para verificar.

**Tu backend responderá automáticamente.** ✅

---

## 🎯 PASO 6: SUSCRIBIRSE A EVENTOS

Una vez guardado, en la misma pantalla busca **"Webhook Fields"** o **"Subscribe to events"**.

Selecciona:

```
✓ messages
✓ message_status
✓ message_template_status_update
```

Click en **"Save"** o **"Subscribe"**.

---

## ✅ LISTO

Tu webhook está registrado.

Meta ahora enviará todos los mensajes de WhatsApp a:

```
https://tu-url-railway/api/webhooks/whatsapp
```

Y tu chatbot responderá automáticamente.

---

## 🧪 PROBAR

### Test 1: Verificar que el webhook funciona

```bash
curl "https://tu-url-railway/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=atlas-verify-token&hub.challenge=TEST123"

# Debe retornar: TEST123
```

### Test 2: Enviar WhatsApp Real

1. Abre WhatsApp en tu móvil
2. Busca el número de negocio (el que configuraste en Meta)
3. Envía un mensaje: `"Hola"`
4. El bot debe responder en **5 segundos** ✅

Si no responde:
- Espera 10 segundos más (a veces tarda)
- Revisa los logs en Railway Dashboard
- Verifica que el webhook esté guardado correctamente

---

## 📊 VER LOGS

Si algo falla, ve a:

**Railway Dashboard → Tu proyecto → Logs**

Busca mensajes como:

```
[WhatsappController] Received message from +1234567890: "Hola"
[MessagesService] Processing...
[AIService] Response: "¡Hola! Aquí está nuestro catálogo..."
[WhatsappService] Sending to Meta...
```

---

## 🎉 CUANDO FUNCIONA

Tu chatbot:

✅ Recibe mensajes reales de WhatsApp  
✅ Responde automáticamente con IA  
✅ Crea órdenes en la BD  
✅ Muestra estadísticas en dashboard  
✅ Puede derivar a agentes humanos  

---

## ⚠️ TROUBLESHOOTING

### Error: "Webhook URL is invalid"

```
Solución:
1. Verifica que la URL es correcta
2. Abre https://tu-url/api/webhooks/whatsapp en navegador
   Debe retornar un error 400 (es normal sin parámetros)
3. Si no funciona, Railway aún está compilando
   Espera 2-3 minutos más
```

### Error: "Callback verification failed"

```
Solución:
1. Verifica que Verify Token sea EXACTAMENTE: atlas-verify-token
2. Verifica que el token en tu código sea igual
3. En .env debe estar: WHATSAPP_VERIFY_TOKEN=atlas-verify-token
```

### Bot no responde en WhatsApp

```
Solución:
1. Ve a Railway Logs y busca errores
2. Verifica que LOCAL_MODE=false en variables
3. Verifica que WHATSAPP_ACCESS_TOKEN no esté expirado
4. Intenta enviar otro mensaje (a veces tarda)
```

---

## 📞 INFORMACIÓN RÁPIDA

| Campo | Valor |
|-------|-------|
| Webhook URL | `https://tu-url-railway/api/webhooks/whatsapp` |
| Verify Token | `atlas-verify-token` |
| Eventos | messages, message_status |
| Método | POST (para mensajes), GET (para verificación) |

---

## 🚀 SIGUIENTE

Una vez que todo funciona:

1. ✅ Prueba enviar más mensajes
2. ✅ Prueba crear órdenes via chatbot
3. ✅ Verifica que aparecen en dashboard
4. ✅ ¡Tu chatbot está vivo en producción! 🎉

---

**¿Problemas?** Revisa los logs de Railway o contacta al soporte.

**¿Todo funciona?** ¡Felicidades! Tienes un chatbot WhatsApp 100% operativo 🎊
