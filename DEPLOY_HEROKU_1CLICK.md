# 🚀 DESPLEGAR EN HEROKU CON 1 CLICK

**La forma MÁS SIMPLE. Sin configuraciones. Sin GitHub. Nada complicado.**

---

## 🎯 PASO 1: HAGA CLICK EN ESTE BOTÓN

Usa este link que ya tiene TODO pre-configurado:

```
https://heroku.com/deploy?template=https://github.com/juamcondor/atlas-whatsapp-bot
```

Si ese link no funciona, usa este alternativo directo:

```
https://www.heroku.com/deploy
```

---

## 🎯 PASO 2: RELLENAR FORMULARIO (30 SEGUNDOS)

En Heroku, verás un formulario simple:

### Campo 1: App Name
```
atlas-whatsapp-bot-api
```
(O cualquier nombre que quieras)

### Campo 2: Region
```
Europe (si eres de Europa)
United States (si eres de USA)
```

### Campo 3: Config Vars (Variables de entorno)

Ya están pre-llenadas, pero VERIFICA que digan:

```
DATABASE_URL = postgresql://...
JWT_SECRET = your-secret-key-...
OPENAI_API_KEY = sk-proj-...
WHATSAPP_ACCESS_TOKEN = EAAX9C6h...
WHATSAPP_APP_SECRET = 32dc8f5...
LOCAL_MODE = false
PORT = (dejar por defecto)
```

---

## 🎯 PASO 3: CLICK EN "DEPLOY APP"

Verás un botón morado abajo que dice: **"Deploy App"**

CLICK.

Eso es todo.

---

## ⏳ ESPERAR

Heroku compilará (toma ~3-5 minutos).

Verás pantalla con logs en vivo.

Cuando termina, aparecerá:

```
"Your app was successfully deployed"
```

---

## ✅ CUANDO TERMINE

Verás tu URL pública:

```
https://atlas-whatsapp-bot-api.herokuapp.com
```

**Copia esa URL.** La necesitarás para Meta.

---

## 🎯 SIGUIENTE: REGISTRAR EN META

1. Ve a: https://developers.facebook.com/apps/
2. Tu App → WhatsApp → Configuration
3. Webhook Configuration:
   - **Callback URL**: `https://atlas-whatsapp-bot-api.herokuapp.com/api/webhooks/whatsapp`
   - **Verify Token**: `atlas-verify-token`
4. Click "Verify and Save"

---

## 🧪 PROBAR

Envía WhatsApp a tu número de negocio.

Bot responde en 5 segundos. ✅

---

## 📝 RESUMEN

```
1. Click link arriba ↑
2. Rellenar formulario (30 seg)
3. Click "Deploy App"
4. Esperar (5 min)
5. Copiar URL pública
6. Registrar en Meta
7. ¡LISTO!
```

---

**¿Listo?** Click en el link arriba y comienza. 🚀
