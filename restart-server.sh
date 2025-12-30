#!/bin/bash

echo "🔄 Arrêt des processus sur le port 3000..."

# Tuer tous les processus Node.js qui utilisent le port 3000
lsof -ti:3000 | xargs kill -9 2>/dev/null

# Attendre que le port soit libéré
sleep 2

# Vérifier que le port est libre
if lsof -ti:3000 > /dev/null 2>&1; then
    echo "⚠️  Le port 3000 est encore occupé. Tentative de force..."
    # Essayer avec sudo si nécessaire (décommentez si besoin)
    # sudo lsof -ti:3000 | xargs sudo kill -9 2>/dev/null
    sleep 1
fi

# Démarrer le serveur
echo "🚀 Démarrage du serveur sur le port 3000..."
cd "$(dirname "$0")"
npm start

