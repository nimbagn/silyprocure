#!/bin/bash

# Script pour charger les données de test dans SilyProcure

echo "=========================================="
echo "Chargement des données de test SilyProcure"
echo "=========================================="
echo ""

# Détecter l'utilisateur MySQL à utiliser
if [ -f ../.env ]; then
    DB_USER=$(grep "^DB_USER=" ../.env | cut -d'=' -f2)
    DB_PASSWORD=$(grep "^DB_PASSWORD=" ../.env | cut -d'=' -f2)
    DB_NAME=$(grep "^DB_NAME=" ../.env | cut -d'=' -f2)
    
    if [ -n "$DB_USER" ] && [ -n "$DB_PASSWORD" ] && [ -n "$DB_NAME" ]; then
        echo "📋 Utilisation de la configuration .env :"
        echo "   Utilisateur: $DB_USER"
        echo "   Base: $DB_NAME"
        echo ""
        
        # Tester la connexion
        mysql -u "$DB_USER" -p"$DB_PASSWORD" -e "USE $DB_NAME; SELECT 1;" > /dev/null 2>&1
        if [ $? -eq 0 ]; then
            echo "✅ Connexion réussie"
            echo ""
            echo "📦 Insertion des données de test..."
            mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$(dirname "$0")/insert_test_data.sql"
            
            if [ $? -eq 0 ]; then
                echo ""
                echo "✅ Données de test insérées avec succès !"
                echo ""
                echo "📊 Résumé :"
                mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "
                    SELECT 'Entreprises' AS type, COUNT(*) AS total FROM entreprises
                    UNION ALL
                    SELECT 'Produits', COUNT(*) FROM produits
                    UNION ALL
                    SELECT 'RFQ', COUNT(*) FROM rfq
                    UNION ALL
                    SELECT 'Devis', COUNT(*) FROM devis
                    UNION ALL
                    SELECT 'Commandes', COUNT(*) FROM commandes;
                " 2>/dev/null
                echo ""
                echo "🎉 Vous pouvez maintenant tester l'application !"
            else
                echo ""
                echo "❌ Erreur lors de l'insertion des données"
                exit 1
            fi
        else
            echo "❌ Erreur de connexion à la base de données"
            echo "   Vérifiez vos identifiants dans le fichier .env"
            exit 1
        fi
    else
        echo "⚠️  Configuration .env incomplète"
        echo "   Utilisation de root par défaut"
        read -sp "Mot de passe MySQL root : " root_password
        echo ""
        mysql -u root -p"$root_password" silypro < "$(dirname "$0")/insert_test_data.sql"
    fi
else
    echo "⚠️  Fichier .env non trouvé"
    read -sp "Mot de passe MySQL root : " root_password
    echo ""
    mysql -u root -p"$root_password" silypro < "$(dirname "$0")/insert_test_data.sql"
fi

