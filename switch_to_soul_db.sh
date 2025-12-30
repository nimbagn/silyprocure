#!/bin/bash

# Script pour revenir à l'utilisateur 'soul'
# Nécessite que l'utilisateur 'soul' existe

echo "=========================================="
echo "Basculement vers l'utilisateur 'soul'"
echo "=========================================="
echo ""

# Vérifier si l'utilisateur soul existe
mysql -u root -e "SELECT User FROM mysql.user WHERE User='soul' AND Host='localhost';" 2>/dev/null | grep -q soul
if [ $? -ne 0 ]; then
    echo "❌ L'utilisateur 'soul' n'existe pas"
    echo ""
    echo "💡 Créez-le d'abord avec :"
    echo "   ./database/create_user_interactive.sh"
    exit 1
fi

# Restaurer le .env avec soul
if [ -f .env.backup ]; then
    cp .env.backup .env
    echo "✅ .env restauré depuis .env.backup"
else
    # Créer un nouveau .env avec soul
    cat > .env << 'EOF'
# Configuration SilyProcure
# Variables d'environnement

# Port du serveur
PORT=3000

# Configuration Base de Données MySQL
DB_HOST=localhost
DB_PORT=3306
DB_NAME=silypro
DB_USER=soul
DB_PASSWORD=Satina2025

# JWT Secret
JWT_SECRET=3070abe036c95d9c884b5fbc55f9377d45bc00723c05e86d5a50200b4757439d4cb97c9f19a01995978050db84efd2d7385702a506478af0794df9e83246bc38

# JWT Expiration
JWT_EXPIRES_IN=24h

# Environnement (development, production)
NODE_ENV=development
EOF
    echo "✅ .env créé avec l'utilisateur 'soul'"
fi

echo ""
echo "✅ Configuration mise à jour"
echo ""
echo "🚀 Vous pouvez maintenant relancer le serveur :"
echo "   npm start"

