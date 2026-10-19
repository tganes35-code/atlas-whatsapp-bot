# 🚀 Guía de Deployment - Atlas WhatsApp Bot

**Tiempo total**: 10 minutos  
**Dificultad**: ⭐ Muy Fácil  
**Requisitos**: GitHub + Railway

---

## 🎯 Opción Recomendada: Railway (Lo Más Fácil)

### Paso 1: Preparar repositorio

```bash
# Asegurar que todo está en git
git status

# Si hay cambios, hacer commit
git add -A
git commit -m "production: prepare for deployment"
git push origin main
```

### Paso 2: Registrarse en Railway

1. **Ir a** https://railway.app
2. **Click "Login with GitHub"**
3. **Autorizar Railway en GitHub**

### Paso 3: Crear nuevo proyecto

1. **En Railway dashboard**
2. **Click "New Project"**
3. **Seleccionar "Deploy from GitHub repo"**
4. **Seleccionar tu repositorio** (atlas-whatsapp-bot)
5. **Railway auto-detecta Node.js** ✓

### Paso 4: Configurar variables de entorno

1. **En Railway**, ir a **"Variables"**

2. **Agregar estas variables** (copiar de Meta setup):

```env
# Database (Railway genera automáticamente)
DATABASE_URL=postgresql://...  # Railway lo genera

# JWT
JWT_SECRET=2c06ea44798166564bed642b45a77be91ddfbc47748e213acc36ed8f2cc2ad79

# WhatsApp Meta (obtener de docs/META_SETUP.md)
WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxxxxxxxxx
WHATSAPP_PHONE_NUMBER_ID=120xxxxxxxxxx
WHATSAPP_APP_SECRET=xxxxxxxxxxxxxxxxxxxxxx
WHATSAPP_VERIFY_TOKEN=4f8a778432797258fdcdbdd45dfe6920

# Configuración
NODE_ENV=production
PORT=3000
OPENAI_API_KEY=  # Opcional - dejar en blanco para usar MockAI
CORS_ORIGIN=https://admin.tudominio.com  # O dejar en blanco por ahora

# Local mode - cambiar a false cuando tengas Meta credentials
LOCAL_MODE=true
```

3. **Click "Save"**

### Paso 5: Railway deploya automáticamente

✓ Railway detecta cambios en GitHub  
✓ Instala dependencias  
✓ Compila backend  
✓ Crea base de datos PostgreSQL  
✓ Ejecuta migraciones  
✓ Inicia servidor  

**Tiempo**: 3-5 minutos

### Paso 6: Obtener URL pública

1. **En Railway**, ir a **"Settings"** → **"Domains"**
2. **Copiar el dominio**: `https://atlas-bot-prod.railway.app`
3. **Guardar esta URL para Meta webhook**

### Paso 7: Inicializar base de datos

```bash
# En la terminal de Railway (o local si tienes DB conectada)
npm run init:prod

# Esto crea:
# ✓ Admin user: admin@atlas.local
# ✓ Categorías de ejemplo
# ✓ Productos de ejemplo
```

### Paso 8: Desplegar frontend

**Opción A: Vercel (más fácil)**

1. **Ir a** https://vercel.com
2. **Click "New Project"**
3. **Seleccionar repositorio**
4. **Vercel auto-detecta Vue.js**
5. **En "Environment Variables"** agregar:
   ```
   VITE_API_URL=https://atlas-bot-prod.railway.app
   ```
6. **Click "Deploy"**

**Opción B: Netlify**

1. **Ir a** https://netlify.com
2. **Click "Add new site" → "Import an existing project"**
3. **Conectar GitHub**
4. **Build settings**:
   - Build command: `npm run build`
   - Publish directory: `frontend/dist`
5. **Environment variables**:
   ```
   VITE_API_URL=https://atlas-bot-prod.railway.app
   ```
6. **Click "Deploy"**

---

## 🔧 Alternativa: Heroku (Classic)

### Prerequisitos
```bash
npm install -g heroku
heroku login
```

### Deploy

```bash
# 1. Crear app
heroku create atlas-whatsapp-bot

# 2. Agregar PostgreSQL
heroku addons:create heroku-postgresql:standard-0

# 3. Configurar variables (una por una)
heroku config:set JWT_SECRET="2c06ea44798166564bed642b45a77be91ddfbc47748e213acc36ed8f2cc2ad79"
heroku config:set WHATSAPP_ACCESS_TOKEN="EAA..."
heroku config:set WHATSAPP_PHONE_NUMBER_ID="120..."
heroku config:set WHATSAPP_APP_SECRET="..."
heroku config:set WHATSAPP_VERIFY_TOKEN="4f8a..."
heroku config:set NODE_ENV="production"
heroku config:set CORS_ORIGIN="*"
heroku config:set LOCAL_MODE="false"

# 4. Ver todas las variables
heroku config

# 5. Desplegar
git push heroku main

# 6. Ver logs
heroku logs --tail

# 7. Ejecutar init
heroku run npm run init:prod

# 8. Obtener URL
heroku open
# La URL será: https://atlas-whatsapp-bot.herokuapp.com
```

---

## 🐳 Opción: Docker Local o VPS

### Build

```bash
cd backend
docker build -t atlas-bot .
```

### Run

```bash
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:pass@db:5432/atlas_db" \
  -e JWT_SECRET="your-secret" \
  -e WHATSAPP_ACCESS_TOKEN="your-token" \
  -e WHATSAPP_PHONE_NUMBER_ID="your-id" \
  -e WHATSAPP_APP_SECRET="your-secret" \
  -e WHATSAPP_VERIFY_TOKEN="your-token" \
  atlas-bot
```

### Docker Compose (recomendado)

```bash
# Actualizar .env con tus valores
nano backend/.env.production

# Iniciar stack completo
docker-compose -f docker-compose.prod.yml up -d

# Ver logs
docker-compose logs -f backend

# Ejecutar init
docker-compose exec backend npm run init:prod
```

---

## ✅ Después de desplegar

### 1. Verificar que backend está corriendo

```bash
curl https://tu-backend-url.railway.app/api/docs

# Deberías ver la documentación Swagger
```

### 2. Configurar webhook en Meta

1. **Ir a Meta Business Manager**
2. **Tu app** → **Webhooks**
3. **Callback URL**: `https://tu-backend-url.railway.app/api/webhooks/whatsapp`
4. **Verify Token**: `4f8a778432797258fdcdbdd45dfe6920`
5. **Subscribe to**: `messages`, `message_template_status_update`
6. **Save**

### 3. Probar webhook

```bash
curl "https://tu-backend-url.railway.app/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=4f8a778432797258fdcdbdd45dfe6920&hub.challenge=test123"

# Respuesta esperada: test123
```

### 4. Acceder a admin panel

```
URL: https://admin-tudominio.vercel.app (o tu Vercel URL)
Email: admin@atlas.local
Password: [la que generó init:prod]
```

### 5. Agregar productos

1. **Login en admin**
2. **Click "Productos"**
3. **Click "Nuevo"**
4. **Llenar**:
   - Nombre: "Camiseta XL"
   - Categoría: Camisetas
   - Precio: 29.99
   - Stock: 50
5. **Guardar**

### 6. Probar en WhatsApp real

1. **Agregar el número de tu bot a tu contacto**
2. **Enviar mensaje**: "Hola"
3. **Bot responde** automáticamente ✅
4. **Escribir**: "Ver camisetas"
5. **Bot lista los productos** ✅

---

## 🔒 Seguridad Post-Deploy

### Cambiar admin password (IMPORTANTE)

1. **Login en admin panel**
2. **Click perfil → Cambiar contraseña**
3. **Nueva contraseña**: Algo seguro y único

### Configurar dominio propio

**Para backend (Railway)**:
1. **En Railway** → **Settings** → **Domains**
2. **Add domain**: `api.tuempresa.com`
3. **Actualizar DNS**: CNAME → Railway domain
4. **Esperar 5 minutos**

**Para frontend (Vercel)**:
1. **En Vercel** → **Settings** → **Domains**
2. **Add domain**: `admin.tuempresa.com`
3. **Actualizar DNS**: CNAME → Vercel domain

### Habilitar HTTPS (automático)

✓ Railway: SSL automático  
✓ Vercel: SSL automático  
✓ Heroku: SSL automático  

### Actualizar CORS

En Railway, cambiar `CORS_ORIGIN` a:
```
https://admin.tuempresa.com
```

---

## 📊 Monitoreo

### Ver logs (Railway)

```bash
# En dashboard de Railway → click proyecto → Logs
# O via CLI:
railway logs --follow
```

### Ver logs (Heroku)

```bash
heroku logs --tail
```

### Alertas

**Railway**: Ir a **Settings** → **Alerts** → Configurar email

**Heroku**: Ir a **Settings** → **Error tracking**

---

## 🆘 Troubleshooting

### "Database connection error"
- Verificar DATABASE_URL en variables
- Esperar a que Railway cree la DB (3-5 min)
- Verificar que migrations corrieron

### "Webhook verification failed"
- Verificar WHATSAPP_VERIFY_TOKEN es correcto
- Reintentar en Meta
- Verificar URL es HTTPS y accesible

### "Admin login error"
```bash
# Reinicializar DB
npm run init:prod

# O si está en Railway
railway run npm run init:prod
```

### "Frontend can't reach backend"
- Verificar VITE_API_URL en frontend
- Verificar CORS_ORIGIN en backend
- Verificar backend está corriendo: `curl https://tu-backend/api/docs`

---

## 📈 Próximos pasos

1. ✅ Deploy completado
2. ✅ Meta webhook configurado
3. ✅ Admin panel accesible
4. ✅ Productos agregados
5. ➡️ **Próximo**: Customizar mensajes del bot
6. ➡️ **Próximo**: Integrar OpenAI
7. ➡️ **Próximo**: Crear plantillas Meta

---

## 📞 Referencias

- [Railway Docs](https://docs.railway.app)
- [Heroku Docs](https://devcenter.heroku.com)
- [Vercel Docs](https://vercel.com/docs)
- [Docker Docs](https://docs.docker.com)

---

**¡Listo! 🎉 Tu chatbot está en producción**
