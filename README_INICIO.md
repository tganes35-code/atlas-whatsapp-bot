# 🎯 Atlas WhatsApp Chatbot - INICIO RÁPIDO

**¡Tu chatbot está 100% funcional!** Elige cómo quieres desplegarlo:

## ⚡ 3 OPCIONES (La más fácil primero)

### 🥇 HEROKU (5 minutos) ⭐ RECOMENDADO
```
1. Crear cuenta gratis: https://www.heroku.com/
2. Copiar link y abrir en navegador:
   https://heroku.com/deploy?template=https://github.com/juamcondor/atlas-whatsapp-bot
3. Completar datos y hacer deploy
4. Obtener URL pública (ej: https://atlas-whatsapp-bot-api.herokuapp.com)
5. Registrar webhook en Meta Developer Portal
```

### 🥈 RAILWAY (3 minutos)
```
1. Ir a: https://railway.app/
2. Login con GitHub
3. New Project → Deploy from GitHub → atlas-whatsapp-bot
4. Esperar despliegue automático
```

### 🥉 DOCKER LOCAL (10 minutos)
```bash
chmod +x START_LOCAL.sh
./START_LOCAL.sh
```

---

## 📚 DOCUMENTACIÓN COMPLETA
Ver: **`CHATBOT_SETUP_COMPLETO.md`**

Contiene:
- ✅ Instrucciones paso a paso para los 3 despliegues
- ✅ Cómo conectar Meta WhatsApp
- ✅ Credenciales configuradas
- ✅ Panel administrativo
- ✅ APIs principales
- ✅ Solución de problemas

---

## 🚀 RESUMEN TÉCNICO

**Stack:**
- Backend: NestJS + TypeScript
- Frontend: Vue 3 + TypeScript
- Database: PostgreSQL + Prisma ORM
- IA: MockAI (por defecto) + OpenAI (opcional)
- Webhooks: Meta WhatsApp Business API

**Estado:**
- ✅ Backend compilado (`dist/` listo)
- ✅ Frontend compilado
- ✅ Base de datos con schema y datos de ejemplo
- ✅ Credenciales Meta configuradas
- ✅ Procfile y railway.toml configurados para despliegue

**Endpoints principales:**
- `POST /api/messages/process` - Procesar mensajes
- `GET /api/dashboard` - Estadísticas
- `GET /api/products` - Productos
- `GET /api/webhooks/whatsapp` - Verificación Meta

---

## 📞 CREDENCIALES ACTIVAS

**Admin Panel:**
- Email: `admin@atlas.com`
- Password: `admin123`

**WhatsApp:**
- Teléfono: `1240602945813907`
- Verify Token: `atlas-verify-token`

---

## ⚙️ PRÓXIMOS PASOS

1. **Elige despliegue:** Heroku (más fácil) o Railway o Docker
2. **Conecta Meta:** Registra webhook en Developer Portal
3. **Prueba:** Envía mensaje WhatsApp → ¡Respuesta automática!
4. **Personalizaciona:** Modifica productos, categorías, respuestas

---

## 🆘 ¿PROBLEMAS?

1. **Webhook no funciona?**
   - Verifica URL sea accesible
   - Revisa Verify Token sea correcto
   - Mira logs en Meta Developer Portal

2. **Bot no responde?**
   - Revisa acceso a OpenAI API (si lo usas)
   - Verifica logs del servidor
   - Reinicia el servicio

3. **Base de datos?**
   - Heroku: Se configura automáticamente
   - Docker: Corre en localhost:5433
   - Railway: Se configura automáticamente

---

## 📖 MÁS INFORMACIÓN

Ver: `CHATBOT_SETUP_COMPLETO.md` para guía completa con:
- Instrucciones detalladas para cada despliegue
- Configuración de webhook Meta paso a paso
- Troubleshooting
- APIs disponibles
- Cómo modificar el sistema

---

**¿Listo?** Abre `CHATBOT_SETUP_COMPLETO.md` y sigue los pasos. 🚀
