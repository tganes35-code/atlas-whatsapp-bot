#!/bin/bash

# Atlas WhatsApp Chatbot - Deploy Script
# Este script despliega el proyecto a Render.com

set -e

echo "🚀 ATLAS WHATSAPP CHATBOT - DEPLOY SCRIPT"
echo ""
echo "Este script te ayudará a desplegar a Render.com"
echo ""

# Verificar si git está inicializado
if [ ! -d .git ]; then
    echo "📝 Inicializando repositorio Git..."
    git init
    git config user.email "deploy@atlas.local"
    git config user.name "Atlas Bot"
fi

# Verificar .gitignore
if [ ! -f .gitignore ]; then
    echo "📝 Creando .gitignore..."
    cat > .gitignore << 'GITIGNORE'
# Dependencies
node_modules/
.pnp
.pnp.js

# Build
dist/
build/

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Misc
*.pem
.cache
GITIGNORE
fi

# Compilar backend y frontend
echo "🔨 Compilando backend..."
cd backend
npm run build > /dev/null 2>&1
cd ..

echo "🔨 Compilando frontend..."
cd frontend
npm run build > /dev/null 2>&1
cd ..

# Agregar todos los archivos
echo "📦 Preparando repositorio..."
git add .
git commit -m "🚀 Deploy to Render.com" --allow-empty > /dev/null 2>&1

echo ""
echo "✅ Proyecto preparado para desplegar"
echo ""
echo "📋 PRÓXIMOS PASOS:"
echo ""
echo "1️⃣ Ve a https://render.com"
echo "2️⃣ Crea una cuenta (gratis)"
echo "3️⃣ Conecta tu repositorio GitHub"
echo "4️⃣ O usa Render CLI:"
echo ""
echo "   npm install -g render-cli"
echo "   render deploy"
echo ""
echo "5️⃣ Una vez desplegado, te darán las URLs:"
echo "   - API: https://atlas-whatsapp-bot-api.onrender.com"
echo "   - Web: https://atlas-whatsapp-bot-web.onrender.com"
echo ""
echo "6️⃣ Configura el webhook en Meta:"
echo "   Webhook URL: https://atlas-whatsapp-bot-api.onrender.com/api/webhooks/whatsapp"
echo "   Verify Token: atlas-verify-token"
echo ""
echo "7️⃣ Proporciona tus credenciales en Render:"
echo "   - WHATSAPP_ACCESS_TOKEN"
echo "   - WHATSAPP_APP_SECRET"
echo ""
