# ⚡ Quick Start - Atlas WhatsApp Bot (20 minutos)

**Para**: Empresas/Negocios que quieren su chatbot YA  
**Tiempo**: 20 minutos totales  
**Costo**: GRATIS (solo te cuesta el servidor: $5-20/mes)

---

## 📱 Paso 1: Obtener Credenciales de Meta (15 min)

👉 **Abre este archivo y sigue EXACTAMENTE:**
```
docs/META_SETUP.md
```

Al final tendrás 4 valores (los COPIAS):
```
WHATSAPP_ACCESS_TOKEN = "EAA..."
WHATSAPP_PHONE_NUMBER_ID = "120..."
WHATSAPP_APP_SECRET = "..."
WHATSAPP_VERIFY_TOKEN = "4f8a..."
```

---

## 🚀 Paso 2: Desplegar a Railway (5 min)

1. **Ir a**: https://railway.app
2. **Login con GitHub**
3. **Click "New Project"**
4. **Seleccionar tu repo** (atlas-whatsapp-bot)
5. **Agregar variables de entorno**:
   - Pega los 4 valores del Paso 1
   - Agregar: `JWT_SECRET=2c06ea44798166564bed642b45a77be91ddfbc47748e213acc36ed8f2cc2ad79`
   - Agregar: `NODE_ENV=production`
6. **Click "Deploy"**

✅ Railway despliega automáticamente

---

## 🔗 Paso 3: Configurar Webhook (2 min)

En **Meta Business Manager** → Tu app → **Webhooks**:

1. Callback URL: `https://tu-backend-railway.app/api/webhooks/whatsapp`
2. Verify Token: `4f8a778432797258fdcdbdd45dfe6920`
3. Subscribe to: `messages`
4. Save

---

## ✅ Paso 4: Listo

Envía un mensaje por WhatsApp a tu número bot:

```
Escribes: "Hola"
Bot responde: "¡Hola! 👋 ..."
```

🎉 **¡Tu chatbot funciona!**

---

## 📊 Próximos pasos (opcional)

- Agregar productos en admin panel
- Customizar mensajes del bot
- Integrar OpenAI para respuestas mejores
- Dominio personalizado

---

## 📚 Documentación Completa

Para más detalles ver:
- **README.md** - Overview completo
- **docs/META_SETUP.md** - Paso-a-paso credenciales
- **docs/DEPLOYMENT_GUIDE.md** - Todas las opciones (Railway/Heroku/Docker)
- **PRODUCTION_READY.md** - Checklist y features

---

## 💬 ¿Preguntas?

- Webhook no funciona? → Ver docs/DEPLOYMENT_GUIDE.md "Troubleshooting"
- ¿Cómo agregar más productos? → Admin panel en el frontend
- ¿Cómo cambiar admin password? → Login y cambiar en perfil

---

**¡Eso es todo! Tu chatbot está en producción.** ✨
