# 📱 Guía Completa: Obtener Credenciales de Meta WhatsApp

**Tiempo estimado**: 15-20 minutos

---

## 🎯 Lo que necesitarás al final

```
WHATSAPP_ACCESS_TOKEN = "EAAxxxxxxxxxxxxxx..."
WHATSAPP_PHONE_NUMBER_ID = "120xxxxxxxxxx"
WHATSAPP_APP_SECRET = "xxxxxxxxxxxxxxxxxxxxxx"
WHATSAPP_VERIFY_TOKEN = "atlas-verify-token-abc"
```

---

## ✅ Paso 1: Crear Meta Business Account (si no tienes)

1. **Ir a** https://business.facebook.com

2. **Click "Create Account"**

3. **Llenar datos**:
   - Nombre de empresa: "Mi Empresa" (o nombre real)
   - Tu nombre: Tu nombre completo
   - Email: Tu email empresarial
   - País: Tu país
   - Teléfono: Tu teléfono

4. **Click "Create Business Account"**

5. **Confirmar email**: Revisar tu email y confirmar

---

## ✅ Paso 2: Crear WhatsApp Business App

1. **En Business Manager** → Click en el menú superior izquierdo

2. **Buscar "Apps and Businesses"** → Seleccionar

3. **Click en "Apps"** en la parte izquierda

4. **Click "Create App"**

5. **Seleccionar tipo**:
   - Tipo: "Business"
   - Click "Next"

6. **Llenar información**:
   - App name: "Atlas Chatbot Bot"
   - Contact email: Tu email
   - Purpose: "Customer Communications"
   - Click "Create App"

7. **Esperar a que se cree** (2-3 segundos)

---

## ✅ Paso 3: Agregar WhatsApp Product

1. **En tu app**, buscar "WhatsApp" en la barra de búsqueda

2. **Click en "WhatsApp"** → "Add to App"

3. **Click "Continue"**

4. **Seleccionar rol**: 
   - "Business Account Manager"
   - Click "Continue"

---

## ✅ Paso 4: Obtener WHATSAPP_PHONE_NUMBER_ID

1. **En la app**, ir a **"Dashboard"** o **"API Setup"**

2. **Buscar sección "Phone Numbers"**

3. **Click "Get Started" o "Create Test Number"**
   - Si tienes número de negocio: conectarlo
   - Si es prueba: crear número de test

4. **Copiar el ID del número** (formato: 12xxxxxxxxx):
   ```
   WHATSAPP_PHONE_NUMBER_ID = "120123456789"
   ```

> 💡 **Nota**: En test mode es un número generado por Meta. En producción es tu número real.

---

## ✅ Paso 5: Obtener WHATSAPP_ACCESS_TOKEN

### Opción A: Access Token Temporal (para testing)

1. **En Dashboard**, ir a **"System Users"**

2. **Click "Create System User"**:
   - Name: "Atlas Bot API"
   - Role: "Admin"
   - Click "Create"

3. **En el usuario creado**, click **"Generate Token"**

4. **Seleccionar**:
   - App: Tu app "Atlas Chatbot Bot"
   - Token expires: "Never" (o tu preferencia)
   - Permissions: Seleccionar:
     - ✓ `whatsapp_business_messaging`
     - ✓ `whatsapp_business_phone_number_management`

5. **Click "Generate Token"**

6. **Copiar el token** (largo, empieza con "EAA..."):
   ```
   WHATSAPP_ACCESS_TOKEN = "EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
   ```

> ⚠️ **Importante**: Copia el token completo antes de cerrar, no se mostrará de nuevo

---

## ✅ Paso 6: Obtener WHATSAPP_APP_SECRET

1. **En tu app**, ir a **"Settings"** (esquina superior izquierda)

2. **Click "Basic"**

3. **Buscar "App Secret"**

4. **Click el ojo (👁️) para mostrar**

5. **Copiar valor**:
   ```
   WHATSAPP_APP_SECRET = "abc123xyz..."
   ```

---

## ✅ Paso 7: Crear WHATSAPP_VERIFY_TOKEN (tú lo creas)

**Este valor LO CREAS TÚ**. Puede ser cualquier string:

```
WHATSAPP_VERIFY_TOKEN = "atlas-verify-token-abc123"
```

O más seguro, usar un valor random:

```bash
# En terminal
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
# Salida: 4f8a778432797258fdcdbdd45dfe6920
WHATSAPP_VERIFY_TOKEN = "4f8a778432797258fdcdbdd45dfe6920"
```

---

## ✅ Paso 8: Configurar Webhook en Meta

1. **En tu app**, ir a **"Webhooks"** o **"Configuration"**

2. **Click "Edit Subscription"** (o "Add Webhook")

3. **Llenar campos**:
   - **Callback URL**: `https://tu-backend-url.railway.app/api/webhooks/whatsapp`
     - Reemplazar con tu URL real de Railway/Heroku
   - **Verify Token**: El valor que creaste en Paso 7
     - Ejemplo: `atlas-verify-token-abc123`

4. **Subscribe to Events**:
   - ✓ `messages`
   - ✓ `message_template_status_update`
   - ✓ `message_status` (recomendado)

5. **Click "Save"**

> 💡 La URL debe ser HTTPS y accesible desde internet

---

## ✅ Paso 9: Habilitar Permisos en Meta

1. **En tu app**, ir a **"Settings"** → **"Basic"**

2. **Buscar "App Roles"**

3. **Click tu rol** (Admin)

4. **Asegurarse que tienes permisos**:
   - ✓ `whatsapp_business_messaging`
   - ✓ `whatsapp_business_phone_number_management`
   - ✓ `business_management`

---

## ✅ Paso 10: Agregar Usuarios de Testing (opcional)

1. **En tu app**, ir a **"Roles"** → **"Test Users"**

2. **Click "Add Test User"**

3. **Llenar**:
   - Name: Tu nombre
   - Email: Tu email
   - Roles: "Admin"

4. **Click "Add Test User"**

5. **Revisar email y aceptar invitación**

---

## 🔄 Resumen: Valores Finales

Una vez completados todos los pasos, deberías tener:

```env
WHATSAPP_ACCESS_TOKEN="EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
WHATSAPP_PHONE_NUMBER_ID="120123456789"
WHATSAPP_APP_SECRET="abc123xyz..."
WHATSAPP_VERIFY_TOKEN="4f8a778432797258fdcdbdd45dfe6920"
```

---

## 🚀 Próximo Paso: Agregar a Railway

1. **Ir a tu proyecto en Railway**

2. **Variables** → **New Variable**

3. **Agregar cada variable**:
   ```
   WHATSAPP_ACCESS_TOKEN = EAAxxxxx...
   WHATSAPP_PHONE_NUMBER_ID = 120xxxxx
   WHATSAPP_APP_SECRET = abc123xxx...
   WHATSAPP_VERIFY_TOKEN = 4f8a77...
   ```

4. **Guardar**

5. **Railway redeploya automáticamente** ✅

---

## 🧪 Probar que funciona

```bash
# Test webhook (debe responder 200)
curl "https://tu-backend-railway.app/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=4f8a77...&hub.challenge=test123"

# Respuesta esperada: test123 (el challenge que mandaste)
```

---

## ⚠️ Troubleshooting

### "Invalid Verify Token"
→ Verifica que el WHATSAPP_VERIFY_TOKEN coincida en Meta y en código

### "Webhook connection failed"
→ Verifica que la URL es pública y HTTPS
→ Verifica que backend está corriendo

### "Invalid Access Token"
→ Regenera el token en Meta
→ Verifica que no expiró
→ Verifica que tiene los permisos correctos

### Test number no recibe mensajes
→ Agregar el teléfono como test user en Meta
→ Esperar 5 minutos
→ Intentar de nuevo

---

## 📚 Referencias Útiles

- [Meta WhatsApp Cloud API Docs](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [WhatsApp Business Account Setup](https://www.whatsapp.com/business/getting-started)
- [API Authentication](https://developers.facebook.com/docs/facebook-login/access-tokens)

---

## ✅ Checklist Final

- [ ] Meta Business Account creada
- [ ] WhatsApp app creada
- [ ] WHATSAPP_PHONE_NUMBER_ID obtenido
- [ ] WHATSAPP_ACCESS_TOKEN generado
- [ ] WHATSAPP_APP_SECRET copiado
- [ ] WHATSAPP_VERIFY_TOKEN creado
- [ ] Webhook configurado en Meta
- [ ] Permisos habilitados
- [ ] Valores agregados a Railway
- [ ] Webhook testeado

**¡Listo! 🎉**
