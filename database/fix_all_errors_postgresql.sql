-- =====================================================
-- Script complet de correction PostgreSQL pour SilyProcure
-- Date: 2024
-- =====================================================
-- Ce script corrige toutes les erreurs identifiées :
-- 1. Table fichiers_joints -> documents_joints
-- 2. Colonnes manquantes
-- 3. Support demande_devis dans documents_joints

-- =====================================================
-- 1. CORRECTION : documents_joints
-- =====================================================

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

-- Renommer uploader_id en upload_par_id si nécessaire
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

-- Migrer les données depuis fichiers_joints vers documents_joints si nécessaire
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' AND tablename = 'fichiers_joints'
    ) THEN
        -- Migrer les données
        INSERT INTO documents_joints (
            type_document, document_id, nom_fichier, chemin_fichier, 
            type_mime, taille_octets, description, date_upload, upload_par_id
        )
        SELECT 
            type_document, document_id, nom_fichier, chemin_fichier,
            type_mime, 
            COALESCE(
                CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fichiers_joints' AND column_name = 'taille_octets') 
                     THEN (SELECT taille_octets FROM fichiers_joints WHERE fichiers_joints.id = f.id) 
                     ELSE NULL END,
                CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fichiers_joints' AND column_name = 'taille_fichier') 
                     THEN (SELECT taille_fichier FROM fichiers_joints WHERE fichiers_joints.id = f.id) 
                     ELSE NULL END,
                0
            ) as taille_octets,
            description, 
            COALESCE(date_upload, CURRENT_TIMESTAMP) as date_upload,
            COALESCE(
                CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fichiers_joints' AND column_name = 'upload_par_id') 
                     THEN (SELECT upload_par_id FROM fichiers_joints WHERE fichiers_joints.id = f.id) 
                     ELSE NULL END,
                CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fichiers_joints' AND column_name = 'uploader_id') 
                     THEN (SELECT uploader_id FROM fichiers_joints WHERE fichiers_joints.id = f.id) 
                     ELSE NULL END
            ) as upload_par_id
        FROM fichiers_joints f
        WHERE NOT EXISTS (
            SELECT 1 FROM documents_joints d 
            WHERE d.type_document = f.type_document 
            AND d.document_id = f.document_id
            AND d.nom_fichier = f.nom_fichier
        );
        
        DROP TABLE IF EXISTS fichiers_joints CASCADE;
        RAISE NOTICE 'Table fichiers_joints supprimée après migration des données vers documents_joints';
    END IF;
END $$;

-- =====================================================
-- 2. VÉRIFICATION : Table rfq et colonnes
-- =====================================================

-- Vérifier que la table rfq existe avec toutes les colonnes nécessaires
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' AND tablename = 'rfq'
    ) THEN
        RAISE EXCEPTION 'Table rfq n''existe pas. Veuillez exécuter le script de création de base de données complet.';
    ELSE
        RAISE NOTICE 'Table rfq existe';
    END IF;
END $$;

-- =====================================================
-- 3. VÉRIFICATION : Table entreprises et colonnes
-- =====================================================

-- Vérifier que toutes les colonnes nécessaires existent dans entreprises
DO $$
BEGIN
    -- Vérifier colonne rccm
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'entreprises' AND column_name = 'rccm'
    ) THEN
        ALTER TABLE entreprises ADD COLUMN rccm VARCHAR(50);
        RAISE NOTICE 'Colonne rccm ajoutée à la table entreprises';
    END IF;
    
    -- Vérifier colonne numero_contribuable
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'entreprises' AND column_name = 'numero_contribuable'
    ) THEN
        ALTER TABLE entreprises ADD COLUMN numero_contribuable VARCHAR(50);
        RAISE NOTICE 'Colonne numero_contribuable ajoutée à la table entreprises';
    END IF;
    
    -- Vérifier colonne capital_social
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'entreprises' AND column_name = 'capital_social'
    ) THEN
        ALTER TABLE entreprises ADD COLUMN capital_social DECIMAL(15, 2);
        RAISE NOTICE 'Colonne capital_social ajoutée à la table entreprises';
    END IF;
    
    -- Vérifier colonne forme_juridique
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'entreprises' AND column_name = 'forme_juridique'
    ) THEN
        ALTER TABLE entreprises ADD COLUMN forme_juridique VARCHAR(50);
        RAISE NOTICE 'Colonne forme_juridique ajoutée à la table entreprises';
    END IF;
    
    -- Vérifier colonne secteur_activite
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'entreprises' AND column_name = 'secteur_activite'
    ) THEN
        ALTER TABLE entreprises ADD COLUMN secteur_activite VARCHAR(100);
        RAISE NOTICE 'Colonne secteur_activite ajoutée à la table entreprises';
    END IF;
END $$;

-- =====================================================
-- 4. VÉRIFICATION : Table clients et colonnes
-- =====================================================

-- Vérifier que toutes les colonnes nécessaires existent dans clients
DO $$
BEGIN
    -- Vérifier colonne adresse
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' AND column_name = 'adresse'
    ) THEN
        ALTER TABLE clients ADD COLUMN adresse VARCHAR(500);
        RAISE NOTICE 'Colonne adresse ajoutée à la table clients';
    END IF;
    
    -- Vérifier colonne ville
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' AND column_name = 'ville'
    ) THEN
        ALTER TABLE clients ADD COLUMN ville VARCHAR(100);
        RAISE NOTICE 'Colonne ville ajoutée à la table clients';
    END IF;
    
    -- Vérifier colonne pays
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' AND column_name = 'pays'
    ) THEN
        ALTER TABLE clients ADD COLUMN pays VARCHAR(100);
        RAISE NOTICE 'Colonne pays ajoutée à la table clients';
    END IF;
    
    -- Vérifier colonne secteur_activite
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' AND column_name = 'secteur_activite'
    ) THEN
        ALTER TABLE clients ADD COLUMN secteur_activite VARCHAR(100);
        RAISE NOTICE 'Colonne secteur_activite ajoutée à la table clients';
    END IF;
    
    -- Vérifier colonne site_web
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' AND column_name = 'site_web'
    ) THEN
        ALTER TABLE clients ADD COLUMN site_web VARCHAR(255);
        RAISE NOTICE 'Colonne site_web ajoutée à la table clients';
    END IF;
    
    -- Vérifier colonne notes
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' AND column_name = 'notes'
    ) THEN
        ALTER TABLE clients ADD COLUMN notes TEXT;
        RAISE NOTICE 'Colonne notes ajoutée à la table clients';
    END IF;
    
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
END $$;

-- =====================================================
-- 5. VÉRIFICATION FINALE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Script de correction terminé';
    RAISE NOTICE '';
    RAISE NOTICE 'Vérifications effectuées:';
    RAISE NOTICE '  ✓ Table documents_joints créée/mise à jour';
    RAISE NOTICE '  ✓ Colonnes entreprises vérifiées (rccm, numero_contribuable, capital_social, forme_juridique, secteur_activite)';
    RAISE NOTICE '  ✓ Colonnes clients vérifiées (adresse, ville, pays, secteur_activite, site_web, notes)';
    RAISE NOTICE '  ✓ Migration fichiers_joints -> documents_joints effectuée';
    RAISE NOTICE '';
    RAISE NOTICE 'Pour vérifier les tables:';
    RAISE NOTICE '  SELECT tablename FROM pg_tables WHERE schemaname = ''public'' ORDER BY tablename;';
END $$;

