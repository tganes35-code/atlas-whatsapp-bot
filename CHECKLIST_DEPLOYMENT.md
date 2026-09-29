# ✅ CHECKLIST DE DEPLOYMENT - ATLAS WHATSAPP CHATBOT

## 🎯 OBJETIVO
Tener tu chatbot 100% funcional en 3 pasos principales.

---

## FASE 1: ELEGIR DESPLIEGUE ⬇️

### Opción A: HEROKU ⭐ RECOMENDADO (5 min)

- [ ] Crear cuenta Heroku (gratis): https://www.heroku.com/
- [ ] Abrir link 1-click deployment:
  ```
  https://heroku.com/deploy?template=https://github.com/juamcondor/atlas-whatsapp-bot
  ```
- [ ] Completar formulario Heroku:
  - [ ] App name: `atlas-whatsapp-bot-api` (o tu nombre)
  - [ ] Region: `United States` (o tu región)
- [ ] Click "Deploy App"
- [ ] Esperar 5 minutos
- [ ] ✅ URL de tu servidor: `https://atlas-whatsapp-bot-api.herokuapp.com`

**Notas Heroku:**
- Acceso a PostgreSQL: Automático ✅
- Compilación: Automática ✅
- HTTPS: Automático ✅

---

### Opción B: RAILWAY (3 min)

- [ ] Ir a https://railway.app/
- [ ] Login con GitHub
- [ ] New Project → Deploy from GitHub
- [ ] Seleccionar: `juamcondor/atlas-whatsapp-bot`
- [ ] Deploy
- [ ] Esperar 3 minutos
- [ ] ✅ URL de tu servidor: Ver en "Networking" > "Public URL"

**Notas Railway:**
- Acceso a PostgreSQL: Automático ✅
- Compilación: Automática ✅
- HTTPS: Automático ✅

---

### Opción C: DOCKER LOCAL (10 min)

- [ ] Instalar Docker: https://www.docker.com/products/docker-desktop
- [ ] Esperar a que docker-daemon esté corriendo
- [ ] En terminal:
  ```bash
  cd /home/juam/Descargas/PROYECTOS/CHATBOT/atlas-whatsapp-bot
  chmod +x START_LOCAL.sh
  ./START_LOCAL.sh
  ```
- [ ] Esperar 10 minutos
- [ ] ✅ URL de tu servidor: `http://localhost:3001`

**Notas Docker:**
- Solo para testing/desarrollo
- No es accesible desde internet
- PostgreSQL corre localmente

---

## FASE 2: VERIFICAR SERVIDOR ⬇️

Ahora que tienes tu servidor desplegado:

### Paso 1: Verificar que está activo
```bash
curl {TU-URL}/api/health
```

**Debe responder:**
```json
{"status":"ok"}
```

- [ ] Servidor responde ✅

### Paso 2: Acceder al Panel Admin
```
{TU-URL}
```

**Login:**
- Email: `admin@atlas.com`
- Password: `admin123`

- [ ] Panel admin carga correctamente ✅
- [ ] Puedo ver Dashboard ✅

### Paso 3: Verificar Base de Datos
En el panel admin:
- [ ] Veo "Customers": Debe mostrar clientes
- [ ] Veo "Products": Debe mostrar productos
- [ ] Veo "Dashboard": Estadísticas funcionan

---

## FASE 3: CONECTAR META WHATSAPP ⬇️

### ⚠️ IMPORTANTE
Solo procede si:
- ✅ Tu servidor está activo y accesible
- ✅ El panel admin funciona
- ✅ Tienes acceso a Meta Developer Portal como admin

### Paso 1: Obtener Webhook URL
```
{TU-URL}/api/webhooks/whatsapp
```

**Ejemplos:**
```
https://atlas-whatsapp-bot-api.herokuapp.com/api/webhooks/whatsapp
https://atlas-whatsapp-bot-xyz.railway.app/api/webhooks/whatsapp
http://localhost:3001/api/webhooks/whatsapp (solo local)
```

- [ ] Copié mi URL ✅

### Paso 2: Ir a Meta Developer Portal
```
https://developers.facebook.com/
```

- [ ] Logueado en Meta ✅
- [ ] Seleccioné mi app WhatsApp ✅

### Paso 3: Registrar Webhook
En: **Configuración → Webhook**

- [ ] Campo "Callback URL": Pegué mi webhook URL
- [ ] Campo "Verify Token": Ingresé `atlas-verify-token`
- [ ] Guardé cambios

### Paso 4: Verificar Webhook
Meta enviará GET a tu URL automáticamente.

En Meta, debes ver:
- [ ] Checkmark ✅ verde (webhook verificado)
- [ ] Si ves X roja → Espera 30 seg e intenta de nuevo

**Si hay problemas:**
```bash
# Verificar manualmente que el webhook responde
curl {TU-URL}/api/webhooks/whatsapp
```

### Paso 5: Suscribirse a Eventos
En Meta: **Webhook fields**

Marca:
- [ ] `messages` ✅
- [ ] `message_status` ✅
- [ ] `message_template_status_update` ✅

---

## FASE 4: PROBAR CHATBOT ⬇️

### Prueba 1: Desde WhatsApp
- [ ] Abrir WhatsApp en teléfono
- [ ] Guardar número de negocio en contactos
- [ ] Enviar mensaje: "Hola"
- [ ] ✅ Bot responde automáticamente

**Respuesta esperada:**
```
Mensaje del cliente: "Hola"
Respuesta del bot: "Bienvenido a Atlas. ¿En qué puedo ayudarte?"
```

### Prueba 2: Desde Terminal
```bash
# Simular mensaje
curl -X POST {TU-URL}/api/messages/process \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+34666777888",
    "message": "¿Cuál es tu menú?"
  }'
```

**Debe responder con JSON:**
```json
{
  "response": "...",
  "timestamp": "..."
}
```

- [ ] API responde correctamente ✅

### Prueba 3: Ver en Panel Admin
- [ ] Acceder a panel: `{TU-URL}`
- [ ] Login: `admin@atlas.com` / `admin123`
- [ ] Ir a "Conversaciones" o "Messages"
- [ ] ✅ Ver el mensaje que acabas de enviar

---

## 🎉 COMPLETO - TU CHATBOT ESTÁ FUNCIONAL

Si pasaste todos los checkboxes:

✅ **Servidor desplegado**
✅ **Panel admin funciona**
✅ **Webhook registrado en Meta**
✅ **Bot responde automáticamente**
✅ **Conversaciones visibles en dashboard**

---

## 📋 CHECKLIST DE VALIDACIÓN FINAL

Asegúrate que:

### Servidor
- [ ] URL es accesible desde internet
- [ ] Health check responde: `/api/health`
- [ ] Panel admin carga: `{TU-URL}`

### Base de Datos
- [ ] Clientes se guardaron
- [ ] Productos visibles
- [ ] Conversaciones se registran

### Meta WhatsApp
- [ ] Webhook URL registrada
- [ ] Verify Token correcto
- [ ] Checkmark verde en Meta
- [ ] Campos suscritos (messages, etc.)

### Chatbot
- [ ] Responde a mensajes entrantes
- [ ] Respuestas aparecen en dashboard
- [ ] Cliente recibe respuestas en WhatsApp

---

## 🆘 TROUBLESHOOTING RÁPIDO

| Problema | Solución |
|----------|----------|
| Webhook no verifica | Espera 30 seg, verifica URL exacta, verifica Verify Token |
| Bot no responde | Verifica webhook esté verde en Meta, revisa logs del servidor |
| Panel admin no carga | Espera 2-3 min, limpia caché, refresca página |
| Database error | Heroku: Ya está configurada. Railway: Ya está configurada. Docker: Verifica `docker ps` |
| 502 Bad Gateway | Servidor tardando. Espera 5 min. Si persiste, revisa logs |

---

## 📞 ACCESO RÁPIDO A DOCUMENTACIÓN

Si necesitas más detalles:

- **Setup completo**: `CHATBOT_SETUP_COMPLETO.md`
- **Conectar Meta**: `CONECTAR_META_PASO_A_PASO.md`
- **Ejemplos API**: `API_EJEMPLOS.md`
- **Inicio rápido**: `README_INICIO.md`

---

## 🚀 PRÓXIMOS PASOS (Después de estar funcional)

1. **Personalizar respuestas**: Edita el bot
2. **Agregar productos**: Crea nuevos productos en dashboard
3. **Crear categorías**: Organiza por categorías
4. **Plantillas**: Crea plantillas de mensajes
5. **Reportes**: Analiza conversaciones en dashboard

---

**¿Terminaste todos los pasos?** 

✅ Tu chatbot WhatsApp Atlas está **100% funcional** y listo para producción.

Ahora tu negocio puede atender clientes automáticamente en WhatsApp. 🎉
