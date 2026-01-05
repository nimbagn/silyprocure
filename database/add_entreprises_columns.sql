-- =====================================================
-- Migration : Ajout des colonnes manquantes à la table entreprises
-- Compatibilité avec le code existant
-- =====================================================

-- Ajouter la colonne rccm si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'entreprises' AND column_name = 'rccm'
    ) THEN
        ALTER TABLE entreprises ADD COLUMN rccm VARCHAR(50);
        RAISE NOTICE 'Colonne rccm ajoutée à la table entreprises';
    END IF;
END $$;

-- Ajouter la colonne numero_contribuable si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'entreprises' AND column_name = 'numero_contribuable'
    ) THEN
        ALTER TABLE entreprises ADD COLUMN numero_contribuable VARCHAR(50);
        RAISE NOTICE 'Colonne numero_contribuable ajoutée à la table entreprises';
    END IF;
END $$;

-- Ajouter la colonne capital_social si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'entreprises' AND column_name = 'capital_social'
    ) THEN
        ALTER TABLE entreprises ADD COLUMN capital_social DECIMAL(15, 2);
        RAISE NOTICE 'Colonne capital_social ajoutée à la table entreprises';
    END IF;
END $$;

-- Ajouter la colonne forme_juridique si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'entreprises' AND column_name = 'forme_juridique'
    ) THEN
        ALTER TABLE entreprises ADD COLUMN forme_juridique VARCHAR(50);
        RAISE NOTICE 'Colonne forme_juridique ajoutée à la table entreprises';
    END IF;
END $$;

-- Ajouter la colonne secteur_activite si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'entreprises' AND column_name = 'secteur_activite'
    ) THEN
        ALTER TABLE entreprises ADD COLUMN secteur_activite VARCHAR(100);
        RAISE NOTICE 'Colonne secteur_activite ajoutée à la table entreprises';
    END IF;
END $$;

