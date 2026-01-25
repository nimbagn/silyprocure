-- Migration PostgreSQL : Extension de la table liens_externes pour supporter les factures proforma
-- Permet de générer des liens de validation/signature pour les clients
-- Date : 2025-01-17

-- Ajouter les colonnes si elles n'existent pas
DO $$ 
BEGIN
    -- Ajouter facture_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'liens_externes' AND column_name = 'facture_id'
    ) THEN
        ALTER TABLE liens_externes ADD COLUMN facture_id INTEGER NULL;
    END IF;

    -- Ajouter type_lien
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'liens_externes' AND column_name = 'type_lien'
    ) THEN
        ALTER TABLE liens_externes ADD COLUMN type_lien VARCHAR(20) DEFAULT 'rfq' CHECK (type_lien IN ('rfq', 'facture'));
    END IF;

    -- Ajouter client_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'liens_externes' AND column_name = 'client_id'
    ) THEN
        ALTER TABLE liens_externes ADD COLUMN client_id INTEGER NULL;
    END IF;
END $$;

-- Créer les index s'ils n'existent pas
CREATE INDEX IF NOT EXISTS idx_liens_externes_facture_id ON liens_externes(facture_id);
CREATE INDEX IF NOT EXISTS idx_liens_externes_type_lien ON liens_externes(type_lien);
CREATE INDEX IF NOT EXISTS idx_liens_externes_client_id ON liens_externes(client_id);

-- Ajouter les contraintes de clé étrangère si elles n'existent pas
DO $$
BEGIN
    -- Contrainte pour facture_id
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_liens_externes_facture'
    ) THEN
        ALTER TABLE liens_externes 
        ADD CONSTRAINT fk_liens_externes_facture 
        FOREIGN KEY (facture_id) REFERENCES factures(id) ON DELETE CASCADE;
    END IF;

    -- Contrainte pour client_id
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_liens_externes_client'
    ) THEN
        ALTER TABLE liens_externes 
        ADD CONSTRAINT fk_liens_externes_client 
        FOREIGN KEY (client_id) REFERENCES entreprises(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Modifier rfq_id pour qu'il soit nullable
ALTER TABLE liens_externes ALTER COLUMN rfq_id DROP NOT NULL;

-- Modifier fournisseur_id pour qu'il soit nullable (pour les liens de facture on a client_id)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'liens_externes' 
        AND column_name = 'fournisseur_id'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE liens_externes ALTER COLUMN fournisseur_id DROP NOT NULL;
    END IF;
END $$;

SELECT '✅ Migration liens_externes pour factures appliquée avec succès' AS message;

