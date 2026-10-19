#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

if ! command -v docker >/dev/null 2>&1; then
  echo "Se necesita Docker para iniciar la base de datos local PostgreSQL." >&2
  exit 1
fi

cd "$ROOT_DIR"
docker compose up -d postgres

cd "$ROOT_DIR/backend"
npx prisma migrate deploy

echo "Webhook de WhatsApp (local): http://localhost:3001/api/webhooks/whatsapp"
echo "Documentación de la API: http://localhost:3001/api/docs"
echo "En esta prueba no se envían mensajes reales ni se usa OpenAI."

LOCAL_MODE=true OPENAI_API_KEY= npm exec -- ts-node -r tsconfig-paths/register src/main.ts
