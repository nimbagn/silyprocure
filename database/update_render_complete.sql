-- =====================================================
-- Script de mise à jour complète pour Render PostgreSQL
-- Ce script peut être exécuté plusieurs fois sans erreur (idempotent)
-- Date: 2024
-- =====================================================

-- Extension pour UUID (si nécessaire)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================
-- Fonction pour mettre à jour automatiquement date_modification
-- =====================================================
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.date_modification = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- TABLE : clients (si elle n'existe pas)
-- =====================================================
CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    telephone VARCHAR(50),
    entreprise VARCHAR(255),
    adresse VARCHAR(500),
    ville VARCHAR(100),
    pays VARCHAR(100),
    secteur_activite VARCHAR(100),
    site_web VARCHAR(255),
    notes TEXT,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_derniere_demande TIMESTAMP,
    nombre_demandes INTEGER DEFAULT 0,
    statut VARCHAR(20) DEFAULT 'prospect' CHECK (statut IN ('actif', 'inactif', 'prospect'))
);

-- Index pour clients
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_entreprise ON clients(entreprise);
CREATE INDEX IF NOT EXISTS idx_clients_statut ON clients(statut);
CREATE INDEX IF NOT EXISTS idx_clients_date_derniere_demande ON clients(date_derniere_demande);

-- Trigger pour clients
DROP TRIGGER IF EXISTS update_clients_modtime ON clients;
CREATE TRIGGER update_clients_modtime BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- =====================================================
-- TABLE : demandes_devis
-- =====================================================
CREATE TABLE IF NOT EXISTS demandes_devis (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    telephone VARCHAR(50),
    entreprise VARCHAR(255),
    service VARCHAR(100),
    message TEXT,
    statut VARCHAR(20) DEFAULT 'nouvelle' CHECK (statut IN ('nouvelle', 'en_cours', 'traitee', 'annulee')),
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    traite_par INTEGER,
    notes_internes TEXT,
    -- Colonnes pour le tracking
    reference VARCHAR(50) UNIQUE,
    token_suivi VARCHAR(100) UNIQUE,
    mode_notification VARCHAR(20) DEFAULT 'email' CHECK (mode_notification IN ('email', 'sms', 'whatsapp')),
    notification_envoyee BOOLEAN DEFAULT FALSE,
    -- Colonnes pour la géolocalisation
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    -- Colonnes pour l'adresse de livraison
    adresse_livraison TEXT,
    ville_livraison VARCHAR(255),
    pays_livraison VARCHAR(100) DEFAULT 'Guinée',
    -- Colonne pour lier à la table clients
    client_id INTEGER,
    CONSTRAINT fk_demandes_devis_traite_par FOREIGN KEY (traite_par) REFERENCES utilisateurs(id) ON DELETE SET NULL,
    CONSTRAINT fk_demandes_devis_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
);

-- Index pour demandes_devis
CREATE INDEX IF NOT EXISTS idx_demandes_devis_statut ON demandes_devis(statut);
CREATE INDEX IF NOT EXISTS idx_demandes_devis_date_creation ON demandes_devis(date_creation);
CREATE INDEX IF NOT EXISTS idx_demandes_devis_email ON demandes_devis(email);
CREATE INDEX IF NOT EXISTS idx_demandes_devis_reference ON demandes_devis(reference);
CREATE INDEX IF NOT EXISTS idx_demandes_devis_token_suivi ON demandes_devis(token_suivi);
CREATE INDEX IF NOT EXISTS idx_demandes_devis_client_id ON demandes_devis(client_id);
CREATE INDEX IF NOT EXISTS idx_demandes_devis_geoloc ON demandes_devis(latitude, longitude);

-- Trigger pour demandes_devis
DROP TRIGGER IF EXISTS update_demandes_devis_modtime ON demandes_devis;
CREATE TRIGGER update_demandes_devis_modtime BEFORE UPDATE ON demandes_devis
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- =====================================================
-- TABLE : demandes_devis_lignes
-- =====================================================
CREATE TABLE IF NOT EXISTS demandes_devis_lignes (
    id SERIAL PRIMARY KEY,
    demande_devis_id INTEGER NOT NULL,
    description VARCHAR(500) NOT NULL,
    secteur VARCHAR(100),
    quantite DECIMAL(10,2) NOT NULL DEFAULT 1.00,
    unite VARCHAR(50) DEFAULT 'unité',
    ordre INTEGER DEFAULT 0,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_demandes_devis_lignes_demande FOREIGN KEY (demande_devis_id) REFERENCES demandes_devis(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_demandes_devis_lignes_demande ON demandes_devis_lignes(demande_devis_id);
CREATE INDEX IF NOT EXISTS idx_demandes_devis_lignes_secteur ON demandes_devis_lignes(secteur);

-- =====================================================
-- Ajouter colonnes manquantes à demandes_devis si elles n'existent pas
-- =====================================================
DO $$
BEGIN
    -- Ajouter client_id si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'demandes_devis' AND column_name = 'client_id') THEN
        ALTER TABLE demandes_devis ADD COLUMN client_id INTEGER;
        ALTER TABLE demandes_devis ADD CONSTRAINT fk_demandes_devis_client 
            FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_demandes_devis_client_id ON demandes_devis(client_id);
    END IF;
    
    -- Ajouter reference si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'demandes_devis' AND column_name = 'reference') THEN
        ALTER TABLE demandes_devis ADD COLUMN reference VARCHAR(50) UNIQUE;
        CREATE INDEX IF NOT EXISTS idx_demandes_devis_reference ON demandes_devis(reference);
    END IF;
    
    -- Ajouter token_suivi si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'demandes_devis' AND column_name = 'token_suivi') THEN
        ALTER TABLE demandes_devis ADD COLUMN token_suivi VARCHAR(100) UNIQUE;
        CREATE INDEX IF NOT EXISTS idx_demandes_devis_token_suivi ON demandes_devis(token_suivi);
    END IF;
    
    -- Ajouter mode_notification si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'demandes_devis' AND column_name = 'mode_notification') THEN
        ALTER TABLE demandes_devis ADD COLUMN mode_notification VARCHAR(20) DEFAULT 'email';
        ALTER TABLE demandes_devis ADD CONSTRAINT chk_mode_notification 
            CHECK (mode_notification IN ('email', 'sms', 'whatsapp'));
    END IF;
    
    -- Ajouter notification_envoyee si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'demandes_devis' AND column_name = 'notification_envoyee') THEN
        ALTER TABLE demandes_devis ADD COLUMN notification_envoyee BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Ajouter latitude si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'demandes_devis' AND column_name = 'latitude') THEN
        ALTER TABLE demandes_devis ADD COLUMN latitude DECIMAL(10, 8);
    END IF;
    
    -- Ajouter longitude si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'demandes_devis' AND column_name = 'longitude') THEN
        ALTER TABLE demandes_devis ADD COLUMN longitude DECIMAL(11, 8);
    END IF;
    
    -- Ajouter adresse_livraison si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'demandes_devis' AND column_name = 'adresse_livraison') THEN
        ALTER TABLE demandes_devis ADD COLUMN adresse_livraison TEXT;
    END IF;
    
    -- Ajouter ville_livraison si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'demandes_devis' AND column_name = 'ville_livraison') THEN
        ALTER TABLE demandes_devis ADD COLUMN ville_livraison VARCHAR(255);
    END IF;
    
    -- Ajouter pays_livraison si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'demandes_devis' AND column_name = 'pays_livraison') THEN
        ALTER TABLE demandes_devis ADD COLUMN pays_livraison VARCHAR(100) DEFAULT 'Guinée';
    END IF;
END $$;

-- =====================================================
-- Ajouter demande_devis_id dans devis si elle n'existe pas
-- =====================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'devis') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'devis' AND column_name = 'demande_devis_id') THEN
            ALTER TABLE devis ADD COLUMN demande_devis_id INTEGER;
            ALTER TABLE devis ADD CONSTRAINT fk_devis_demande_devis 
                FOREIGN KEY (demande_devis_id) REFERENCES demandes_devis(id) ON DELETE SET NULL;
            CREATE INDEX IF NOT EXISTS idx_devis_demande_devis_id ON devis(demande_devis_id);
        END IF;
    END IF;
END $$;

-- =====================================================
-- Ajouter demande_devis_id dans commandes si elle n'existe pas
-- =====================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'commandes') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'commandes' AND column_name = 'demande_devis_id') THEN
            ALTER TABLE commandes ADD COLUMN demande_devis_id INTEGER;
            ALTER TABLE commandes ADD CONSTRAINT fk_commande_demande_devis 
                FOREIGN KEY (demande_devis_id) REFERENCES demandes_devis(id) ON DELETE SET NULL;
            CREATE INDEX IF NOT EXISTS idx_commande_demande_devis_id ON commandes(demande_devis_id);
        END IF;
    END IF;
END $$;

-- =====================================================
-- Vérifier et créer la table messages_contact si nécessaire
-- =====================================================
CREATE TABLE IF NOT EXISTS messages_contact (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    telephone VARCHAR(50),
    sujet VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    lu BOOLEAN DEFAULT FALSE,
    traite BOOLEAN DEFAULT FALSE,
    traite_par INTEGER,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_messages_contact_traite_par FOREIGN KEY (traite_par) REFERENCES utilisateurs(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_contact_lu ON messages_contact(lu);
CREATE INDEX IF NOT EXISTS idx_messages_contact_traite ON messages_contact(traite);
CREATE INDEX IF NOT EXISTS idx_messages_contact_date_creation ON messages_contact(date_creation);

DROP TRIGGER IF EXISTS update_messages_contact_modtime ON messages_contact;
CREATE TRIGGER update_messages_contact_modtime BEFORE UPDATE ON messages_contact
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- =====================================================
-- Vérifier que toutes les tables principales existent
-- =====================================================
DO $$
DECLARE
    missing_tables TEXT[] := ARRAY[]::TEXT[];
    tbl_name TEXT;
BEGIN
    -- Liste des tables essentielles
    FOR tbl_name IN 
        SELECT unnest(ARRAY[
            'utilisateurs',
            'entreprises',
            'produits',
            'rfq',
            'rfq_lignes',
            'devis',
            'devis_lignes',
            'commandes',
            'commande_lignes',
            'factures',
            'facture_lignes',
            'paiements',
            'notifications'
        ])
    LOOP
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables t
                       WHERE t.table_schema = 'public' AND t.table_name = tbl_name) THEN
            missing_tables := array_append(missing_tables, tbl_name);
        END IF;
    END LOOP;
    
    IF array_length(missing_tables, 1) > 0 THEN
        RAISE NOTICE '⚠️  Tables manquantes détectées: %', array_to_string(missing_tables, ', ');
        RAISE NOTICE '💡 Exécutez d''abord silypro_create_database_postgresql.sql pour créer toutes les tables';
    ELSE
        RAISE NOTICE '✅ Toutes les tables principales existent';
    END IF;
END $$;

-- =====================================================
-- Message de fin
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Mise à jour complète terminée avec succès!';
    RAISE NOTICE '📋 Tables vérifiées/créées: clients, demandes_devis, demandes_devis_lignes, messages_contact';
    RAISE NOTICE '🔗 Liens ajoutés: devis.demande_devis_id, commandes.demande_devis_id';
END $$;

