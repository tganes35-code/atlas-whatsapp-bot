# 🚀 DESPLEGAR CON DOCKER EN RENDER (OPCIÓN 1 - MÁS SIMPLE)

**Status**: ✅ Docker configurado  
**Tiempo estimado**: 10 minutos

---

## 📋 QUÉ VAMOS A HACER

1. Descargar tu proyecto en una carpeta temporal
2. Subirlo a Render usando Docker
3. Configurar variables de entorno
4. ¡Listo!

---

## 🎯 PASO 1: VOLVER A RENDER

En tu navegador, ya estás en: https://render.com/dashboard

Verás: "Configure and deploy your new Web Service"

**Click en "Connect"** (abajo a la derecha)

---

## 🎯 PASO 2: SELECCIONAR "EXISTING IMAGE"

En la pantalla anterior donde estaban las 3 opciones:
- Git Provider
- Public Git Repository  
- **Existing Image** ← CLICK AQUÍ

---

## 🎯 PASO 3: INGRESAR IMAGEN DOCKER

Cuando hagas click en "Existing Image", te pedirá:

**"Image URL"**: Ingresa esta URL Docker pública:

```
ghcr.io/cptl/render-buildpacks:latest
```

O si prefieres una más simple:

```
node:24-alpine
```

---

## 🎯 PASO 4: CONFIGURAR NOMBRE DEL SERVICIO

En el campo **"Service Name"**, ingresa:

```
atlas-whatsapp-bot-api
```

---

## 🎯 PASO 5: SELECCIONAR REGIÓN

**Region**: Selecciona la más cercana a ti:
- `Oregon` (USA)
- `São Paulo` (Latinoamérica)
- `Frankfurt` (Europa)

Recomendado para ti: **São Paulo**

---

## 🎯 PASO 6: CONFIGURAR VARIABLES DE ENTORNO

En la sección **"Environment Variables"**, COPIA Y PEGA EXACTAMENTE:

```
DATABASE_URL=postgresql://user:pass@localhost:5432/atlas_db
JWT_SECRET=your-secret-key-min-32-characters-long-here
JWT_EXPIRES_IN=7d
OPENAI_API_KEY=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
OPENAI_MODEL=gpt-4o-mini
WHATSAPP_ACCESS_TOKEN=EAAX9C6hGVd4BSnhABoQ41NAC6TAZACaTZCMdjXqWvX3ZBAKBOfVnyf0rYau28EtbwI2hnZBIZC3psJH1Cu2I0ecHjctUDT3SZCJPgJC3fham8ZBpMaH5At4oa4v5ltI6xZCAYNrdtZCz6rNoSBLABzX9YDloPfQQRKVje2FV6hlZCBDZB15lUdApvLw2oONcFZBF9Ruq5N2PhD0HQYW9eZArg6P4iAtZASml4v122kaheMWYJe5lEgUhvalsRYr29zboeX5O9OSvk6bNXxz2rsqBuHK83p
WHATSAPP_PHONE_NUMBER_ID=1240602945813907
WHATSAPP_VERIFY_TOKEN=atlas-verify-token
WHATSAPP_APP_SECRET=32dc8f5736a1cf7e7f89e031f5aa8c34
LOCAL_MODE=false
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://atlas-whatsapp-bot-web.onrender.com
```

---

## 🎯 PASO 7: PLAN DE PRECIOS

Verás un dropdown que dice **"Plan"**:
- Selecciona: **"Free"** (Gratis - suficiente para pruebas)

---

## 🎯 PASO 8: CREAR SERVICIO

Abajo a la derecha, click en:

**"Create Web Service"** o **"Deploy"**

---

## ⏳ ESPERAR DEPLOYMENT

Render comenzará a compilar (toma ~5-10 minutos):

1. Descarga la imagen Docker
2. Compila tu aplicación
3. Inicia el servidor
4. Verás logs en vivo

**Cuando termina**, verás:

```
✓ Service live on: https://atlas-whatsapp-bot-api.onrender.com
```

O similar. **Copia esa URL** ← La necesitarás para Meta

---

## ✅ SI VES "DEPLOYMENT SUCCESSFUL"

Tu chatbot está corriendo en:

```
https://atlas-whatsapp-bot-api.onrender.com
```

**Próximo paso:** Registrar webhook en Meta

---

## ⚠️ SI FALLA

### Error: "Build failed"

```
Solución:
1. Ve a Render Dashboard
2. Logs → Ver detalles del error
3. Busca en DESPLEGAR_EN_RENDER.md la sección troubleshooting
4. O contáctame si necesitas ayuda
```

### Error: "Service unavailable"

```
Significa que el servidor está compilando.
Espera 2-3 minutos más y recarga.
```

### Error: "Connection refused"

```
Verifica que:
- PORT=3000 esté en variables
- NODE_ENV=production esté en variables
```

---

## 🎯 SIGUIENTE: REGISTRAR WEBHOOK EN META

Una vez que tengas tu URL de Render:

1. Ve a: https://developers.facebook.com/apps/
2. Tu App → WhatsApp → Configuration
3. Webhook Configuration:
   - **Callback URL**: `https://atlas-whatsapp-bot-api.onrender.com/api/webhooks/whatsapp`
   - **Verify Token**: `atlas-verify-token`
4. Click en "Verify and Save"

---

## 🧪 PROBAR

Una vez registrado el webhook:

1. Abre WhatsApp en tu móvil
2. Busca tu número de negocio (en Meta)
3. Envía: `"Hola"`
4. El bot debe responder en 5 segundos ✅

---

## 📝 RESUMEN

```
1. Render Dashboard → New Web Service
2. Selecciona "Existing Image"
3. Ingresa variables de entorno
4. Click "Create Web Service"
5. Espera ~10 minutos
6. Copia URL pública
7. Registra webhook en Meta
8. ¡Prueba con WhatsApp!
```

---

**¿Problemas?** Mira los logs de Render o revisa DESPLEGAR_EN_RENDER.md

**¿Funciona?** ¡Felicidades! Tu chatbot está vivo 🎉
