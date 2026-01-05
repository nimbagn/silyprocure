-- =====================================================
-- Migration : Ajout des colonnes adresse, ville, pays à la table clients
-- Compatibilité avec le code existant
-- =====================================================

-- Ajouter la colonne adresse si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' AND column_name = 'adresse'
    ) THEN
        ALTER TABLE clients ADD COLUMN adresse VARCHAR(500);
        RAISE NOTICE 'Colonne adresse ajoutée à la table clients';
    END IF;
END $$;

-- Ajouter la colonne ville si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' AND column_name = 'ville'
    ) THEN
        ALTER TABLE clients ADD COLUMN ville VARCHAR(100);
        RAISE NOTICE 'Colonne ville ajoutée à la table clients';
    END IF;
END $$;

-- Ajouter la colonne pays si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' AND column_name = 'pays'
    ) THEN
        ALTER TABLE clients ADD COLUMN pays VARCHAR(100);
        RAISE NOTICE 'Colonne pays ajoutée à la table clients';
    END IF;
END $$;

-- Copier les données de adresse_livraison vers adresse si adresse est NULL
UPDATE clients 
SET adresse = adresse_livraison 
WHERE adresse IS NULL AND adresse_livraison IS NOT NULL;

-- Copier les données de ville_livraison vers ville si ville est NULL
UPDATE clients 
SET ville = ville_livraison 
WHERE ville IS NULL AND ville_livraison IS NOT NULL;

-- Copier les données de pays_livraison vers pays si pays est NULL
UPDATE clients 
SET pays = pays_livraison 
WHERE pays IS NULL AND pays_livraison IS NOT NULL;

-- Ajouter les colonnes supplémentaires si elles n'existent pas (pour compatibilité complète)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' AND column_name = 'secteur_activite'
    ) THEN
        ALTER TABLE clients ADD COLUMN secteur_activite VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' AND column_name = 'site_web'
    ) THEN
        ALTER TABLE clients ADD COLUMN site_web VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' AND column_name = 'notes'
    ) THEN
        ALTER TABLE clients ADD COLUMN notes TEXT;
    END IF;
END $$;

