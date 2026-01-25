-- Migration PostgreSQL pour ajouter le champ validation_interne dans la table devis
-- Permet de gérer la validation interne des devis fournisseurs avant envoi au client

-- Ajouter la colonne validation_interne si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'devis' AND column_name = 'validation_interne'
    ) THEN
        ALTER TABLE devis 
        ADD COLUMN validation_interne VARCHAR(30) DEFAULT 'en_attente_validation' 
        CHECK (validation_interne IN ('en_attente_validation', 'valide_interne', 'refuse_interne'));
        
        COMMENT ON COLUMN devis.validation_interne IS 'Statut de validation interne du devis par l''équipe';
    END IF;
END $$;

-- Ajouter la colonne commentaire_validation_interne si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'devis' AND column_name = 'commentaire_validation_interne'
    ) THEN
        ALTER TABLE devis 
        ADD COLUMN commentaire_validation_interne TEXT;
        
        COMMENT ON COLUMN devis.commentaire_validation_interne IS 'Commentaires de l''équipe lors de la validation interne';
    END IF;
END $$;

-- Ajouter la colonne valide_par_id si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'devis' AND column_name = 'valide_par_id'
    ) THEN
        ALTER TABLE devis 
        ADD COLUMN valide_par_id INTEGER;
        
        ALTER TABLE devis 
        ADD CONSTRAINT fk_devis_valide_par 
        FOREIGN KEY (valide_par_id) REFERENCES utilisateurs(id) ON DELETE SET NULL;
        
        COMMENT ON COLUMN devis.valide_par_id IS 'ID de l''utilisateur qui a validé le devis en interne';
    END IF;
END $$;

-- Ajouter la colonne date_validation_interne si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'devis' AND column_name = 'date_validation_interne'
    ) THEN
        ALTER TABLE devis 
        ADD COLUMN date_validation_interne TIMESTAMP;
        
        COMMENT ON COLUMN devis.date_validation_interne IS 'Date de validation interne du devis';
    END IF;
END $$;

-- Créer l'index si il n'existe pas
CREATE INDEX IF NOT EXISTS idx_validation_interne ON devis(validation_interne);

