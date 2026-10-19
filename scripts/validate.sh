#!/bin/bash
# Atlas WhatsApp Bot — Script de validación completo
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/../backend"

declare -A RESULTS
declare -A DETAILS

run_check() {
  local name="$1"
  local cmd="$2"
  local dir="$3"
  local output

  echo "  → $name..."
  if output=$(cd "$dir" && eval "$cmd" 2>&1); then
    RESULTS["$name"]="PASS"
  else
    RESULTS["$name"]="FAIL"
    DETAILS["$name"]=$(echo "$output" | head -5)
  fi
}

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║    ATLAS WHATSAPP BOT — VALIDATION       ║"
echo "╚══════════════════════════════════════════╝"
echo ""

echo "▶ TypeScript..."
run_check "TypeScript Backend" "npx tsc -p tsconfig.build.json --noEmit" "$BACKEND_DIR"

echo "▶ Prisma..."
run_check "Prisma Validate" "npx prisma validate" "$BACKEND_DIR"

echo "▶ Unit Tests..."
run_check "Unit Tests" "npx jest --passWithNoTests --forceExit --silent" "$BACKEND_DIR"

echo "▶ E2E Tests..."
if [ -f "$BACKEND_DIR/test/jest-e2e.json" ]; then
  run_check "E2E Tests" "npx jest --config ./test/jest-e2e.json --forceExit --silent" "$BACKEND_DIR"
else
  RESULTS["E2E Tests"]="SKIP"
  DETAILS["E2E Tests"]="No existe configuración ni suite E2E en backend/test."
fi

echo "▶ Backend Build..."
run_check "Backend Build" "npm run build" "$BACKEND_DIR"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║              RESUMEN                     ║"
echo "╚══════════════════════════════════════════╝"
echo ""

ALL_PASS=true
printf "  %-26s %s\n" "Check" "Resultado"
printf "  %-26s %s\n" "--------------------------" "----------"

for key in "TypeScript Backend" "Prisma Validate" "Unit Tests" "E2E Tests" "Backend Build"; do
  result="${RESULTS[$key]:-SKIP}"
  if [ "$result" = "FAIL" ]; then
    ALL_PASS=false
    printf "  %-26s ❌ FAIL\n" "$key"
    if [ -n "${DETAILS[$key]}" ]; then
      echo "     └─ ${DETAILS[$key]}"
    fi
  elif [ "$result" = "SKIP" ]; then
    printf "  %-26s ⏭️  SKIP\n" "$key"
    if [ -n "${DETAILS[$key]}" ]; then
      echo "     └─ ${DETAILS[$key]}"
    fi
  else
    printf "  %-26s ✅ PASS\n" "$key"
  fi
done

echo ""
echo "╔══════════════════════════════════════════╗"
if $ALL_PASS; then
  echo "║  ✅ RESULTADO: READY FOR LOCAL TESTING  ║"
else
  echo "║  ❌ RESULTADO: NOT READY                ║"
fi
echo "╚══════════════════════════════════════════╝"
echo ""

if $ALL_PASS; then
  exit 0
else
  exit 1
fi
