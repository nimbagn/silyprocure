#!/bin/bash
# Script pour exécuter la migration de validation interne sur PostgreSQL (Render)

set -e

echo "🔄 Exécution de la migration de validation interne des devis (PostgreSQL)..."

# Vérifier que DATABASE_URL est défini
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Erreur: DATABASE_URL n'est pas défini"
    echo "   Veuillez définir la variable d'environnement DATABASE_URL"
    exit 1
fi

SQL_FILE="migration_validation_interne_devis_postgresql.sql"

# Vérifier que le fichier existe
if [ ! -f "$SQL_FILE" ]; then
    echo "❌ Erreur: Fichier $SQL_FILE non trouvé"
    exit 1
fi

echo "📊 Connexion à PostgreSQL via DATABASE_URL..."
echo "📄 Exécution du fichier: $SQL_FILE"

# Exécuter la migration
psql "$DATABASE_URL" -f "$SQL_FILE"

echo "✅ Migration terminée avec succès!"
echo ""
echo "📋 Résumé des modifications:"
echo "   - Ajout de la colonne validation_interne"
echo "   - Ajout de la colonne commentaire_validation_interne"
echo "   - Ajout de la colonne valide_par_id"
echo "   - Ajout de la colonne date_validation_interne"
echo "   - Création de l'index idx_validation_interne"

