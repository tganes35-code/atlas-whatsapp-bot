# 🚀 Atlas WhatsApp Chatbot - SETUP COMPLETO

## Estado del Sistema
✅ **TODO ESTÁ LISTO**
- Backend NestJS compilado y funcional
- Frontend Vue 3 compilado
- PostgreSQL + Base de datos con datos de ejemplo
- IA ChatBot integrada (MockAI + OpenAI)
- Credenciales Meta WhatsApp configuradas

---

## 📋 3 OPCIONES DE DESPLIEGUE

### OPCIÓN 1: Heroku (MÁS SIMPLE) ⭐ RECOMENDADO
**Tiempo:** 5 minutos | **Costo:** Gratis | **Dificultad:** Muy fácil

#### Paso 1: Crear cuenta Heroku
1. Ir a https://www.heroku.com/
2. Click en "Sign up" → Completar datos
3. Verificar email

#### Paso 2: Desplegar con 1 Click
1. **Copiar este enlace:**
```
https://heroku.com/deploy?template=https://github.com/juamcondor/atlas-whatsapp-bot
```
2. Abrir en navegador
3. Completar formulario:
   - **App name:** `atlas-whatsapp-bot-api` (o el que prefieras)
   - **Region:** `United States` o tu región
4. Click en "Deploy App"
5. Esperar 5 minutos

#### Paso 3: Obtener URL Pública
```
https://atlas-whatsapp-bot-api.herokuapp.com
```
(Heroku te dará la URL exacta al terminar)

#### Paso 4: Registrar Webhook en Meta
```
→ VER SECCIÓN "CONECTAR META WHATSAPP" ABAJO
```

---

### OPCIÓN 2: Railway (Muy Fácil)
**Tiempo:** 3 minutos | **Costo:** Primero $5 gratis | **Dificultad:** Muy fácil

#### Paso 1: Conectar GitHub
1. Ir a https://railway.app/
2. Login con GitHub
3. Click "New Project" → "Deploy from GitHub"
4. Seleccionar: `atlas-whatsapp-bot`

#### Paso 2: Configurar Variables
Railway detecta `railway.toml` automáticamente. Las variables de entorno están ya configuradas.

#### Paso 3: Obtener URL
Railway te da una URL pública automáticamente. Busca en "Networking".

---

### OPCIÓN 3: Docker Local (Máximo Control)
**Tiempo:** 10 minutos | **Costo:** Gratis | **Dificultad:** Fácil

#### Paso 1: Instalar Docker
- Windows: https://www.docker.com/products/docker-desktop
- Mac: https://www.docker.com/products/docker-desktop
- Linux: `sudo apt install docker.io` (Ubuntu/Debian)

#### Paso 2: Iniciar con Docker Compose
```bash
cd /home/juam/Descargas/PROYECTOS/CHATBOT/atlas-whatsapp-bot
docker-compose up -d
```

#### Paso 3: Acceder
- Backend: http://localhost:3001
- Frontend: http://localhost:5173
- Base datos PostgreSQL: localhost:5433

---

## 🔗 CONECTAR META WHATSAPP

### Prerequisitos
- ✅ Ya tenemos: Access Token, Phone Number ID, Verify Token, App Secret
- ❌ Necesitas: Cuenta Meta Developer (gratis)

### Paso a Paso

#### 1. Ir a Meta Developer
```
https://developers.facebook.com/
```

#### 2. Seleccionar tu App WhatsApp Business
- Dashboard → Tu App → WhatsApp → Configuración

#### 3. Registrar Webhook (MUY IMPORTANTE)
Busca: **"Webhook URL"** en la sección de configuración

**Ingresa:**
```
{TU_URL_HEROKU}/api/webhooks/whatsapp
```

Ejemplo:
```
https://atlas-whatsapp-bot-api.herokuapp.com/api/webhooks/whatsapp
```

**Verify Token:**
```
atlas-verify-token
```

#### 4. Suscribirse a Eventos
En "Webhook fields", marca:
- ✅ messages
- ✅ message_status
- ✅ message_template_status_update

#### 5. Probar Webhook
Meta enviará un GET a tu webhook para verificarlo. Si ves ✅ verde, ¡listo!

---

## 🧪 PROBAR EL CHATBOT

### Desde WhatsApp
1. Guarda el número de negocio en tu contactos
2. Envía: "Hola"
3. Respuesta esperada: El bot debe responder

### Desde Heroku (Sin instalar WhatsApp)
```bash
# Probar endpoint de salud
curl https://atlas-whatsapp-bot-api.herokuapp.com/api/health

# Debería responder:
# {"status":"ok"}
```

---

## 📱 PANEL ADMINISTRATIVO

Una vez desplegado, accede a:
```
https://atlas-whatsapp-bot-api.herokuapp.com/
```

**Login:**
- Email: `admin@atlas.com`
- Contraseña: `admin123`

**Qué puedes hacer:**
- 📊 Ver estadísticas en tiempo real
- 👥 Gestionar clientes
- 💬 Ver conversaciones
- 📦 Gestionar productos/categorías
- 🛒 Ver carritos y pedidos

---

## 🔐 CREDENCIALES ACTUALES

**Meta WhatsApp:**
- Access Token: `EAAX9C6hGVd4...` ✅
- Phone Number ID: `1240602945813907` ✅
- Verify Token: `atlas-verify-token` ✅
- App Secret: `32dc8f5736a1cf7e7f89e031f5aa8c34` ✅

**Base de Datos:**
- Host: `localhost:5433`
- User: `atlas`
- Pass: `atlas_secret`
- DB: `atlas_db`

**JWT Secret:**
- `change-this-secret-in-production-min-32-chars`

---

## 🆘 SOLUCIONAR PROBLEMAS

### "Webhook no se valida"
✅ **Solución:**
1. Verifica que la URL sea accesible: `curl {tu-url}/api/webhooks/whatsapp`
2. Verifica el Verify Token es exacto
3. Espera 2 minutos y reintenta en Meta

### "Bot no responde"
✅ **Soluciones:**
1. Verifica en Meta → Logs → Webhook logs (¿hay errores?)
2. Revisa que el token de acceso sea válido
3. Reinicia el servicio

### "PostgreSQL connection error"
✅ **Soluciones:**
1. Si usas Heroku: PostgreSQL debe estar adjunto (automático con 1-click)
2. Si usas Docker: Asegúrate que el contenedor PostgreSQL esté corriendo: `docker ps`

---

## 📞 APIS PRINCIPALES

### Chat
```
POST /api/messages/process
{
  "phoneNumber": "+34666777888",
  "message": "Hola"
}
```

### Productos
```
GET /api/products
GET /api/categories
```

### Dashboard
```
GET /api/dashboard
```

### Webhooks
```
GET /api/webhooks/whatsapp  (Meta verification)
POST /api/webhooks/whatsapp (Incoming messages)
```

---

## ✨ RESUMEN RÁPIDO

```
1. Desplegar: Opción 1 (Heroku) → 5 minutos
2. Conectar Meta: Registrar webhook → 2 minutos
3. Probar: Enviar mensaje WhatsApp → ¡Listo!
4. Panel Admin: Login y explorar
```

**¿Preguntas?** Revisa los logs:
- Heroku: `heroku logs --tail`
- Railway: Dashboard → Logs
- Docker: `docker-compose logs -f`

---

## 🎯 PRÓXIMOS PASOS

### Ya Completado ✅
- [x] Backend compilado y funcional
- [x] Frontend compilado
- [x] Base de datos con datos de ejemplo
- [x] Credenciales Meta configuradas
- [x] Documentación lista

### Ahora Tú ⬇️
- [ ] Elige despliegue (Heroku recomendado)
- [ ] Crea cuenta Meta Developer (gratis)
- [ ] Registra webhook
- [ ] ¡Prueba tu chatbot!

---

**Tu sistema WhatsApp Chatbot está 100% listo para funcionar.** 🚀
