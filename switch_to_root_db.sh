#!/bin/bash

# Script pour basculer temporairement vers root MySQL
# Usage: ./switch_to_root_db.sh [mot_de_passe_root]

echo "=========================================="
echo "Basculement vers root MySQL (temporaire)"
echo "=========================================="
echo ""

if [ -z "$1" ]; then
    read -sp "Mot de passe MySQL root : " root_password
    echo ""
else
    root_password="$1"
fi

if [ -z "$root_password" ]; then
    echo "❌ Le mot de passe ne peut pas être vide"
    exit 1
fi

# Vérifier la connexion root
mysql -u root -p"$root_password" -e "SELECT 1;" > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ Erreur : Impossible de se connecter avec root"
    echo "   Vérifiez le mot de passe"
    exit 1
fi

# Vérifier si la base existe
db_exists=$(mysql -u root -p"$root_password" -e "SHOW DATABASES LIKE 'silypro';" 2>/dev/null | grep silypro)

if [ -z "$db_exists" ]; then
    echo "📦 La base de données 'silypro' n'existe pas. Création..."
    mysql -u root -p"$root_password" < "$(dirname "$0")/database/silypro_create_database.sql" 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "✅ Base de données créée"
    else
        echo "⚠️  Erreur lors de la création, mais on continue..."
    fi
fi

# Sauvegarder le .env actuel
if [ -f .env ]; then
    cp .env .env.backup
    echo "✅ .env sauvegardé dans .env.backup"
fi

# Créer/modifier le .env avec root
cat > .env << EOF
# Configuration SilyProcure
# Variables d'environnement

# Port du serveur
PORT=3000

# Configuration Base de Données MySQL (TEMPORAIRE - utilise root)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=silypro
DB_USER=root
DB_PASSWORD=$root_password

# JWT Secret
JWT_SECRET=3070abe036c95d9c884b5fbc55f9377d45bc00723c05e86d5a50200b4757439d4cb97c9f19a01995978050db84efd2d7385702a506478af0794df9e83246bc38

# JWT Expiration
JWT_EXPIRES_IN=24h

# Environnement (development, production)
NODE_ENV=development
EOF

echo "✅ .env modifié pour utiliser root"
echo ""
echo "⚠️  ATTENTION : Cette configuration utilise root MySQL"
echo "   Pour revenir à 'soul' : ./switch_to_soul_db.sh"
echo ""
echo "🚀 Vous pouvez maintenant relancer le serveur :"
echo "   npm start"

