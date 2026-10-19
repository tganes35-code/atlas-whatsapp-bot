#!/bin/bash

# Pre-Deploy Check Script
# Valida que todo está listo antes de desplegar a Render

echo "════════════════════════════════════════════════════════════════"
echo "🔍 PRE-DEPLOY CHECK - Atlas WhatsApp Bot"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contadores
CHECKS_PASSED=0
CHECKS_FAILED=0

# Función para check
check() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
        ((CHECKS_PASSED++))
    else
        echo -e "${RED}✗${NC} $2"
        ((CHECKS_FAILED++))
    fi
}

# 1. Verificar que estamos en la rama correcta
echo "1️⃣  Git Checks"
echo "─────────────────────────────────────────────────────────────────"
BRANCH=$(git rev-parse --abbrev-ref HEAD)
[ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ]
check $? "Current branch: $BRANCH (debe ser main o master)"

[ -f ".gitignore" ]
check $? "Archivo .gitignore existe"

echo ""

# 2. Verificar archivos de configuración
echo "2️⃣  Configuration Files"
echo "─────────────────────────────────────────────────────────────────"
[ -f "render.yaml" ]
check $? "render.yaml existe"

[ -f "backend/.env.production" ]
check $? "backend/.env.production existe"

[ -f "backend/package.json" ]
check $? "backend/package.json existe"

[ -f "backend/tsconfig.json" ]
check $? "backend/tsconfig.json existe"

echo ""

# 3. Verificar variables de entorno
echo "3️⃣  Environment Variables (backend/.env.production)"
echo "─────────────────────────────────────────────────────────────────"
grep -q "JWT_SECRET=" backend/.env.production
check $? "JWT_SECRET configurado"

grep -q "WHATSAPP_ACCESS_TOKEN=" backend/.env.production
check $? "WHATSAPP_ACCESS_TOKEN configurado"

grep -q "WHATSAPP_PHONE_NUMBER_ID=" backend/.env.production
check $? "WHATSAPP_PHONE_NUMBER_ID configurado"

grep -q "WHATSAPP_APP_SECRET=" backend/.env.production
check $? "WHATSAPP_APP_SECRET configurado"

grep -q "WHATSAPP_VERIFY_TOKEN=" backend/.env.production
check $? "WHATSAPP_VERIFY_TOKEN configurado"

echo ""

# 4. Verificar estructura del proyecto
echo "4️⃣  Project Structure"
echo "─────────────────────────────────────────────────────────────────"
[ -d "backend/src" ]
check $? "backend/src existe"

[ -f "backend/src/main.ts" ]
check $? "backend/src/main.ts existe"

[ -f "backend/src/app.module.ts" ]
check $? "backend/src/app.module.ts existe"

[ -d "backend/prisma" ]
check $? "backend/prisma existe"

[ -f "backend/prisma/schema.prisma" ]
check $? "backend/prisma/schema.prisma existe"

echo ""

# 5. Verificar dependencias
echo "5️⃣  Dependencies"
echo "─────────────────────────────────────────────────────────────────"
grep -q "@nestjs/core" backend/package.json
check $? "@nestjs/core en package.json"

grep -q "@prisma/client" backend/package.json
check $? "@prisma/client en package.json"

grep -q "typescript" backend/package.json
check $? "typescript en package.json"

echo ""

# 6. Verificar scripts
echo "6️⃣  Build Scripts"
echo "─────────────────────────────────────────────────────────────────"
grep -q '"build":' backend/package.json
check $? "Script 'build' existe"

grep -q '"start:prod":' backend/package.json
check $? "Script 'start:prod' existe"

grep -q '"prisma:migrate:deploy":' backend/package.json
check $? "Script 'prisma:migrate:deploy' existe"

echo ""

# 7. Verificar documentación
echo "7️⃣  Documentation"
echo "─────────────────────────────────────────────────────────────────"
[ -f "DEPLOY_CHECKLIST.md" ]
check $? "DEPLOY_CHECKLIST.md existe"

[ -f "RENDER_DEPLOY_GUIDE.md" ]
check $? "RENDER_DEPLOY_GUIDE.md existe"

echo ""

# 8. Verificar commits recientes
echo "8️⃣  Git History"
echo "─────────────────────────────────────────────────────────────────"
COMMITS=$(git log --oneline -5 | wc -l)
[ "$COMMITS" -gt 0 ]
check $? "Hay commits en el repositorio"

LAST_COMMIT=$(git log -1 --pretty=%B)
echo "   Último commit: $LAST_COMMIT"

echo ""

# 9. Verificar archivos no commiteados
echo "9️⃣  Git Status"
echo "─────────────────────────────────────────────────────────────────"
STATUS=$(git status --porcelain | wc -l)
if [ "$STATUS" -eq 0 ]; then
    echo -e "${GREEN}✓${NC} No hay cambios sin commitar"
    ((CHECKS_PASSED++))
else
    echo -e "${YELLOW}⚠${NC} Hay $STATUS cambios sin commitar"
    git status --short
fi

echo ""

# 10. Resumen
echo "════════════════════════════════════════════════════════════════"
echo "📊 RESUMEN PRE-DEPLOY"
echo "════════════════════════════════════════════════════════════════"
echo -e "${GREEN}✓ Pasados: $CHECKS_PASSED${NC}"
echo -e "${RED}✗ Fallos: $CHECKS_FAILED${NC}"
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
    echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}✅ ¡TODO LISTO PARA DESPLEGAR A RENDER!${NC}"
    echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "Próximos pasos:"
    echo "1. Ve a: https://render.com"
    echo "2. Conecta este repositorio GitHub"
    echo "3. Render auto-detectará render.yaml"
    echo "4. Click 'Create Web Service'"
    echo "5. Espera 5-10 minutos a que se compile"
    echo "6. Obtén tu URL pública"
    echo "7. Configura webhook en Meta"
    echo ""
    exit 0
else
    echo -e "${RED}════════════════════════════════════════════════════════════════${NC}"
    echo -e "${RED}❌ FALLOS DETECTADOS - REVISA LOS ERRORES ARRIBA${NC}"
    echo -e "${RED}════════════════════════════════════════════════════════════════${NC}"
    exit 1
fi
