# Migration : Ajout de fournisseur_id à la table produits

## Problème

La table `produits` dans PostgreSQL ne contient pas la colonne `fournisseur_id`, ce qui cause des erreurs SQL :
- `column p.fournisseur_id does not exist`
- `syntax error at or near "("`

## Solution

Exécutez le script SQL suivant sur votre base de données PostgreSQL (Render) :

### Sur Render (via Shell)

```bash
psql $DATABASE_URL -f database/add_fournisseur_id_to_produits.sql
```

### Ou manuellement

```sql
-- Ajouter les colonnes manquantes
ALTER TABLE produits ADD COLUMN IF NOT EXISTS fournisseur_id INTEGER;
ALTER TABLE produits ADD COLUMN IF NOT EXISTS reference_fournisseur VARCHAR(100);
ALTER TABLE produits ADD COLUMN IF NOT EXISTS prix_fournisseur DECIMAL(10,2);
ALTER TABLE produits ADD COLUMN IF NOT EXISTS disponible BOOLEAN DEFAULT TRUE;
ALTER TABLE produits ADD COLUMN IF NOT EXISTS delai_livraison_jours INTEGER;
ALTER TABLE produits ADD COLUMN IF NOT EXISTS quantite_minimale DECIMAL(10,2);
ALTER TABLE produits ADD COLUMN IF NOT EXISTS image_url VARCHAR(255);
ALTER TABLE produits ADD COLUMN IF NOT EXISTS caracteristiques_techniques TEXT;
ALTER TABLE produits ADD COLUMN IF NOT EXISTS stock_disponible DECIMAL(10,2);

-- Ajouter la contrainte de clé étrangère
ALTER TABLE produits 
ADD CONSTRAINT fk_produits_fournisseur 
FOREIGN KEY (fournisseur_id) REFERENCES entreprises(id) ON DELETE CASCADE;

-- Créer les index
CREATE INDEX IF NOT EXISTS idx_produits_fournisseur ON produits(fournisseur_id);
CREATE INDEX IF NOT EXISTS idx_produits_fournisseur_reference ON produits(fournisseur_id, reference);
```

## Vérification

Après exécution, vérifiez que les colonnes existent :

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'produits' 
AND column_name IN ('fournisseur_id', 'reference_fournisseur', 'disponible');
```

## Notes

- Les colonnes `fournisseur_id` peuvent être NULL (produits génériques)
- Les produits avec `fournisseur_id` sont spécifiques à un fournisseur
- La référence peut être la même pour différents fournisseurs, mais unique par fournisseur

