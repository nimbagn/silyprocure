#!/bin/bash

# Script pour lancer le serveur de développement
# Usage: ./start-server.sh

PORT=3000
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Démarrage du serveur de développement SilyProcure"
echo "📁 Répertoire: $DIR"
echo "🌐 Port: $PORT"
echo ""
echo "📋 URLs disponibles:"
echo "   - Dashboard: http://localhost:$PORT/dashboard.html"
echo "   - Test Dashboard: http://localhost:$PORT/test-dashboard.html"
echo ""
echo "⏹️  Appuyez sur Ctrl+C pour arrêter le serveur"
echo ""

cd "$DIR"
python3 -m http.server $PORT

