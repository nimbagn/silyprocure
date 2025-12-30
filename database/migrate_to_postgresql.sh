#!/bin/bash

# Script de migration de MySQL vers PostgreSQL
# SilyProcure - Migration complète

set -e

echo "🚀 Migration SilyProcure : MySQL → PostgreSQL"
echo "=============================================="

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variables
DB_NAME=${DB_NAME:-silypro}
DB_USER=${DB_USER:-soul}
DB_PASSWORD=${DB_PASSWORD:-Satina2025}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}

echo ""
echo "📋 Configuration:"
echo "   Base de données: $DB_NAME"
echo "   Utilisateur: $DB_USER"
echo "   Hôte: $DB_HOST"
echo "   Port: $DB_PORT"
echo ""

# Vérifier si PostgreSQL est installé
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL n'est pas installé${NC}"
    echo "   Installez PostgreSQL: https://www.postgresql.org/download/"
    exit 1
fi

echo -e "${GREEN}✅ PostgreSQL détecté${NC}"

# Vérifier la connexion
echo ""
echo "🔌 Test de connexion à PostgreSQL..."
export PGPASSWORD=$DB_PASSWORD

if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "SELECT 1" &> /dev/null; then
    echo -e "${GREEN}✅ Connexion réussie${NC}"
else
    echo -e "${RED}❌ Impossible de se connecter à PostgreSQL${NC}"
    echo "   Vérifiez vos identifiants et que PostgreSQL est démarré"
    exit 1
fi

# Créer la base de données si elle n'existe pas
echo ""
echo "📦 Création de la base de données..."
if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1; then
    echo -e "${YELLOW}⚠️  La base de données '$DB_NAME' existe déjà${NC}"
    read -p "Voulez-vous la supprimer et la recréer? (oui/non): " confirm
    if [ "$confirm" = "oui" ]; then
        psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;"
        psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
        echo -e "${GREEN}✅ Base de données recréée${NC}"
    else
        echo "Migration annulée"
        exit 0
    fi
else
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
    echo -e "${GREEN}✅ Base de données créée${NC}"
fi

# Exécuter le script SQL
echo ""
echo "📝 Exécution du schéma PostgreSQL..."
if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f database/silypro_create_database_postgresql.sql; then
    echo -e "${GREEN}✅ Schéma créé avec succès${NC}"
else
    echo -e "${RED}❌ Erreur lors de la création du schéma${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Migration terminée avec succès!${NC}"
echo ""
echo "📝 Prochaines étapes:"
echo "   1. Mettez à jour votre fichier .env avec les variables PostgreSQL"
echo "   2. Renommez backend/config/database.postgresql.js en database.js"
echo "   3. Installez les dépendances: npm install"
echo "   4. Redémarrez le serveur: npm start"
echo ""

unset PGPASSWORD

