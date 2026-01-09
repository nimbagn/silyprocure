#!/bin/bash

# Script pour lancer le serveur de développement sur le port 3000
# Usage: ./start-server-3000.sh

PORT=3000
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Démarrage du serveur de développement SilyProcure"
echo "📁 Répertoire: $DIR"
echo "🌐 Port: $PORT"
echo ""

# Libérer le port 3000 si occupé
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  Le port $PORT est déjà utilisé. Libération..."
    lsof -ti:$PORT | xargs kill -9 2>/dev/null
    sleep 1
fi

echo "📋 URLs disponibles:"
echo "   - Dashboard: http://localhost:$PORT/dashboard.html"
echo "   - Test Dashboard: http://localhost:$PORT/test-dashboard.html"
echo ""
echo "⏹️  Appuyez sur Ctrl+C pour arrêter le serveur"
echo ""

cd "$DIR"
python3 -m http.server $PORT

