-- Script pour ajouter la colonne fournisseur_id et autres colonnes manquantes à la table produits
-- À exécuter sur la base de données PostgreSQL existante

-- Ajouter les colonnes si elles n'existent pas
DO $$
BEGIN
    -- Ajouter fournisseur_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'produits' AND column_name = 'fournisseur_id') THEN
        ALTER TABLE produits ADD COLUMN fournisseur_id INTEGER;
    END IF;

    -- Ajouter reference_fournisseur
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'produits' AND column_name = 'reference_fournisseur') THEN
        ALTER TABLE produits ADD COLUMN reference_fournisseur VARCHAR(100);
    END IF;

    -- Ajouter prix_fournisseur
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'produits' AND column_name = 'prix_fournisseur') THEN
        ALTER TABLE produits ADD COLUMN prix_fournisseur DECIMAL(10,2);
    END IF;

    -- Ajouter disponible
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'produits' AND column_name = 'disponible') THEN
        ALTER TABLE produits ADD COLUMN disponible BOOLEAN DEFAULT TRUE;
    END IF;

    -- Ajouter delai_livraison_jours
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'produits' AND column_name = 'delai_livraison_jours') THEN
        ALTER TABLE produits ADD COLUMN delai_livraison_jours INTEGER;
    END IF;

    -- Ajouter quantite_minimale
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'produits' AND column_name = 'quantite_minimale') THEN
        ALTER TABLE produits ADD COLUMN quantite_minimale DECIMAL(10,2);
    END IF;

    -- Ajouter image_url
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'produits' AND column_name = 'image_url') THEN
        ALTER TABLE produits ADD COLUMN image_url VARCHAR(255);
    END IF;

    -- Ajouter caracteristiques_techniques
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'produits' AND column_name = 'caracteristiques_techniques') THEN
        ALTER TABLE produits ADD COLUMN caracteristiques_techniques TEXT;
    END IF;

    -- Ajouter stock_disponible
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'produits' AND column_name = 'stock_disponible') THEN
        ALTER TABLE produits ADD COLUMN stock_disponible DECIMAL(10,2);
    END IF;
END $$;

-- Ajouter la contrainte de clé étrangère si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_produits_fournisseur' 
                   AND table_name = 'produits') THEN
        ALTER TABLE produits 
        ADD CONSTRAINT fk_produits_fournisseur 
        FOREIGN KEY (fournisseur_id) REFERENCES entreprises(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Créer les index s'ils n'existent pas
CREATE INDEX IF NOT EXISTS idx_produits_fournisseur ON produits(fournisseur_id);
CREATE INDEX IF NOT EXISTS idx_produits_fournisseur_reference ON produits(fournisseur_id, reference);

-- Modifier la contrainte UNIQUE sur reference pour permettre les mêmes références pour différents fournisseurs
-- (Supprimer l'ancienne contrainte UNIQUE si elle existe)
DO $$
BEGIN
    -- Supprimer l'index unique sur reference s'il existe
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_produits_reference' AND indexdef LIKE '%UNIQUE%') THEN
        ALTER TABLE produits DROP CONSTRAINT IF EXISTS produits_reference_key;
        DROP INDEX IF EXISTS idx_produits_reference;
    END IF;
    
    -- Recréer l'index sans UNIQUE
    CREATE INDEX IF NOT EXISTS idx_produits_reference ON produits(reference);
END $$;

