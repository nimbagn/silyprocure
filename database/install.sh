#!/bin/bash

# Script d'installation de la base de données SilyProcure
# Base de données : silypro
# Utilisateur : soul
# Mot de passe : Satina2025

echo "=========================================="
echo "Installation de la base de données SilyProcure"
echo "=========================================="
echo ""

# Vérifier si MySQL est installé
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

echo "✅ MySQL détecté"
echo ""

# Demander les identifiants root si nécessaire
read -p "Nom d'utilisateur MySQL (root par défaut) : " mysql_user
mysql_user=${mysql_user:-root}

read -sp "Mot de passe MySQL : " mysql_password
echo ""

# Exécuter le script SQL
echo ""
echo "📦 Création de la base de données et des tables..."
mysql -u "$mysql_user" -p"$mysql_password" < "$(dirname "$0")/silypro_create_database.sql"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Base de données créée avec succès !"
    echo ""
    echo "📋 Informations de connexion :"
    echo "   Base de données : silypro"
    echo "   Utilisateur : soul"
    echo "   Mot de passe : Satina2025"
    echo ""
    echo "🔗 Test de connexion :"
    echo "   mysql -u soul -pSatina2025 silypro"
    echo ""
else
    echo ""
    echo "❌ Erreur lors de la création de la base de données"
    exit 1
fi

