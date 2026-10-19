#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "Checking the WhatsApp backend deployment..."

if ! git -C "$ROOT_DIR" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Run this check inside the project Git repository." >&2
  exit 1
fi

for file in render.yaml Dockerfile backend/package.json backend/src/main.ts backend/src/whatsapp/whatsapp.controller.ts backend/prisma/schema.prisma; do
  if [ ! -f "$ROOT_DIR/$file" ]; then
    echo "Missing required file: $file" >&2
    exit 1
  fi
done

cd "$ROOT_DIR/backend"
npm run build

if [ ! -f dist/main.js ] || [ ! -f dist/init-production.js ]; then
  echo "Backend build did not produce the production entry points." >&2
  exit 1
fi

echo "Backend deployment checks passed."
echo "Render webhook URL after deployment: https://<service>.onrender.com/api/webhooks/whatsapp"
