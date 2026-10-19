#!/bin/bash

# ════════════════════════════════════════════════════════════════
# Validación Pre-Producción Atlas WhatsApp Bot
# Ejecutar: bash scripts/validate-production.sh
# ════════════════════════════════════════════════════════════════

echo "🔍 Validando configuración de producción..."
echo ""

ERRORS=0

# ─────────────────────────────────────────────────────────────
# 1. Verificar variables de entorno requeridas
# ─────────────────────────────────────────────────────────────
echo "📋 Verificando variables de entorno..."

required_vars=(
    "DATABASE_URL"
    "JWT_SECRET"
    "WHATSAPP_ACCESS_TOKEN"
    "WHATSAPP_PHONE_NUMBER_ID"
    "WHATSAPP_APP_SECRET"
    "WHATSAPP_VERIFY_TOKEN"
    "ADMIN_PASSWORD"
    "NODE_ENV"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "   ❌ $var no está configurado"
        ((ERRORS++))
    else
        echo "   ✓ $var configurado"
    fi
done

# ─────────────────────────────────────────────────────────────
# 2. Verificar seguridad de JWT_SECRET
# ─────────────────────────────────────────────────────────────
echo ""
echo "🔐 Verificando seguridad..."

if [ ${#JWT_SECRET} -lt 32 ]; then
    echo "   ❌ JWT_SECRET debe tener al menos 32 caracteres (actual: ${#JWT_SECRET})"
    ((ERRORS++))
else
    echo "   ✓ JWT_SECRET tiene longitud segura (${#JWT_SECRET} chars)"
fi

if [ ${#ADMIN_PASSWORD} -lt 16 ]; then
    echo "   ❌ ADMIN_PASSWORD debe tener al menos 16 caracteres"
    ((ERRORS++))
else
    echo "   ✓ ADMIN_PASSWORD tiene longitud suficiente"
fi

# ─────────────────────────────────────────────────────────────
# 3. Verificar formato de tokens Meta
# ─────────────────────────────────────────────────────────────
echo ""
echo "📱 Verificando formato de credenciales Meta..."

if [[ ! $WHATSAPP_ACCESS_TOKEN =~ ^EAA ]]; then
    echo "   ⚠️  WHATSAPP_ACCESS_TOKEN no parece un token válido (debe empezar con EAA)"
    ((ERRORS++))
else
    echo "   ✓ WHATSAPP_ACCESS_TOKEN tiene formato válido"
fi

if [[ ! $WHATSAPP_PHONE_NUMBER_ID =~ ^[0-9]{10,}$ ]]; then
    echo "   ⚠️  WHATSAPP_PHONE_NUMBER_ID debe ser números (actual: $WHATSAPP_PHONE_NUMBER_ID)"
    ((ERRORS++))
else
    echo "   ✓ WHATSAPP_PHONE_NUMBER_ID tiene formato válido"
fi

# ─────────────────────────────────────────────────────────────
# 4. Verificar conexión a base de datos
# ─────────────────────────────────────────────────────────────
echo ""
echo "🗄️  Verificando conexión a base de datos..."

if command -v psql &> /dev/null; then
    # Parsear DATABASE_URL
    DB_URL_REGEX='^postgresql:\/\/([^:]+):([^@]+)@([^:]+):([^/]+)\/(.+)$'
    if [[ $DATABASE_URL =~ $DB_URL_REGEX ]]; then
        DB_USER="${BASH_REMATCH[1]}"
        DB_PASS="${BASH_REMATCH[2]}"
        DB_HOST="${BASH_REMATCH[3]}"
        DB_PORT="${BASH_REMATCH[4]}"
        DB_NAME="${BASH_REMATCH[5]}"
        
        if PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1" &> /dev/null; then
            echo "   ✓ Conexión a base de datos exitosa"
        else
            echo "   ❌ No se puede conectar a la base de datos"
            ((ERRORS++))
        fi
    else
        echo "   ⚠️  DATABASE_URL no tiene formato PostgreSQL válido"
    fi
else
    echo "   ⚠️  psql no instalado, saltando test de conexión DB"
fi

# ─────────────────────────────────────────────────────────────
# 5. Verificar que el código está compilado
# ─────────────────────────────────────────────────────────────
echo ""
echo "🔨 Verificando build..."

if [ -d "backend/dist" ] && [ -f "backend/dist/main.js" ]; then
    echo "   ✓ Backend compilado"
else
    echo "   ⚠️  Backend no compilado. Ejecutar: cd backend && npm run build"
fi

# ─────────────────────────────────────────────────────────────
# 6. Verificar Docker (si está disponible)
# ─────────────────────────────────────────────────────────────
if command -v docker &> /dev/null; then
    echo ""
    echo "🐳 Verificando Docker..."
    
    if [ ! -f "Dockerfile" ]; then
        echo "   ⚠️  Dockerfile no encontrado"
    else
        echo "   ✓ Dockerfile existe"
    fi
    
    if [ ! -f "docker-compose.prod.yml" ]; then
        echo "   ⚠️  docker-compose.prod.yml no encontrado"
    else
        echo "   ✓ docker-compose.prod.yml existe"
    fi
fi

# ─────────────────────────────────────────────────────────────
# 8. Resumen
# ─────────────────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════════════════════"

if [ $ERRORS -eq 0 ]; then
    echo "✅ VALIDACIÓN COMPLETA - Listo para producción"
    echo ""
    echo "Próximos pasos:"
    echo "1. Configurar las variables requeridas en Render"
    echo "2. Desplegar el Blueprint de Render"
    echo "3. Configurar el webhook de Meta en /api/webhooks/whatsapp"
    exit 0
else
    echo "❌ ERRORES ENCONTRADOS: $ERRORS"
    echo ""
    echo "Corregir los errores arriba antes de desplegar"
    exit 1
fi
