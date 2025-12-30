#!/bin/bash

# Script automatique pour corriger MySQL
# Essaie plusieurs méthodes pour se connecter

echo "=========================================="
echo "Correction automatique MySQL"
echo "=========================================="
echo ""

# Méthode 1 : Essayer root sans mot de passe
echo "🔍 Tentative 1 : root sans mot de passe..."
mysql -u root -e "SELECT 1;" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Connexion réussie avec root (sans mot de passe)"
    mysql -u root << 'EOF'
CREATE USER IF NOT EXISTS 'soul'@'localhost' IDENTIFIED BY 'Satina2025';
CREATE DATABASE IF NOT EXISTS silypro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON silypro.* TO 'soul'@'localhost';
FLUSH PRIVILEGES;
SELECT '✅ Utilisateur soul créé' AS message;
EOF
    if [ $? -eq 0 ]; then
        echo "✅ Utilisateur créé avec succès"
        exit 0
    fi
fi

# Méthode 2 : Essayer avec le socket Unix (macOS)
echo ""
echo "🔍 Tentative 2 : connexion via socket Unix..."
if [ -S /tmp/mysql.sock ] || [ -S /var/run/mysqld/mysqld.sock ]; then
    mysql -u root --socket=/tmp/mysql.sock -e "SELECT 1;" > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ Connexion réussie via socket"
        mysql -u root --socket=/tmp/mysql.sock << 'EOF'
CREATE USER IF NOT EXISTS 'soul'@'localhost' IDENTIFIED BY 'Satina2025';
CREATE DATABASE IF NOT EXISTS silypro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON silypro.* TO 'soul'@'localhost';
FLUSH PRIVILEGES;
EOF
        exit 0
    fi
fi

# Si aucune méthode automatique ne fonctionne
echo ""
echo "❌ Impossible de se connecter automatiquement à MySQL"
echo ""
echo "💡 Solutions manuelles :"
echo ""
echo "1. Exécutez manuellement :"
echo "   mysql -u root -p"
echo "   Puis exécutez :"
echo "   CREATE USER IF NOT EXISTS 'soul'@'localhost' IDENTIFIED BY 'Satina2025';"
echo "   CREATE DATABASE IF NOT EXISTS silypro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
echo "   GRANT ALL PRIVILEGES ON silypro.* TO 'soul'@'localhost';"
echo "   FLUSH PRIVILEGES;"
echo ""
echo "2. Ou utilisez root temporairement :"
echo "   Modifiez .env et changez :"
echo "   DB_USER=root"
echo "   DB_PASSWORD=votre_mot_de_passe_root"
echo ""
echo "3. Ou exécutez le script interactif :"
echo "   ./quick_fix_db.sh"

