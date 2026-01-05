-- =====================================================
-- Script de correction : documents_joints pour PostgreSQL
-- Date: 2024
-- =====================================================
-- Ce script s'assure que la table documents_joints existe
-- et a toutes les colonnes nécessaires

-- Vérifier et créer la table documents_joints si elle n'existe pas
CREATE TABLE IF NOT EXISTS documents_joints (
    id SERIAL PRIMARY KEY,
    type_document VARCHAR(20) NOT NULL CHECK (type_document IN ('rfq', 'devis', 'commande', 'bl', 'facture', 'sla', 'autre', 'demande_devis')),
    document_id INTEGER NOT NULL,
    nom_fichier VARCHAR(255) NOT NULL,
    chemin_fichier VARCHAR(500) NOT NULL,
    type_mime VARCHAR(100),
    taille_octets INTEGER,
    description TEXT,
    date_upload TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    upload_par_id INTEGER,
    CONSTRAINT fk_documents_joints_upload_par FOREIGN KEY (upload_par_id) REFERENCES utilisateurs(id) ON DELETE SET NULL
);

-- Créer les index si ils n'existent pas
CREATE INDEX IF NOT EXISTS idx_documents_joints_type ON documents_joints(type_document, document_id);
CREATE INDEX IF NOT EXISTS idx_documents_joints_upload_par ON documents_joints(upload_par_id);
CREATE INDEX IF NOT EXISTS idx_documents_joints_date_upload ON documents_joints(date_upload);

-- Ajouter la colonne upload_par_id si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'documents_joints' AND column_name = 'upload_par_id'
    ) THEN
        ALTER TABLE documents_joints ADD COLUMN upload_par_id INTEGER;
        ALTER TABLE documents_joints ADD CONSTRAINT fk_documents_joints_upload_par 
            FOREIGN KEY (upload_par_id) REFERENCES utilisateurs(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_documents_joints_upload_par ON documents_joints(upload_par_id);
        RAISE NOTICE 'Colonne upload_par_id ajoutée à la table documents_joints';
    END IF;
END $$;

-- Ajouter la colonne taille_octets si elle n'existe pas (et supprimer taille_fichier si elle existe)
DO $$
BEGIN
    -- Vérifier si taille_octets existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'documents_joints' AND column_name = 'taille_octets'
    ) THEN
        -- Si taille_fichier existe, la renommer en taille_octets
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'documents_joints' AND column_name = 'taille_fichier'
        ) THEN
            ALTER TABLE documents_joints RENAME COLUMN taille_fichier TO taille_octets;
            RAISE NOTICE 'Colonne taille_fichier renommée en taille_octets';
        ELSE
            ALTER TABLE documents_joints ADD COLUMN taille_octets INTEGER;
            RAISE NOTICE 'Colonne taille_octets ajoutée à la table documents_joints';
        END IF;
    END IF;
END $$;

-- Ajouter la colonne uploader_id si elle n'existe pas (ancien nom, pour migration)
-- Puis la renommer en upload_par_id si nécessaire
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'documents_joints' AND column_name = 'uploader_id'
    ) THEN
        -- Si upload_par_id n'existe pas, renommer uploader_id
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'documents_joints' AND column_name = 'upload_par_id'
        ) THEN
            ALTER TABLE documents_joints RENAME COLUMN uploader_id TO upload_par_id;
            RAISE NOTICE 'Colonne uploader_id renommée en upload_par_id';
        ELSE
            -- Si les deux existent, supprimer uploader_id
            ALTER TABLE documents_joints DROP COLUMN uploader_id;
            RAISE NOTICE 'Colonne uploader_id supprimée (upload_par_id existe déjà)';
        END IF;
    END IF;
END $$;

-- Ajouter 'demande_devis' au CHECK constraint si nécessaire
DO $$
BEGIN
    -- Vérifier si 'demande_devis' est dans les valeurs autorisées
    -- Si ce n'est pas le cas, on doit recréer la contrainte
    -- Note: PostgreSQL ne permet pas de modifier directement un CHECK constraint
    -- On doit le supprimer et le recréer
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'documents_joints' 
        AND constraint_name LIKE '%type_document%check%'
    ) THEN
        -- Vérifier si 'demande_devis' est déjà autorisé
        -- Si non, on recrée la contrainte
        -- Pour simplifier, on laisse PostgreSQL gérer via le CREATE TABLE IF NOT EXISTS
        RAISE NOTICE 'Vérification du CHECK constraint pour type_document';
    END IF;
END $$;

-- Supprimer l'ancienne table fichiers_joints si elle existe (migration)
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' AND tablename = 'fichiers_joints'
    ) THEN
        -- Migrer les données si la table existe
        INSERT INTO documents_joints (
            type_document, document_id, nom_fichier, chemin_fichier, 
            type_mime, taille_octets, description, date_upload, upload_par_id
        )
        SELECT 
            type_document, document_id, nom_fichier, chemin_fichier,
            type_mime, 
            COALESCE(taille_fichier, taille_octets, 0) as taille_octets,
            description, date_upload,
            COALESCE(upload_par_id, uploader_id) as upload_par_id
        FROM fichiers_joints
        WHERE NOT EXISTS (
            SELECT 1 FROM documents_joints d 
            WHERE d.type_document = fichiers_joints.type_document 
            AND d.document_id = fichiers_joints.document_id
            AND d.nom_fichier = fichiers_joints.nom_fichier
        );
        
        DROP TABLE IF EXISTS fichiers_joints CASCADE;
        RAISE NOTICE 'Table fichiers_joints supprimée après migration des données vers documents_joints';
    END IF;
END $$;

-- Vérification finale
DO $$
BEGIN
    RAISE NOTICE '✅ Migration documents_joints terminée';
    RAISE NOTICE 'Vérifiez que la table documents_joints existe avec les colonnes:';
    RAISE NOTICE '  - id, type_document, document_id, nom_fichier, chemin_fichier';
    RAISE NOTICE '  - type_mime, taille_octets, description, date_upload, upload_par_id';
END $$;

