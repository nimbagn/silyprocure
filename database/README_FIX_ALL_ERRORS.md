# Script de correction complète PostgreSQL

## 📋 Description

Ce script (`fix_all_errors_postgresql.sql`) corrige toutes les erreurs identifiées dans la base de données PostgreSQL :

1. **Table `fichiers_joints` → `documents_joints`**
   - Création de la table `documents_joints` si elle n'existe pas
   - Migration des données depuis `fichiers_joints` vers `documents_joints`
   - Suppression de l'ancienne table `fichiers_joints`

2. **Colonnes manquantes dans `entreprises`**
   - `rccm`
   - `numero_contribuable`
   - `capital_social`
   - `forme_juridique`
   - `secteur_activite`

3. **Colonnes manquantes dans `clients`**
   - `adresse`
   - `ville`
   - `pays`
   - `secteur_activite`
   - `site_web`
   - `notes`
   - Migration des données depuis `adresse_livraison`, `ville_livraison`, `pays_livraison`

4. **Support `demande_devis` dans `documents_joints`**
   - Ajout de `'demande_devis'` aux valeurs autorisées pour `type_document`

## 🚀 Comment exécuter

### Option 1 : Via le Shell Render (recommandé)

1. Allez sur https://dashboard.render.com
2. Sélectionnez votre service web
3. Cliquez sur "Shell"
4. Exécutez :
```bash
psql $DATABASE_URL -f database/fix_all_errors_postgresql.sql
```

### Option 2 : Via l'interface PostgreSQL Render

1. Allez sur votre service PostgreSQL sur Render
2. Cliquez sur "Connect" ou utilisez l'outil de requête
3. Copiez-collez le contenu du fichier `database/fix_all_errors_postgresql.sql`
4. Exécutez-le

### Option 3 : Via un script Node.js

Créez un script temporaire :

```bash
node -e "
const fs = require('fs');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const sql = fs.readFileSync('database/fix_all_errors_postgresql.sql', 'utf8');
pool.query(sql).then(() => {
  console.log('✅ Migration terminée');
  process.exit(0);
}).catch(err => {
  console.error('❌ Erreur:', err);
  process.exit(1);
});
"
```

## ✅ Vérification après exécution

Pour vérifier que tout est correct, exécutez ces requêtes :

```sql
-- Vérifier la structure de documents_joints
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'documents_joints' 
ORDER BY ordinal_position;

-- Vérifier que fichiers_joints n'existe plus
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'fichiers_joints';
-- Devrait retourner 0 lignes

-- Vérifier les colonnes entreprises
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'entreprises' 
AND column_name IN ('rccm', 'numero_contribuable', 'capital_social', 'forme_juridique', 'secteur_activite');

-- Vérifier les colonnes clients
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'clients' 
AND column_name IN ('adresse', 'ville', 'pays', 'secteur_activite', 'site_web', 'notes');
```

## 🔒 Sécurité

Le script est **idempotent** : il peut être exécuté plusieurs fois sans erreur. Il vérifie l'existence des tables et colonnes avant de les créer/modifier.

## 📝 Notes

- Le script migre automatiquement les données depuis `fichiers_joints` vers `documents_joints` si l'ancienne table existe
- Les colonnes sont créées uniquement si elles n'existent pas déjà
- Les données sont copiées depuis les colonnes `*_livraison` vers les nouvelles colonnes dans `clients`

