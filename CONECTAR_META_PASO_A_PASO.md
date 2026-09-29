# 🔗 CONECTAR META WHATSAPP - PASO A PASO

## ⚠️ IMPORTANTE
Este documento es específicamente para **registrar el webhook** de tu chatbot en Meta Developer Portal.
Solo necesitas esto después de haber desplegado tu servidor (Heroku, Railway o Docker).

---

## PREREQUISITOS
✅ Servidor desplegado en uno de estos (con URL pública):
- Heroku: `https://atlas-whatsapp-bot-api.herokuapp.com`
- Railway: `https://atlas-whatsapp-bot-xyz.railway.app`
- Docker local: `http://localhost:3001` (solo para testing local)

✅ Acceso a Meta Developer Portal como admin

---

## PASO 1: Obtener tu URL del Servidor

**Si desplegaste en Heroku:**
```
https://atlas-whatsapp-bot-api.herokuapp.com
(Heroku te da esta URL al terminar el deploy)
```

**Si desplegaste en Railway:**
```
https://atlas-whatsapp-bot-xyz.railway.app
(Railway muestra esto en "Networking" > "Public URL")
```

**Si usas Docker local:**
```
http://localhost:3001
(Solo para testing - no es accesible desde internet)
```

### ✅ Verificar que tu servidor está activo
```bash
curl {TU-URL}/api/health
```

Debe responder:
```json
{"status":"ok"}
```

Si no responde, espera 2-3 minutos más.

---

## PASO 2: Ir a Meta Developer Portal

### 2.1 Abrir Meta Developers
```
https://developers.facebook.com/
```

### 2.2 Ir a tu App
- Login con tu cuenta Meta
- Selecciona tu app WhatsApp Business
- Haz click en "Configuración" o "Settings"

---

## PASO 3: Registrar el Webhook

### 3.1 Buscar "Webhook"
En el menú izquierdo → WhatsApp → **Configuración** → Busca: "Webhook URL"

### 3.2 Configurar Webhook URL
En el campo **"Callback URL"**:

```
{TU-URL}/api/webhooks/whatsapp
```

**Ejemplos reales:**
```
https://atlas-whatsapp-bot-api.herokuapp.com/api/webhooks/whatsapp
https://atlas-whatsapp-bot-xyz.railway.app/api/webhooks/whatsapp
```

### 3.3 Configurar Verify Token
En el campo **"Verify Token"**:

```
atlas-verify-token
```

(Este es el token que tu servidor espera)

### 3.4 Guardar
- Click en "Guardar" o "Save"
- Meta enviará un GET a tu URL para verificarla

---

## PASO 4: Verificación Automática

Meta hará un GET a:
```
{TU-URL}/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=atlas-verify-token&hub.challenge=CHALLENGE_STRING
```

Tu servidor responderá automáticamente con:
```
CHALLENGE_STRING
```

### ✅ Si ves un checkmark verde
¡Webhook verificado! Puedes proceder.

### ❌ Si ves una X roja
- Verifica que la URL es correcta
- Verifica que el Verify Token es exacto: `atlas-verify-token`
- Espera 30 segundos e intenta de nuevo
- Revisa logs del servidor

---

## PASO 5: Suscribirse a Eventos

En la misma sección de Webhook, busca **"Webhook fields"** o **"Fields"**.

Marca estos campos para recibir notificaciones:

- ✅ `messages` - Recibir mensajes entrantes
- ✅ `message_status` - Saber si el mensaje fue entregado/leído
- ✅ `message_template_status_update` - Templates de plantillas

**Ejemplo visual:**
```
[ ] call
[ ] contact
[x] message
[ ] message_echo
[x] message_status
[x] message_template_status_update
[ ] order
```

---

## PASO 6: Verificar en Logs (Opcional)

En Meta Developer Portal → WhatsApp → **Logs**

Deberías ver eventos como:
```
POST /api/webhooks/whatsapp
Status: 200 OK
```

Si ves errores, revisa el mensaje de error.

---

## 🧪 PROBAR EL WEBHOOK

### Opción A: Desde WhatsApp
1. Abre WhatsApp en tu teléfono
2. Guarda el número de tu negocio (Business Account)
3. Envía un mensaje: "Hola"
4. El bot debería responder

### Opción B: Desde Terminal (Testing)
```bash
# Simular mensaje entrante
curl -X POST {TU-URL}/api/webhooks/whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "id": "123456789",
      "changes": [{
        "value": {
          "messaging_product": "whatsapp",
          "messages": [{
            "from": "1234567890",
            "id": "msg-123",
            "timestamp": "1234567890",
            "type": "text",
            "text": {"body": "Hola"}
          }]
        }
      }]
    }]
  }'
```

---

## 🔐 SEGURIDAD - Verificar Firma de Meta

Meta firma cada webhook. Tu servidor verifica automáticamente:

**Headers que Meta envía:**
```
X-Hub-Signature-256: sha256=...
```

Tu servidor valida que el mensaje viene realmente de Meta.
(Esto ocurre automáticamente en `POST /api/webhooks/whatsapp`)

---

## 📋 CHECKLIST FINAL

- [ ] URL del servidor es accesible: `curl {URL}/api/health`
- [ ] Webhook URL registrada en Meta: `{URL}/api/webhooks/whatsapp`
- [ ] Verify Token correcto: `atlas-verify-token`
- [ ] Campos suscritos: messages, message_status, message_template_status_update
- [ ] Webhook muestra checkmark verde en Meta
- [ ] Puedes enviar mensaje desde WhatsApp
- [ ] Bot responde automáticamente

---

## 🆘 TROUBLESHOOTING

### "Webhook verification failed"
```
❌ X roja en Meta Developer Portal
```

**Soluciones:**
1. Verifica URL es exacta y accesible
   ```bash
   curl {TU-URL}/api/webhooks/whatsapp
   ```
   Debe responder (no error 404 o 500)

2. Verifica Verify Token es exacto
   - Debe ser: `atlas-verify-token` (sin espacios)

3. Verifica firewall/proxy no bloquea a Meta
   - Si usas VPN o proxy corporativo, puede haber problemas

4. Espera 5 minutos e intenta de nuevo

### "Bot no responde a mensajes"
```
✅ Webhook verde pero bot no responde
```

**Soluciones:**
1. Verifica que los campos están suscritos (messages especialmente)
2. Revisa logs del servidor para errores
   ```bash
   heroku logs --tail  # Si usas Heroku
   ```
3. Verifica que el token de acceso es válido
4. Reinicia el servidor

### "403 Forbidden" al intentar registrar webhook
```
❌ Meta no te deja guardar
```

**Soluciones:**
1. Asegúrate ser admin de la app
2. Asegúrate tener permisos webhook
3. Intenta en otra navegador o ventana privada
4. Espera 30 minutos si acabas de crear la app

---

## 📞 INFORMACIÓN QUE YA ESTÁ CONFIGURADA

No necesitas cambiar esto, solo referencia:

**En tu servidor (.env):**
```
WHATSAPP_ACCESS_TOKEN=EAAX9C6hGVd4...
WHATSAPP_PHONE_NUMBER_ID=1240602945813907
WHATSAPP_VERIFY_TOKEN=atlas-verify-token
WHATSAPP_APP_SECRET=32dc8f5736a1cf7e7f89e031f5aa8c34
```

Estos valores están ya configurados. Meta solo necesita que registres:
- Webhook URL: `{TU-URL}/api/webhooks/whatsapp`
- Verify Token: `atlas-verify-token`

---

## ✨ ¡LISTO!

Después de completar estos pasos:

1. ✅ Meta y tu bot están conectados
2. ✅ Mensajes fluyen automáticamente
3. ✅ Bot responde a clientes
4. ✅ Panel admin muestra conversaciones en tiempo real

**Próximos pasos:**
- Ver conversaciones en panel admin
- Personalizar respuestas del bot
- Agregar productos/categorías
- Configurar plantillas de mensajes

---

**¿Necesitas ayuda?** Revisa los logs:
```bash
# Heroku
heroku logs --tail

# Railway
Abre dashboard → Logs

# Docker local
docker-compose logs -f
```
