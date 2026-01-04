#!/bin/bash
# Script de build pour Render
# Active PostgreSQL et installe les dépendances

set -e

echo "🔨 Build pour Render - SilyProcure"
echo "===================================="

# Activer PostgreSQL pour la production
if [ "$NODE_ENV" = "production" ] || [ -n "$RENDER" ]; then
    echo "📊 Activation de PostgreSQL..."
    if [ -f "backend/config/database.postgresql.js" ]; then
        cp backend/config/database.postgresql.js backend/config/database.js
        echo "✅ Configuration PostgreSQL activée"
    else
        echo "⚠️  Fichier database.postgresql.js non trouvé"
    fi
fi

# Installer les dépendances
echo "📦 Installation des dépendances..."
npm install --production

echo "✅ Build terminé avec succès!"

