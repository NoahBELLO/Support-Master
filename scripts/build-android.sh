#!/bin/bash
# Usage : ./scripts/build-android.sh
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

echo ""
echo "================================================"
echo "   BUILD ANDROID — Docker local                "
echo "================================================"
echo ""


if ! sudo docker info > /dev/null 2>&1; then
    echo "❌ Docker n'est pas démarré. Lancez Docker Desktop puis réessayez."
    exit 1
fi
echo "✓ Docker est actif"

if [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs)
    echo "✓ Variables .env chargées"
fi

mkdir -p generated/builds/apk generated/source/android

echo ""
echo "▶ Lancement du build Docker..."
echo ""

docker compose -f docker/docker-compose.yml up \
    --build \
    --abort-on-container-exit \
    --exit-code-from android-builder

echo ""
echo "✅ Build terminé ! Votre APK est dans : generated/builds/apk/"
