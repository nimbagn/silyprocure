#!/bin/bash

# Script rapide pour corriger la connexion MySQL
# Utilise root temporairement

echo "=========================================="
echo "Correction rapide - Connexion MySQL"
echo "=========================================="
echo ""

# Demander le mot de passe root
read -sp "Mot de passe MySQL root : " root_password
echo ""

if [ -z "$root_password" ]; then
    echo "❌ Le mot de passe ne peut pas être vide"
    exit 1
fi

# Tester la connexion
echo "🔍 Test de connexion..."
mysql -u root -p"$root_password" -e "SELECT 1;" > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ Erreur : Impossible de se connecter avec root"
    echo "   Vérifiez le mot de passe"
    exit 1
fi

echo "✅ Connexion root réussie"
echo ""

# Vérifier/créer la base de données
echo "📦 Vérification de la base de données..."
db_exists=$(mysql -u root -p"$root_password" -e "SHOW DATABASES LIKE 'silypro';" 2>/dev/null | grep silypro)

if [ -z "$db_exists" ]; then
    echo "📦 Création de la base de données 'silypro'..."
    mysql -u root -p"$root_password" < "$(dirname "$0")/database/silypro_create_database.sql" 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "✅ Base de données créée"
    else
        echo "⚠️  Erreur lors de la création, mais on continue..."
    fi
else
    echo "✅ Base de données 'silypro' existe déjà"
fi

# Sauvegarder le .env actuel
if [ -f .env ]; then
    cp .env .env.backup
    echo "✅ .env sauvegardé"
fi

# Créer le .env avec root
cat > .env << EOF
# Configuration SilyProcure
PORT=3000

# Configuration Base de Données MySQL (utilise root temporairement)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=silypro
DB_USER=root
DB_PASSWORD=$root_password

# JWT Secret
JWT_SECRET=3070abe036c95d9c884b5fbc55f9377d45bc00723c05e86d5a50200b4757439d4cb97c9f19a01995978050db84efd2d7385702a506478af0794df9e83246bc38

# JWT Expiration
JWT_EXPIRES_IN=24h

# Environnement
NODE_ENV=development
EOF

echo "✅ .env configuré avec root"
echo ""
echo "🚀 Vous pouvez maintenant relancer le serveur :"
echo "   npm start"
echo ""
echo "⚠️  Note : Cette configuration utilise root MySQL"
echo "   Pour créer l'utilisateur 'soul' plus tard :"
echo "   ./database/create_user_interactive.sh"

