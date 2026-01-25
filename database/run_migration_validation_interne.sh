#!/bin/bash
# Script pour exécuter la migration de validation interne des devis

set -e

echo "🔄 Exécution de la migration de validation interne des devis..."

# Détecter le type de base de données
if [ -n "$DATABASE_URL" ] || [ "$DB_TYPE" = "postgresql" ]; then
    echo "📊 Utilisation de PostgreSQL"
    SQL_FILE="migration_validation_interne_devis_postgresql.sql"
else
    echo "📊 Utilisation de MySQL"
    SQL_FILE="migration_validation_interne_devis.sql"
fi

# Vérifier que le fichier existe
if [ ! -f "$SQL_FILE" ]; then
    echo "❌ Erreur: Fichier $SQL_FILE non trouvé"
    exit 1
fi

# Exécuter la migration
if [ -n "$DATABASE_URL" ]; then
    # PostgreSQL avec DATABASE_URL
    echo "🔗 Connexion via DATABASE_URL..."
    psql "$DATABASE_URL" -f "$SQL_FILE"
elif [ "$DB_TYPE" = "postgresql" ]; then
    # PostgreSQL avec variables d'environnement
    echo "🔗 Connexion PostgreSQL..."
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f "$SQL_FILE"
else
    # MySQL
    echo "🔗 Connexion MySQL..."
    mysql -h "${DB_HOST:-localhost}" -u "${DB_USER:-root}" -p"${DB_PASSWORD}" "${DB_NAME:-silypro}" < "$SQL_FILE"
fi

echo "✅ Migration terminée avec succès!"

