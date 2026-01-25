# Migration : Validation Interne des Devis

## Vue d'ensemble

Cette migration ajoute le système de validation interne des devis fournisseurs, permettant à l'équipe de valider les devis avant de créer le devis majoré pour le client.

## Fichiers de migration

- `migration_validation_interne_devis.sql` - Version MySQL
- `migration_validation_interne_devis_postgresql.sql` - Version PostgreSQL

## Colonnes ajoutées

La migration ajoute les colonnes suivantes à la table `devis`:

1. **validation_interne** (VARCHAR/ENUM)
   - Valeurs possibles: `en_attente_validation`, `valide_interne`, `refuse_interne`
   - Valeur par défaut: `en_attente_validation`

2. **commentaire_validation_interne** (TEXT)
   - Commentaires optionnels de l'équipe lors de la validation

3. **valide_par_id** (INTEGER)
   - ID de l'utilisateur qui a validé le devis
   - Clé étrangère vers `utilisateurs(id)`

4. **date_validation_interne** (TIMESTAMP/DATETIME)
   - Date et heure de la validation interne

5. **Index**
   - `idx_validation_interne` sur la colonne `validation_interne`

## Exécution de la migration

### Sur Render (PostgreSQL)

```bash
# Via le script automatique
cd database
./run_migration_validation_interne_postgresql.sh

# Ou manuellement
psql $DATABASE_URL -f migration_validation_interne_devis_postgresql.sql
```

### En local (MySQL)

```bash
cd database
./run_migration_validation_interne.sh

# Ou manuellement
mysql -u root -p silypro < migration_validation_interne_devis.sql
```

### En local (PostgreSQL)

```bash
cd database
psql -U postgres -d silypro -f migration_validation_interne_devis_postgresql.sql
```

## Vérification

Après l'exécution, vérifiez que les colonnes ont été ajoutées:

### PostgreSQL
```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'devis' 
AND column_name LIKE '%validation%';
```

### MySQL
```sql
DESCRIBE devis;
```

## Rollback (si nécessaire)

Si vous devez annuler la migration:

### PostgreSQL
```sql
ALTER TABLE devis DROP COLUMN IF EXISTS date_validation_interne;
ALTER TABLE devis DROP COLUMN IF EXISTS valide_par_id;
ALTER TABLE devis DROP COLUMN IF EXISTS commentaire_validation_interne;
ALTER TABLE devis DROP COLUMN IF EXISTS validation_interne;
DROP INDEX IF EXISTS idx_validation_interne;
```

### MySQL
```sql
ALTER TABLE devis DROP COLUMN date_validation_interne;
ALTER TABLE devis DROP COLUMN valide_par_id;
ALTER TABLE devis DROP FOREIGN KEY fk_devis_valide_par;
ALTER TABLE devis DROP COLUMN commentaire_validation_interne;
ALTER TABLE devis DROP COLUMN validation_interne;
DROP INDEX idx_validation_interne ON devis;
```

## Notes importantes

- Les migrations sont idempotentes (peuvent être exécutées plusieurs fois sans erreur)
- Les devis existants auront automatiquement le statut `en_attente_validation`
- La migration ne supprime aucune donnée existante
- Compatible avec les bases de données existantes

## Support

En cas de problème, vérifiez:
1. Les permissions de la base de données
2. Que la table `devis` existe
3. Que la table `utilisateurs` existe (pour la clé étrangère)
4. Les logs d'erreur de la base de données

