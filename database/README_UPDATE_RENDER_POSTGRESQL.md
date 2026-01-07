# Script de mise à jour PostgreSQL pour Render

## 📋 Description

Le fichier `update_render_postgresql_complete.sql` est un script SQL PostgreSQL idempotent qui met à jour la base de données sur Render avec toutes les tables et colonnes nécessaires pour le fonctionnement complet de SilyProcure.

## 🚀 Utilisation

### Sur Render (via psql)

1. Connectez-vous à votre base de données PostgreSQL sur Render via le terminal ou psql
2. Exécutez le script :

```bash
psql $DATABASE_URL -f database/update_render_postgresql_complete.sql
```

Ou via l'interface Render :
- Allez dans votre service PostgreSQL
- Ouvrez la console SQL
- Copiez-collez le contenu du script
- Exécutez-le

### Localement (pour test)

```bash
psql -U votre_utilisateur -d silypro -f database/update_render_postgresql_complete.sql
```

## ✅ Ce que fait le script

### Tables créées/vérifiées

1. **demandes_devis** - Demandes de devis depuis la page d'accueil
2. **demandes_devis_lignes** - Lignes des demandes de devis
3. **messages_contact** - Messages du formulaire de contact
4. **liens_externes** - Liens de remplissage externes pour les fournisseurs
5. **documents_joints** - Pièces jointes (remplace fichiers_joints)
6. **marges_commerciales** - Configuration des marges commerciales

### Colonnes ajoutées

#### Table `entreprises`
- `rccm` - Numéro RCCM
- `numero_contribuable` - Numéro contribuable
- `capital_social` - Capital social
- `forme_juridique` - Forme juridique
- `secteur_activite` - Secteur d'activité

#### Table `clients`
- `adresse` - Adresse principale
- `ville` - Ville
- `pays` - Pays
- `secteur_activite` - Secteur d'activité
- `site_web` - Site web
- `notes` - Notes

#### Table `factures`
- `demande_devis_id` - Lien vers la demande de devis
- `total_achat_ht` - Total HT d'achat (prix fournisseur)
- `marge_totale` - Marge totale générée

#### Table `facture_lignes`
- `prix_achat_ht` - Prix d'achat HT (prix fournisseur)
- `marge_appliquee` - Pourcentage de marge appliquée

## 🔒 Sécurité

- Le script est **idempotent** : il peut être exécuté plusieurs fois sans erreur
- Toutes les vérifications utilisent `IF NOT EXISTS` ou `DO $$` blocks
- Les données existantes ne sont pas supprimées
- Les migrations de données sont sécurisées (copie depuis colonnes existantes)

## 📝 Notes importantes

1. **Statut commandes** : Le script vérifie l'existence de la colonne `statut` dans `commandes`, mais ne modifie pas les contraintes CHECK existantes. Si vous devez ajouter le statut `'validee'`, vous devrez modifier manuellement la contrainte.

2. **Statut bons_livraison** : De même, le script vérifie l'existence de la colonne `statut` dans `bons_livraison`, mais ne modifie pas les contraintes CHECK existantes. Si vous devez ajouter le statut `'facture_generee'`, vous devrez modifier manuellement la contrainte.

3. **Migration fichiers_joints** : Si la table `fichiers_joints` existe, le script tentera de migrer les données vers `documents_joints` avant de supprimer `fichiers_joints`.

## 🔍 Vérification après exécution

Pour vérifier que toutes les tables ont été créées :

```sql
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

Pour vérifier les colonnes d'une table spécifique :

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'nom_de_la_table' 
ORDER BY ordinal_position;
```

## ⚠️ Troubleshooting

### Erreur : "relation does not exist"
- Vérifiez que vous êtes connecté à la bonne base de données
- Vérifiez que les tables de base (utilisateurs, entreprises, etc.) existent

### Erreur : "permission denied"
- Vérifiez que votre utilisateur a les permissions nécessaires
- Sur Render, utilisez l'utilisateur principal de la base de données

### Erreur : "duplicate key value"
- Le script est idempotent, mais si vous avez des contraintes uniques violées, vous devrez les corriger manuellement

## 📚 Documentation complémentaire

- `SCHEMA.md` - Schéma complet de la base de données
- `README_DATABASE.md` - Documentation générale de la base de données
- `fix_all_errors_postgresql.sql` - Script de correction des erreurs précédentes

---

**Version** : 1.0  
**Date** : 2024  
**Auteur** : SilyProcure Team

