#!/bin/bash
# Script de build pour Render
# Active PostgreSQL et installe les dépendances

set -e

echo "🔨 Build pour Render - SilyProcure"
echo "===================================="

# Toujours activer PostgreSQL sur Render (détection automatique)
echo "📊 Activation de PostgreSQL..."
if [ -f "backend/config/database.postgresql.js" ]; then
    cp backend/config/database.postgresql.js backend/config/database.js
    echo "✅ Configuration PostgreSQL activée"
else
    echo "⚠️  Fichier database.postgresql.js non trouvé"
    exit 1
fi

# Installer les dépendances
echo "📦 Installation des dépendances..."
npm install --production

echo "✅ Build terminé avec succès!"

