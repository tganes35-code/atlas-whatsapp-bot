#!/bin/bash

# ATLAS WHATSAPP CHATBOT - Startup Script
# Este script inicia todos los servicios necesarios

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

echo "🚀 INICIANDO ATLAS WHATSAPP CHATBOT..."
echo "📁 Proyecto: $PROJECT_DIR"
echo ""

# 1. Verificar Docker
echo "✓ Verificando servicios Docker..."
docker ps > /dev/null 2>&1 || { echo "❌ Docker no está corriendo"; exit 1; }

# 2. Verificar PostgreSQL
echo "✓ PostgreSQL..."
docker ps | grep -q "atlas-postgres" || { echo "⚠️  PostgreSQL no activo. Iniciando..."; docker-compose -f "$PROJECT_DIR/docker-compose.yml" up -d postgres redis; sleep 5; }

# 3. Backend
echo "✓ Backend NestJS..."
cd "$BACKEND_DIR"
if ! npm ls > /dev/null 2>&1; then
    echo "📦 Instalando dependencias backend..."
    npm install
fi
echo "🔨 Compilando..."
npm run build > /dev/null 2>&1
echo "🎯 Iniciando servidor (puerto 3001)..."
npm run start:prod > /tmp/atlas-backend.log 2>&1 &
BACKEND_PID=$!
sleep 8
echo "   PID: $BACKEND_PID"

# 4. Frontend
echo "✓ Frontend Vue 3..."
cd "$FRONTEND_DIR"
if ! npm ls > /dev/null 2>&1; then
    echo "📦 Instalando dependencias frontend..."
    npm install
fi
echo "🎯 Iniciando servidor (puerto 5173)..."
npm run dev > /tmp/atlas-frontend.log 2>&1 &
FRONTEND_PID=$!
sleep 5
echo "   PID: $FRONTEND_PID"

echo ""
echo "✅ TODO INICIADO CORRECTAMENTE"
echo ""
echo "📱 ACCESO:"
echo "   🌐 Panel Admin:  http://localhost:5173"
echo "   📊 API Swagger:  http://localhost:3001/api/docs"
echo "   💬 Simulador:    http://localhost:5173 → Dashboard → Simulador"
echo ""
echo "👤 Credenciales:"
echo "   Usuario: admin@atlas.local"
echo "   Clave:   Admin123!"
echo ""
echo "📞 Teléfono Demo: 3009999999"
echo ""
echo "📋 Logs:"
echo "   Backend:  tail -f /tmp/atlas-backend.log"
echo "   Frontend: tail -f /tmp/atlas-frontend.log"
echo ""
echo "🛑 Para detener todo:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo ""

# Mantener script activo
wait $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
