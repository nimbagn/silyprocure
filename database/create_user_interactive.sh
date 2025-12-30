#!/bin/bash

# Script interactif pour créer l'utilisateur MySQL
# Ce script demande le mot de passe root et crée l'utilisateur 'soul'

echo "=========================================="
echo "Création de l'utilisateur MySQL 'soul'"
echo "=========================================="
echo ""

# Demander le mot de passe root
read -sp "Mot de passe MySQL root : " root_password
echo ""

if [ -z "$root_password" ]; then
    echo "❌ Le mot de passe ne peut pas être vide"
    exit 1
fi

echo ""
echo "📦 Création de l'utilisateur et de la base de données..."

# Créer l'utilisateur et la base de données
mysql -u root -p"$root_password" << EOF
CREATE USER IF NOT EXISTS 'soul'@'localhost' IDENTIFIED BY 'Satina2025';
CREATE DATABASE IF NOT EXISTS silypro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON silypro.* TO 'soul'@'localhost';
FLUSH PRIVILEGES;
SELECT '✅ Utilisateur soul créé avec succès' AS message;
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Utilisateur et base de données créés !"
    echo ""
    echo "📦 Vérification de l'existence des tables..."
    
    # Vérifier si les tables existent
    table_count=$(mysql -u root -p"$root_password" -D silypro -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'silypro';" 2>/dev/null | tail -1 | xargs)
    
    if [ "$table_count" = "0" ] || [ -z "$table_count" ]; then
        echo "📦 Création des tables..."
        mysql -u root -p"$root_password" < "$(dirname "$0")/silypro_create_database.sql"
        
        if [ $? -eq 0 ]; then
            echo "✅ Tables créées avec succès !"
        else
            echo "❌ Erreur lors de la création des tables"
            exit 1
        fi
    else
        echo "ℹ️  Les tables existent déjà ($table_count tables)"
    fi
    
    echo ""
    echo "🔗 Test de connexion..."
    mysql -u soul -pSatina2025 silypro -e "SELECT 'Connexion réussie !' AS status;" 2>&1 | grep -v "Warning"
    
    echo ""
    echo "✅ Configuration terminée !"
    echo ""
    echo "Vous pouvez maintenant redémarrer le serveur :"
    echo "  npm start"
else
    echo ""
    echo "❌ Erreur lors de la création"
    echo ""
    echo "💡 Vérifiez :"
    echo "   1. Que le mot de passe root est correct"
    echo "   2. Que MySQL est en cours d'exécution"
    echo "   3. Que vous avez les droits administrateur"
    exit 1
fi

