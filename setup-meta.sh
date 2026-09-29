#!/bin/bash

# Atlas WhatsApp - Configuración Automática de Meta

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$PROJECT_DIR/backend/.env"

echo "╔════════════════════════════════════════════════════════╗"
echo "║         CONFIGURAR META WHATSAPP - SETUP ASISTIDO       ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Verificar que .env existe
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ No se encontró: $ENV_FILE"
    exit 1
fi

echo "📋 CREDENCIALES ACTUALES:"
echo ""
grep "WHATSAPP_" "$ENV_FILE" | grep -v "^#" | head -5
echo ""

echo "════════════════════════════════════════════════════════"
echo ""
echo "Vamos a actualizar tus credenciales de Meta."
echo ""

# 1. Access Token
echo "1️⃣ ACCESS TOKEN"
echo "   Obtén en: https://developers.facebook.com/apps/"
echo "   → Tu App → WhatsApp → Getting Started"
echo "   → Copia el Access Token"
echo ""
read -sp "   Ingresa tu WHATSAPP_ACCESS_TOKEN: " ACCESS_TOKEN
echo ""
echo ""

if [ -z "$ACCESS_TOKEN" ]; then
    echo "❌ Access Token vacío. Abortando."
    exit 1
fi

# 2. Phone Number ID
echo "2️⃣ PHONE NUMBER ID"
echo "   Obtén en: https://developers.facebook.com/apps/"
echo "   → Tu App → WhatsApp → Phone Numbers"
echo "   → Copia el Phone Number ID"
echo ""
read -p "   Ingresa tu WHATSAPP_PHONE_NUMBER_ID: " PHONE_ID
echo ""

if [ -z "$PHONE_ID" ]; then
    echo "❌ Phone Number ID vacío. Abortando."
    exit 1
fi

# 3. App Secret
echo "3️⃣ APP SECRET"
echo "   Obtén en: https://developers.facebook.com/apps/"
echo "   → Tu App → Settings → Basic"
echo "   → Copia el App Secret"
echo ""
read -sp "   Ingresa tu WHATSAPP_APP_SECRET: " APP_SECRET
echo ""
echo ""

if [ -z "$APP_SECRET" ]; then
    echo "❌ App Secret vacío. Abortando."
    exit 1
fi

# 4. Confirm URL
echo "4️⃣ URL DEL SERVIDOR"
echo "   (Donde desplegarás el backend)"
echo ""
echo "   Opciones:"
echo "   a) Render.com        (Recomendado - gratis)"
echo "   b) Railway.app       (Alternativa)"
echo "   c) Tu servidor propio"
echo ""
read -p "   URL pública (ej: https://atlas-api.onrender.com): " SERVER_URL
echo ""

if [ -z "$SERVER_URL" ]; then
    echo "⚠️ URL vacía. Usaremos localhost (local testing)"
    SERVER_URL="http://localhost:3001"
fi

# Actualizar .env
echo "💾 Actualizando .env..."
echo ""

# Función para actualizar o agregar variable
update_env() {
    local key=$1
    local value=$2
    
    if grep -q "^$key=" "$ENV_FILE"; then
        # Existe, actualizar
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|^$key=.*|$key=\"$value\"|" "$ENV_FILE"
        else
            sed -i "s|^$key=.*|$key=\"$value\"|" "$ENV_FILE"
        fi
    else
        # No existe, agregar
        echo "$key=\"$value\"" >> "$ENV_FILE"
    fi
}

# Actualizar variables
update_env "WHATSAPP_ACCESS_TOKEN" "$ACCESS_TOKEN"
update_env "WHATSAPP_PHONE_NUMBER_ID" "$PHONE_ID"
update_env "WHATSAPP_APP_SECRET" "$APP_SECRET"
update_env "LOCAL_MODE" "false"

echo "✅ .env actualizado"
echo ""

# 5. Información del webhook
echo "════════════════════════════════════════════════════════"
echo ""
echo "5️⃣ CONFIGURAR WEBHOOK EN META"
echo ""
echo "   Ve a: https://developers.facebook.com/apps/"
echo "   → Tu App → WhatsApp → Configuration"
echo ""
echo "   Webhook Callback URL:"
echo "   ▶ $SERVER_URL/api/webhooks/whatsapp"
echo ""
echo "   Verify Token:"
echo "   ▶ atlas-verify-token"
echo ""
echo "   Campos de Webhook:"
echo "   ✓ messages"
echo "   ✓ message_status"
echo ""

# 6. Compilar backend
echo "════════════════════════════════════════════════════════"
echo ""
echo "🔨 Compilando backend..."
cd "$PROJECT_DIR/backend"
npm run build > /dev/null 2>&1

echo "✅ Backend compilado"
echo ""

# 7. Resumen
echo "════════════════════════════════════════════════════════"
echo ""
echo "✅ CONFIGURACIÓN COMPLETADA"
echo ""
echo "📋 RESUMEN:"
echo "   • Access Token: [CONFIGURADO]"
echo "   • Phone Number ID: $PHONE_ID"
echo "   • App Secret: [CONFIGURADO]"
echo "   • Servidor: $SERVER_URL"
echo "   • Local Mode: false"
echo ""

echo "🚀 PRÓXIMOS PASOS:"
echo ""
echo "   1. Despliega el backend:"
echo "      cd $PROJECT_DIR"
echo "      ./deploy.sh"
echo ""
echo "   2. Configura webhook en Meta (ver arriba)"
echo ""
echo "   3. Prueba:"
echo "      • Abre WhatsApp en tu móvil"
echo "      • Envía un mensaje a tu número de negocio"
echo "      • El bot debe responder automáticamente"
echo ""
echo "   4. Ver logs:"
echo "      tail -f backend/logs/app.log"
echo ""

echo "════════════════════════════════════════════════════════"
echo ""
echo "📚 Documentación: CONECTAR_META_WHATSAPP.md"
echo "❓ ¿Problemas?: https://developers.facebook.com/docs/whatsapp"
echo ""
