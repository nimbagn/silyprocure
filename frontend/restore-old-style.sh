#!/bin/bash
# Script pour désactiver la sidebar et restaurer l'ancien style

echo "🔄 Désactivation de la sidebar sur toutes les pages..."

cd "$(dirname "$0")"

# Trouver tous les fichiers HTML et ajouter la désactivation de la sidebar
for file in *.html; do
    if [ -f "$file" ] && [ "$file" != "index.html" ]; then
        # Vérifier si sidebar.js est présent
        if grep -q "js/sidebar.js" "$file"; then
            # Ajouter la désactivation avant sidebar.js
            if ! grep -q "DISABLE_SIDEBAR" "$file"; then
                sed -i '' 's|<script src="js/sidebar.js"></script>|<script>window.DISABLE_SIDEBAR = true;</script>\n    <script src="js/sidebar.js"></script>|g' "$file"
                echo "✅ $file mis à jour"
            else
                echo "⏭️  $file déjà configuré"
            fi
        fi
    fi
done

echo ""
echo "✅ Tous les fichiers ont été mis à jour !"
echo "🔄 Rechargez les pages pour voir l'ancien design."

