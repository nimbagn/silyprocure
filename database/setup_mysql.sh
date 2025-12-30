#!/bin/bash

# Script de configuration MySQL pour SilyProcure
# Ce script crée l'utilisateur 'soul' et la base de données 'silypro'

echo "=========================================="
echo "Configuration MySQL pour SilyProcure"
echo "=========================================="
echo ""

# Vérifier si MySQL est installé
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

echo "✅ MySQL détecté"
echo ""

# Demander les identifiants root
echo "Vous devez vous connecter en tant qu'administrateur MySQL (root)"
read -p "Nom d'utilisateur MySQL (root par défaut) : " mysql_user
mysql_user=${mysql_user:-root}

read -sp "Mot de passe MySQL (laissez vide si aucun) : " mysql_password
echo ""

# Construire la commande mysql
if [ -z "$mysql_password" ]; then
    mysql_cmd="mysql -u $mysql_user"
else
    mysql_cmd="mysql -u $mysql_user -p$mysql_password"
fi

echo ""
echo "📦 Création de l'utilisateur et de la base de données..."

# Exécuter le script de création d'utilisateur
$mysql_cmd < "$(dirname "$0")/create_user.sql"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Utilisateur et base de données créés avec succès !"
    echo ""
    echo "📋 Informations de connexion :"
    echo "   Base de données : silypro"
    echo "   Utilisateur : soul"
    echo "   Mot de passe : Satina2025"
    echo ""
    
    # Vérifier si la base de données existe déjà avec des tables
    tables_count=$($mysql_cmd -D silypro -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'silypro';" 2>/dev/null | tail -1)
    
    if [ "$tables_count" -eq "0" ] || [ -z "$tables_count" ]; then
        echo "📦 Création des tables..."
        $mysql_cmd < "$(dirname "$0")/silypro_create_database.sql"
        
        if [ $? -eq 0 ]; then
            echo "✅ Tables créées avec succès !"
        else
            echo "❌ Erreur lors de la création des tables"
            exit 1
        fi
    else
        echo "ℹ️  Les tables existent déjà ($tables_count tables)"
    fi
    
    echo ""
    echo "🔗 Test de connexion :"
    echo "   mysql -u soul -pSatina2025 silypro"
    echo ""
    echo "✅ Configuration terminée !"
else
    echo ""
    echo "❌ Erreur lors de la création"
    echo ""
    echo "💡 Solutions alternatives :"
    echo "   1. Vérifiez que vous avez les droits administrateur MySQL"
    echo "   2. Exécutez manuellement : mysql -u root -p < database/create_user.sql"
    echo "   3. Ou modifiez le fichier .env pour utiliser un autre utilisateur MySQL"
    exit 1
fi

