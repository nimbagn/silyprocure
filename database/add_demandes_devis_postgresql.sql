-- =====================================================
-- Migration : Création de la table demandes_devis pour PostgreSQL
-- Cette table stocke les demandes de devis depuis la page d'accueil publique
-- =====================================================

-- Créer la table demandes_devis
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

-- Créer les index
CREATE INDEX IF NOT EXISTS idx_demandes_devis_statut ON demandes_devis(statut);
CREATE INDEX IF NOT EXISTS idx_demandes_devis_date_creation ON demandes_devis(date_creation);
CREATE INDEX IF NOT EXISTS idx_demandes_devis_email ON demandes_devis(email);
CREATE INDEX IF NOT EXISTS idx_demandes_devis_reference ON demandes_devis(reference);
CREATE INDEX IF NOT EXISTS idx_demandes_devis_token_suivi ON demandes_devis(token_suivi);
CREATE INDEX IF NOT EXISTS idx_demandes_devis_client_id ON demandes_devis(client_id);

-- Trigger pour mettre à jour date_modification automatiquement
CREATE TRIGGER update_demandes_devis_modtime BEFORE UPDATE ON demandes_devis
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- =====================================================
-- TABLE : demandes_devis_lignes
-- Lignes d'articles des demandes de devis
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
-- Vérification de l'existence de la table clients
-- Si elle n'existe pas, on crée une table clients simple
-- =====================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'clients') THEN
        CREATE TABLE clients (
            id SERIAL PRIMARY KEY,
            nom VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE,
            telephone VARCHAR(50),
            entreprise VARCHAR(255),
            adresse_livraison TEXT,
            ville_livraison VARCHAR(255),
            pays_livraison VARCHAR(100) DEFAULT 'Guinée',
            statut VARCHAR(20) DEFAULT 'prospect' CHECK (statut IN ('prospect', 'actif', 'inactif')),
            nombre_demandes INTEGER DEFAULT 0,
            date_derniere_demande TIMESTAMP,
            date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
        CREATE INDEX IF NOT EXISTS idx_clients_statut ON clients(statut);
        
        CREATE TRIGGER update_clients_modtime BEFORE UPDATE ON clients
            FOR EACH ROW EXECUTE FUNCTION update_modified_column();
    END IF;
END $$;

