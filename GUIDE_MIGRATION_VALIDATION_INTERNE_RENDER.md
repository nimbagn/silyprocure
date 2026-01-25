# Guide : Migration Validation Interne sur Render

## 🚀 Exécution rapide

### Option 1 : Via le script (recommandé)

Sur votre machine locale ou via SSH sur Render :

```bash
cd database
./run_migration_validation_interne_postgresql.sh
```

**Prérequis** : La variable d'environnement `DATABASE_URL` doit être définie.

### Option 2 : Via psql direct

```bash
psql $DATABASE_URL -f database/migration_validation_interne_devis_postgresql.sql
```

### Option 3 : Via l'interface Render

1. Allez dans votre service PostgreSQL sur Render
2. Ouvrez la console SQL (ou utilisez le terminal)
3. Copiez-collez le contenu de `database/migration_validation_interne_devis_postgresql.sql`
4. Exécutez le script

## 📋 Vérification

Après l'exécution, vérifiez que les colonnes ont été ajoutées :

```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'devis' 
AND column_name LIKE '%validation%'
ORDER BY column_name;
```

Vous devriez voir :
- `commentaire_validation_interne`
- `date_validation_interne`
- `valide_par_id`
- `validation_interne`

Et l'index :
```sql
SELECT indexname FROM pg_indexes WHERE tablename = 'devis' AND indexname = 'idx_validation_interne';
```

## ✅ Résultat attendu

- 4 nouvelles colonnes dans la table `devis`
- 1 index créé
- Tous les devis existants auront `validation_interne = 'en_attente_validation'`

## 🔄 Après la migration

1. Redémarrez votre application backend si nécessaire
2. Testez le workflow de validation interne sur `devis-compare.html`
3. Vérifiez que vous pouvez valider des devis et créer des factures proforma

## ⚠️ En cas d'erreur

Si vous obtenez une erreur indiquant que les colonnes existent déjà, c'est normal - la migration est idempotente et peut être exécutée plusieurs fois.

Si vous avez d'autres erreurs, vérifiez :
- Les permissions de la base de données
- Que la table `devis` existe
- Que la table `utilisateurs` existe (pour la clé étrangère)

## 📞 Support

Consultez `database/README_MIGRATION_VALIDATION_INTERNE.md` pour plus de détails.

