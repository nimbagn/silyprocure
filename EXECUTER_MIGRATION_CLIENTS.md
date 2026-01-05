# Script de migration - Ajout colonnes à la table clients

## Option 1 : Exécution via npm (recommandé)

```bash
npm run render:add-clients-columns
```

## Option 2 : Exécution manuelle via Node.js

```bash
node backend/scripts/add-clients-columns.js
```

## Option 3 : Exécution directe SQL sur Render

Connectez-vous à votre base de données PostgreSQL sur Render et exécutez le contenu du fichier `database/add_clients_columns.sql`

### Via psql (si vous avez accès SSH)

```bash
psql $DATABASE_URL -f database/add_clients_columns.sql
```

### Via Render Dashboard

1. Allez dans votre service PostgreSQL sur Render
2. Cliquez sur "Connect" ou "Shell"
3. Copiez-collez le contenu de `database/add_clients_columns.sql`

## Option 4 : Exécution via l'interface Render

1. Allez sur https://dashboard.render.com
2. Sélectionnez votre service web (pas la base de données)
3. Cliquez sur "Shell"
4. Exécutez : `npm run render:add-clients-columns`

## Vérification

Pour vérifier que les colonnes ont été ajoutées :

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'clients' 
ORDER BY column_name;
```

Vous devriez voir :
- `adresse` (VARCHAR(500))
- `ville` (VARCHAR(100))
- `pays` (VARCHAR(100))
- `secteur_activite` (VARCHAR(100))
- `site_web` (VARCHAR(255))
- `notes` (TEXT)

