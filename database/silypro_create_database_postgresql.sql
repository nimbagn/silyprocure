-- =====================================================
-- SilyProcure - Script de création de la base de données PostgreSQL
-- Base de données : silypro
-- Utilisateur : soul
-- Mot de passe : Satina2025
-- Moteur : PostgreSQL 12+
-- =====================================================

-- Suppression de la base de données si elle existe
DROP DATABASE IF EXISTS silypro;

-- Création de la base de données
CREATE DATABASE silypro 
    WITH 
    OWNER = soul
    ENCODING = 'UTF8'
    LC_COLLATE = 'fr_FR.UTF-8'
    LC_CTYPE = 'fr_FR.UTF-8'
    TEMPLATE = template0;

-- Connexion à la base de données
\c silypro

-- Extension pour UUID (si nécessaire)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Extension pour les fonctions de texte (si nécessaire)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================
-- CRÉATION DE L'UTILISATEUR ET DES PERMISSIONS
-- =====================================================

-- Création de l'utilisateur (à exécuter en tant que superutilisateur)
-- CREATE USER soul WITH PASSWORD 'Satina2025';
-- GRANT ALL PRIVILEGES ON DATABASE silypro TO soul;
-- \c silypro
-- GRANT ALL ON SCHEMA public TO soul;

-- =====================================================
-- TABLE : utilisateurs
-- Gestion des utilisateurs du système
-- =====================================================
CREATE TABLE utilisateurs (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    mot_de_passe VARCHAR(255) NOT NULL,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    telephone VARCHAR(20),
    fonction VARCHAR(100),
    departement VARCHAR(100),
    role VARCHAR(20) CHECK (role IN ('admin', 'superviseur', 'acheteur', 'approbateur', 'comptable', 'viewer')) DEFAULT 'viewer',
    actif BOOLEAN DEFAULT TRUE,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    derniere_connexion TIMESTAMP,
    CONSTRAINT chk_role CHECK (role IN ('admin', 'superviseur', 'acheteur', 'approbateur', 'comptable', 'viewer'))
);

CREATE INDEX idx_utilisateurs_email ON utilisateurs(email);
CREATE INDEX idx_utilisateurs_role ON utilisateurs(role);

-- Trigger pour mettre à jour date_modification automatiquement
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.date_modification = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_utilisateurs_modtime BEFORE UPDATE ON utilisateurs
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- =====================================================
-- TABLE : entreprises
-- Informations sur les entreprises (acheteurs, fournisseurs, clients)
-- =====================================================
CREATE TABLE entreprises (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    raison_sociale VARCHAR(255),
    siret VARCHAR(14) UNIQUE,
    tva_intracommunautaire VARCHAR(20),
    type_entreprise VARCHAR(20) NOT NULL CHECK (type_entreprise IN ('acheteur', 'fournisseur', 'client', 'transporteur')),
    email VARCHAR(255),
    telephone VARCHAR(20),
    site_web VARCHAR(255),
    logo_url VARCHAR(512),
    actif BOOLEAN DEFAULT TRUE,
    notes TEXT,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_entreprises_nom ON entreprises(nom);
CREATE INDEX idx_entreprises_siret ON entreprises(siret);
CREATE INDEX idx_entreprises_type ON entreprises(type_entreprise);

CREATE TRIGGER update_entreprises_modtime BEFORE UPDATE ON entreprises
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- =====================================================
-- TABLE : adresses
-- Adresses des entreprises
-- =====================================================
CREATE TABLE adresses (
    id SERIAL PRIMARY KEY,
    entreprise_id INTEGER NOT NULL,
    type_adresse VARCHAR(20) DEFAULT 'siege' CHECK (type_adresse IN ('siege', 'facturation', 'livraison', 'autre')),
    libelle VARCHAR(100),
    adresse_ligne1 VARCHAR(255) NOT NULL,
    adresse_ligne2 VARCHAR(255),
    code_postal VARCHAR(10) NOT NULL,
    ville VARCHAR(100) NOT NULL,
    pays VARCHAR(100) DEFAULT 'France',
    principal BOOLEAN DEFAULT FALSE,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_adresses_entreprise FOREIGN KEY (entreprise_id) REFERENCES entreprises(id) ON DELETE CASCADE
);

CREATE INDEX idx_adresses_entreprise ON adresses(entreprise_id);
CREATE INDEX idx_adresses_type ON adresses(type_adresse);

-- =====================================================
-- TABLE : contacts
-- Contacts des entreprises
-- =====================================================
CREATE TABLE contacts (
    id SERIAL PRIMARY KEY,
    entreprise_id INTEGER NOT NULL,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100),
    fonction VARCHAR(100),
    email VARCHAR(255),
    telephone VARCHAR(20),
    mobile VARCHAR(20),
    principal BOOLEAN DEFAULT FALSE,
    actif BOOLEAN DEFAULT TRUE,
    notes TEXT,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_contacts_entreprise FOREIGN KEY (entreprise_id) REFERENCES entreprises(id) ON DELETE CASCADE
);

CREATE INDEX idx_contacts_entreprise ON contacts(entreprise_id);
CREATE INDEX idx_contacts_email ON contacts(email);

CREATE TRIGGER update_contacts_modtime BEFORE UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- =====================================================
-- TABLE : coordonnees_bancaires
-- Coordonnées bancaires des entreprises
-- =====================================================
CREATE TABLE coordonnees_bancaires (
    id SERIAL PRIMARY KEY,
    entreprise_id INTEGER NOT NULL,
    libelle VARCHAR(100),
    iban VARCHAR(34),
    bic VARCHAR(11),
    nom_banque VARCHAR(255),
    principal BOOLEAN DEFAULT FALSE,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_coordonnees_entreprise FOREIGN KEY (entreprise_id) REFERENCES entreprises(id) ON DELETE CASCADE
);

CREATE INDEX idx_coordonnees_entreprise ON coordonnees_bancaires(entreprise_id);

-- =====================================================
-- TABLE : categories
-- Catégories d'achat/produits
-- =====================================================
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE,
    libelle VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id INTEGER,
    actif BOOLEAN DEFAULT TRUE,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_categories_parent FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE INDEX idx_categories_code ON categories(code);
CREATE INDEX idx_categories_parent ON categories(parent_id);

-- =====================================================
-- TABLE : produits
-- Catalogue de produits et services
-- =====================================================
CREATE TABLE produits (
    id SERIAL PRIMARY KEY,
    reference VARCHAR(100) NOT NULL,
    reference_fournisseur VARCHAR(100),
    libelle VARCHAR(255) NOT NULL,
    description TEXT,
    categorie_id INTEGER,
    fournisseur_id INTEGER,
    unite VARCHAR(20) DEFAULT 'unité',
    prix_unitaire_ht DECIMAL(10,2),
    prix_fournisseur DECIMAL(10,2),
    tva_taux DECIMAL(5,2) DEFAULT 20.00,
    actif BOOLEAN DEFAULT TRUE,
    disponible BOOLEAN DEFAULT TRUE,
    delai_livraison_jours INTEGER,
    quantite_minimale DECIMAL(10,2),
    image_url VARCHAR(255),
    caracteristiques_techniques TEXT,
    stock_disponible DECIMAL(10,2),
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_produits_categorie FOREIGN KEY (categorie_id) REFERENCES categories(id) ON DELETE SET NULL,
    CONSTRAINT fk_produits_fournisseur FOREIGN KEY (fournisseur_id) REFERENCES entreprises(id) ON DELETE CASCADE
);

CREATE INDEX idx_produits_reference ON produits(reference);
CREATE INDEX idx_produits_categorie ON produits(categorie_id);
CREATE INDEX idx_produits_fournisseur ON produits(fournisseur_id);
CREATE INDEX idx_produits_fournisseur_reference ON produits(fournisseur_id, reference);

CREATE TRIGGER update_produits_modtime BEFORE UPDATE ON produits
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- =====================================================
-- TABLE : projets
-- Gestion de projets
-- =====================================================
CREATE TABLE projets (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE,
    libelle VARCHAR(255) NOT NULL,
    description TEXT,
    budget DECIMAL(12,2),
    date_debut DATE,
    date_fin DATE,
    statut VARCHAR(20) DEFAULT 'planifie' CHECK (statut IN ('planifie', 'en_cours', 'suspendu', 'termine', 'annule')),
    responsable_id INTEGER,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_projets_responsable FOREIGN KEY (responsable_id) REFERENCES utilisateurs(id) ON DELETE SET NULL
);

CREATE INDEX idx_projets_code ON projets(code);
CREATE INDEX idx_projets_statut ON projets(statut);

CREATE TRIGGER update_projets_modtime BEFORE UPDATE ON projets
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- =====================================================
-- TABLE : centres_cout
-- Centres de coût budgétaires
-- =====================================================
CREATE TABLE centres_cout (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    libelle VARCHAR(255) NOT NULL,
    description TEXT,
    budget_annuel DECIMAL(12,2),
    responsable_id INTEGER,
    actif BOOLEAN DEFAULT TRUE,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_centres_cout_responsable FOREIGN KEY (responsable_id) REFERENCES utilisateurs(id) ON DELETE SET NULL
);

CREATE INDEX idx_centres_cout_code ON centres_cout(code);

-- =====================================================
-- TABLE : rfq
-- Request for Quotation - Demandes de devis
-- =====================================================
CREATE TABLE rfq (
    id SERIAL PRIMARY KEY,
    numero VARCHAR(50) UNIQUE NOT NULL,
    date_emission DATE NOT NULL,
    date_limite_reponse DATE,
    emetteur_id INTEGER NOT NULL,
    destinataire_id INTEGER NOT NULL,
    contact_destinataire_id INTEGER,
    categorie_id INTEGER,
    description TEXT,
    lieu_livraison_id INTEGER,
    date_livraison_souhaitee DATE,
    incoterms VARCHAR(20),
    conditions_paiement TEXT,
    statut VARCHAR(20) DEFAULT 'brouillon' CHECK (statut IN ('brouillon', 'envoye', 'en_cours', 'cloture', 'annule')),
    projet_id INTEGER,
    centre_cout_id INTEGER,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_rfq_emetteur FOREIGN KEY (emetteur_id) REFERENCES utilisateurs(id),
    CONSTRAINT fk_rfq_destinataire FOREIGN KEY (destinataire_id) REFERENCES entreprises(id),
    CONSTRAINT fk_rfq_contact FOREIGN KEY (contact_destinataire_id) REFERENCES contacts(id) ON DELETE SET NULL,
    CONSTRAINT fk_rfq_categorie FOREIGN KEY (categorie_id) REFERENCES categories(id) ON DELETE SET NULL,
    CONSTRAINT fk_rfq_lieu_livraison FOREIGN KEY (lieu_livraison_id) REFERENCES adresses(id) ON DELETE SET NULL,
    CONSTRAINT fk_rfq_projet FOREIGN KEY (projet_id) REFERENCES projets(id) ON DELETE SET NULL,
    CONSTRAINT fk_rfq_centre_cout FOREIGN KEY (centre_cout_id) REFERENCES centres_cout(id) ON DELETE SET NULL
);

CREATE INDEX idx_rfq_numero ON rfq(numero);
CREATE INDEX idx_rfq_statut ON rfq(statut);
CREATE INDEX idx_rfq_date_emission ON rfq(date_emission);

CREATE TRIGGER update_rfq_modtime BEFORE UPDATE ON rfq
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- =====================================================
-- TABLE : rfq_lignes
-- Lignes de RFQ (produits/services demandés)
-- =====================================================
CREATE TABLE rfq_lignes (
    id SERIAL PRIMARY KEY,
    rfq_id INTEGER NOT NULL,
    produit_id INTEGER,
    reference VARCHAR(100),
    description TEXT NOT NULL,
    quantite DECIMAL(10,2) NOT NULL,
    unite VARCHAR(20) DEFAULT 'unité',
    specifications TEXT,
    ordre INTEGER DEFAULT 0,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_rfq_lignes_rfq FOREIGN KEY (rfq_id) REFERENCES rfq(id) ON DELETE CASCADE,
    CONSTRAINT fk_rfq_lignes_produit FOREIGN KEY (produit_id) REFERENCES produits(id) ON DELETE SET NULL
);

CREATE INDEX idx_rfq_lignes_rfq ON rfq_lignes(rfq_id);

-- =====================================================
-- TABLE : devis
-- Réponses aux RFQ - Devis fournisseurs
-- =====================================================
CREATE TABLE devis (
    id SERIAL PRIMARY KEY,
    numero VARCHAR(50) UNIQUE,
    rfq_id INTEGER NOT NULL,
    fournisseur_id INTEGER NOT NULL,
    contact_fournisseur_id INTEGER,
    date_emission DATE NOT NULL,
    date_validite DATE,
    total_ht DECIMAL(12,2) DEFAULT 0.00,
    total_tva DECIMAL(12,2) DEFAULT 0.00,
    total_ttc DECIMAL(12,2) DEFAULT 0.00,
    remise_globale DECIMAL(5,2) DEFAULT 0.00,
    conditions_paiement TEXT,
    delai_livraison INTEGER,
    garanties TEXT,
    certifications TEXT,
    statut VARCHAR(20) DEFAULT 'brouillon' CHECK (statut IN ('brouillon', 'envoye', 'accepte', 'refuse', 'expire')),
    notes TEXT,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_devis_rfq FOREIGN KEY (rfq_id) REFERENCES rfq(id) ON DELETE CASCADE,
    CONSTRAINT fk_devis_fournisseur FOREIGN KEY (fournisseur_id) REFERENCES entreprises(id),
    CONSTRAINT fk_devis_contact FOREIGN KEY (contact_fournisseur_id) REFERENCES contacts(id) ON DELETE SET NULL
);

CREATE INDEX idx_devis_numero ON devis(numero);
CREATE INDEX idx_devis_rfq ON devis(rfq_id);
CREATE INDEX idx_devis_statut ON devis(statut);

CREATE TRIGGER update_devis_modtime BEFORE UPDATE ON devis
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- =====================================================
-- TABLE : devis_lignes
-- Lignes de devis
-- =====================================================
CREATE TABLE devis_lignes (
    id SERIAL PRIMARY KEY,
    devis_id INTEGER NOT NULL,
    rfq_ligne_id INTEGER,
    produit_id INTEGER,
    reference VARCHAR(100),
    description TEXT NOT NULL,
    quantite DECIMAL(10,2) NOT NULL,
    unite VARCHAR(20) DEFAULT 'unité',
    prix_unitaire_ht DECIMAL(10,2) NOT NULL,
    remise DECIMAL(5,2) DEFAULT 0.00,
    total_ht DECIMAL(12,2) NOT NULL,
    tva_taux DECIMAL(5,2) DEFAULT 20.00,
    ordre INTEGER DEFAULT 0,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_devis_lignes_devis FOREIGN KEY (devis_id) REFERENCES devis(id) ON DELETE CASCADE,
    CONSTRAINT fk_devis_lignes_rfq_ligne FOREIGN KEY (rfq_ligne_id) REFERENCES rfq_lignes(id) ON DELETE SET NULL,
    CONSTRAINT fk_devis_lignes_produit FOREIGN KEY (produit_id) REFERENCES produits(id) ON DELETE SET NULL
);

CREATE INDEX idx_devis_lignes_devis ON devis_lignes(devis_id);

-- =====================================================
-- TABLE : commandes
-- Bons de commande (BC) et Purchase Orders (PO)
-- =====================================================
CREATE TABLE commandes (
    id SERIAL PRIMARY KEY,
    numero VARCHAR(50) UNIQUE NOT NULL,
    type_commande VARCHAR(2) NOT NULL CHECK (type_commande IN ('BC', 'PO')),
    date_commande DATE NOT NULL,
    date_livraison_souhaitee DATE,
    date_livraison_prevue DATE,
    commandeur_id INTEGER NOT NULL,
    fournisseur_id INTEGER NOT NULL,
    contact_fournisseur_id INTEGER,
    devis_id INTEGER,
    rfq_id INTEGER,
    adresse_livraison_id INTEGER,
    contact_livraison VARCHAR(255),
    telephone_livraison VARCHAR(20),
    heure_livraison TIME,
    incoterms VARCHAR(20),
    mode_transport VARCHAR(50),
    instructions_livraison TEXT,
    total_ht DECIMAL(12,2) DEFAULT 0.00,
    remise_globale DECIMAL(12,2) DEFAULT 0.00,
    total_tva DECIMAL(12,2) DEFAULT 0.00,
    total_ttc DECIMAL(12,2) DEFAULT 0.00,
    conditions_paiement TEXT,
    delai_paiement_jours INTEGER DEFAULT 30,
    mode_paiement VARCHAR(50),
    statut VARCHAR(30) DEFAULT 'brouillon' CHECK (statut IN ('brouillon', 'envoye', 'accepte', 'en_preparation', 'partiellement_livre', 'livre', 'annule')),
    date_acceptation DATE,
    projet_id INTEGER,
    centre_cout_id INTEGER,
    budget_approuve DECIMAL(12,2),
    notes TEXT,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_commandes_commandeur FOREIGN KEY (commandeur_id) REFERENCES utilisateurs(id),
    CONSTRAINT fk_commandes_fournisseur FOREIGN KEY (fournisseur_id) REFERENCES entreprises(id),
    CONSTRAINT fk_commandes_contact FOREIGN KEY (contact_fournisseur_id) REFERENCES contacts(id) ON DELETE SET NULL,
    CONSTRAINT fk_commandes_devis FOREIGN KEY (devis_id) REFERENCES devis(id) ON DELETE SET NULL,
    CONSTRAINT fk_commandes_rfq FOREIGN KEY (rfq_id) REFERENCES rfq(id) ON DELETE SET NULL,
    CONSTRAINT fk_commandes_adresse FOREIGN KEY (adresse_livraison_id) REFERENCES adresses(id) ON DELETE SET NULL,
    CONSTRAINT fk_commandes_projet FOREIGN KEY (projet_id) REFERENCES projets(id) ON DELETE SET NULL,
    CONSTRAINT fk_commandes_centre_cout FOREIGN KEY (centre_cout_id) REFERENCES centres_cout(id) ON DELETE SET NULL
);

CREATE INDEX idx_commandes_numero ON commandes(numero);
CREATE INDEX idx_commandes_type ON commandes(type_commande);
CREATE INDEX idx_commandes_statut ON commandes(statut);
CREATE INDEX idx_commandes_date_commande ON commandes(date_commande);

CREATE TRIGGER update_commandes_modtime BEFORE UPDATE ON commandes
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- =====================================================
-- TABLE : commande_lignes
-- Lignes de commande
-- =====================================================
CREATE TABLE commande_lignes (
    id SERIAL PRIMARY KEY,
    commande_id INTEGER NOT NULL,
    produit_id INTEGER,
    reference VARCHAR(100),
    description TEXT NOT NULL,
    quantite DECIMAL(10,2) NOT NULL,
    quantite_livree DECIMAL(10,2) DEFAULT 0.00,
    unite VARCHAR(20) DEFAULT 'unité',
    prix_unitaire_ht DECIMAL(10,2) NOT NULL,
    remise DECIMAL(5,2) DEFAULT 0.00,
    total_ht DECIMAL(12,2) NOT NULL,
    tva_taux DECIMAL(5,2) DEFAULT 20.00,
    ordre INTEGER DEFAULT 0,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_commande_lignes_commande FOREIGN KEY (commande_id) REFERENCES commandes(id) ON DELETE CASCADE,
    CONSTRAINT fk_commande_lignes_produit FOREIGN KEY (produit_id) REFERENCES produits(id) ON DELETE SET NULL
);

CREATE INDEX idx_commande_lignes_commande ON commande_lignes(commande_id);

-- =====================================================
-- TABLE : bons_livraison
-- Bons de livraison (BL)
-- =====================================================
CREATE TABLE bons_livraison (
    id SERIAL PRIMARY KEY,
    numero VARCHAR(50) UNIQUE NOT NULL,
    commande_id INTEGER NOT NULL,
    date_emission DATE NOT NULL,
    date_livraison DATE,
    heure_livraison TIME,
    transporteur_id INTEGER,
    numero_suivi VARCHAR(100),
    numero_colis VARCHAR(100),
    poids_total DECIMAL(10,2),
    volume DECIMAL(10,2),
    statut VARCHAR(20) DEFAULT 'brouillon' CHECK (statut IN ('brouillon', 'en_transit', 'livre', 'partiel', 'retard', 'annule')),
    receptionne_par VARCHAR(255),
    date_reception TIMESTAMP,
    reserves TEXT,
    notes TEXT,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bons_livraison_commande FOREIGN KEY (commande_id) REFERENCES commandes(id) ON DELETE CASCADE,
    CONSTRAINT fk_bons_livraison_transporteur FOREIGN KEY (transporteur_id) REFERENCES entreprises(id) ON DELETE SET NULL
);

CREATE INDEX idx_bons_livraison_numero ON bons_livraison(numero);
CREATE INDEX idx_bons_livraison_commande ON bons_livraison(commande_id);
CREATE INDEX idx_bons_livraison_statut ON bons_livraison(statut);

CREATE TRIGGER update_bons_livraison_modtime BEFORE UPDATE ON bons_livraison
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- =====================================================
-- TABLE : bl_lignes
-- Lignes de bon de livraison
-- =====================================================
CREATE TABLE bl_lignes (
    id SERIAL PRIMARY KEY,
    bl_id INTEGER NOT NULL,
    commande_ligne_id INTEGER NOT NULL,
    quantite_livree DECIMAL(10,2) NOT NULL,
    quantite_commandee DECIMAL(10,2) NOT NULL,
    etat VARCHAR(20) DEFAULT 'conforme' CHECK (etat IN ('conforme', 'non_conforme', 'endommage', 'manquant')),
    notes TEXT,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bl_lignes_bl FOREIGN KEY (bl_id) REFERENCES bons_livraison(id) ON DELETE CASCADE,
    CONSTRAINT fk_bl_lignes_commande_ligne FOREIGN KEY (commande_ligne_id) REFERENCES commande_lignes(id) ON DELETE CASCADE
);

CREATE INDEX idx_bl_lignes_bl ON bl_lignes(bl_id);

-- =====================================================
-- TABLE : factures
-- Factures et factures proforma
-- =====================================================
CREATE TABLE factures (
    id SERIAL PRIMARY KEY,
    numero VARCHAR(50) UNIQUE NOT NULL,
    type_facture VARCHAR(20) DEFAULT 'facture' CHECK (type_facture IN ('proforma', 'facture', 'avoir')),
    date_emission DATE NOT NULL,
    date_echeance DATE,
    facturier_id INTEGER NOT NULL,
    client_id INTEGER NOT NULL,
    contact_client_id INTEGER,
    commande_id INTEGER,
    bl_id INTEGER,
    adresse_facturation_id INTEGER,
    total_ht DECIMAL(12,2) DEFAULT 0.00,
    total_tva DECIMAL(12,2) DEFAULT 0.00,
    total_ttc DECIMAL(12,2) DEFAULT 0.00,
    montant_regle DECIMAL(12,2) DEFAULT 0.00,
    reste_a_payer DECIMAL(12,2) DEFAULT 0.00,
    conditions_paiement TEXT,
    delai_paiement_jours INTEGER DEFAULT 30,
    mode_paiement VARCHAR(50),
    statut VARCHAR(30) DEFAULT 'brouillon' CHECK (statut IN ('brouillon', 'envoyee', 'en_attente', 'partiellement_payee', 'payee', 'impayee', 'annulee')),
    penalites_taux DECIMAL(5,2),
    frais_recouvrement DECIMAL(10,2),
    notes TEXT,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_factures_facturier FOREIGN KEY (facturier_id) REFERENCES entreprises(id),
    CONSTRAINT fk_factures_client FOREIGN KEY (client_id) REFERENCES entreprises(id),
    CONSTRAINT fk_factures_contact FOREIGN KEY (contact_client_id) REFERENCES contacts(id) ON DELETE SET NULL,
    CONSTRAINT fk_factures_commande FOREIGN KEY (commande_id) REFERENCES commandes(id) ON DELETE SET NULL,
    CONSTRAINT fk_factures_bl FOREIGN KEY (bl_id) REFERENCES bons_livraison(id) ON DELETE SET NULL,
    CONSTRAINT fk_factures_adresse FOREIGN KEY (adresse_facturation_id) REFERENCES adresses(id) ON DELETE SET NULL
);

CREATE INDEX idx_factures_numero ON factures(numero);
CREATE INDEX idx_factures_type ON factures(type_facture);
CREATE INDEX idx_factures_statut ON factures(statut);
CREATE INDEX idx_factures_date_emission ON factures(date_emission);

CREATE TRIGGER update_factures_modtime BEFORE UPDATE ON factures
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- =====================================================
-- TABLE : facture_lignes
-- Lignes de facture
-- =====================================================
CREATE TABLE facture_lignes (
    id SERIAL PRIMARY KEY,
    facture_id INTEGER NOT NULL,
    produit_id INTEGER,
    reference VARCHAR(100),
    description TEXT NOT NULL,
    quantite DECIMAL(10,2) NOT NULL,
    unite VARCHAR(20) DEFAULT 'unité',
    prix_unitaire_ht DECIMAL(10,2) NOT NULL,
    remise DECIMAL(5,2) DEFAULT 0.00,
    total_ht DECIMAL(12,2) NOT NULL,
    tva_taux DECIMAL(5,2) DEFAULT 20.00,
    ordre INTEGER DEFAULT 0,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_facture_lignes_facture FOREIGN KEY (facture_id) REFERENCES factures(id) ON DELETE CASCADE,
    CONSTRAINT fk_facture_lignes_produit FOREIGN KEY (produit_id) REFERENCES produits(id) ON DELETE SET NULL
);

CREATE INDEX idx_facture_lignes_facture ON facture_lignes(facture_id);

-- =====================================================
-- TABLE : paiements
-- Suivi des paiements
-- =====================================================
CREATE TABLE paiements (
    id SERIAL PRIMARY KEY,
    facture_id INTEGER NOT NULL,
    montant DECIMAL(12,2) NOT NULL,
    date_paiement DATE NOT NULL,
    mode_paiement VARCHAR(50) NOT NULL,
    reference_paiement VARCHAR(100),
    banque VARCHAR(255),
    notes TEXT,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_paiements_facture FOREIGN KEY (facture_id) REFERENCES factures(id) ON DELETE CASCADE
);

CREATE INDEX idx_paiements_facture ON paiements(facture_id);
CREATE INDEX idx_paiements_date_paiement ON paiements(date_paiement);

-- =====================================================
-- TABLE : sla
-- Service Level Agreements
-- =====================================================
CREATE TABLE sla (
    id SERIAL PRIMARY KEY,
    numero VARCHAR(50) UNIQUE NOT NULL,
    date_signature DATE,
    date_entree_vigueur DATE NOT NULL,
    date_expiration DATE,
    fournisseur_id INTEGER NOT NULL,
    client_id INTEGER NOT NULL,
    contact_fournisseur_id INTEGER,
    contact_client_id INTEGER,
    description TEXT,
    disponibilite_cible DECIMAL(5,2),
    temps_reponse_urgent INTEGER,
    temps_reponse_standard INTEGER,
    temps_reponse_non_urgent INTEGER,
    temps_resolution_critique INTEGER,
    temps_resolution_majeur INTEGER,
    temps_resolution_mineur INTEGER,
    frequence_reporting VARCHAR(50),
    responsable_reporting_id INTEGER,
    statut VARCHAR(20) DEFAULT 'brouillon' CHECK (statut IN ('brouillon', 'actif', 'suspendu', 'expire', 'resilie')),
    notes TEXT,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sla_fournisseur FOREIGN KEY (fournisseur_id) REFERENCES entreprises(id),
    CONSTRAINT fk_sla_client FOREIGN KEY (client_id) REFERENCES entreprises(id),
    CONSTRAINT fk_sla_contact_fournisseur FOREIGN KEY (contact_fournisseur_id) REFERENCES contacts(id) ON DELETE SET NULL,
    CONSTRAINT fk_sla_contact_client FOREIGN KEY (contact_client_id) REFERENCES contacts(id) ON DELETE SET NULL,
    CONSTRAINT fk_sla_responsable FOREIGN KEY (responsable_reporting_id) REFERENCES utilisateurs(id) ON DELETE SET NULL
);

CREATE INDEX idx_sla_numero ON sla(numero);
CREATE INDEX idx_sla_statut ON sla(statut);

CREATE TRIGGER update_sla_modtime BEFORE UPDATE ON sla
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- =====================================================
-- TABLE : documents_joints
-- Pièces jointes aux documents
-- =====================================================
CREATE TABLE documents_joints (
    id SERIAL PRIMARY KEY,
    type_document VARCHAR(20) NOT NULL CHECK (type_document IN ('rfq', 'devis', 'commande', 'bl', 'facture', 'sla', 'autre')),
    document_id INTEGER NOT NULL,
    nom_fichier VARCHAR(255) NOT NULL,
    chemin_fichier VARCHAR(500) NOT NULL,
    type_mime VARCHAR(100),
    taille_octets INTEGER,
    description TEXT,
    date_upload TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    upload_par_id INTEGER
);

CREATE INDEX idx_documents_joints_type ON documents_joints(type_document, document_id);
CREATE INDEX idx_documents_joints_upload_par ON documents_joints(upload_par_id);

-- =====================================================
-- TABLE : historique
-- Historique des actions sur les documents
-- =====================================================
CREATE TABLE historique (
    id SERIAL PRIMARY KEY,
    type_document VARCHAR(20) NOT NULL CHECK (type_document IN ('rfq', 'devis', 'commande', 'bl', 'facture', 'sla', 'autre')),
    document_id INTEGER NOT NULL,
    utilisateur_id INTEGER,
    action VARCHAR(100) NOT NULL,
    description TEXT,
    donnees_avant TEXT,
    donnees_apres TEXT,
    date_action TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_historique_type_document ON historique(type_document, document_id);
CREATE INDEX idx_historique_utilisateur ON historique(utilisateur_id);
CREATE INDEX idx_historique_date ON historique(date_action);

-- =====================================================
-- TABLE : notifications
-- Système de notifications
-- =====================================================
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    utilisateur_id INTEGER NOT NULL,
    type_notification VARCHAR(50) NOT NULL,
    titre VARCHAR(255) NOT NULL,
    message TEXT,
    type_document VARCHAR(50),
    document_id INTEGER,
    lu BOOLEAN DEFAULT FALSE,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notifications_utilisateur FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
);

CREATE INDEX idx_notifications_utilisateur ON notifications(utilisateur_id);
CREATE INDEX idx_notifications_lu ON notifications(lu);
CREATE INDEX idx_notifications_date ON notifications(date_creation);

-- =====================================================
-- TABLE : parametres
-- Paramètres système
-- =====================================================
CREATE TABLE parametres (
    id SERIAL PRIMARY KEY,
    cle VARCHAR(100) UNIQUE NOT NULL,
    valeur TEXT,
    type_valeur VARCHAR(20) DEFAULT 'string' CHECK (type_valeur IN ('string', 'number', 'boolean', 'json')),
    description TEXT,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_parametres_cle ON parametres(cle);

CREATE TRIGGER update_parametres_modtime BEFORE UPDATE ON parametres
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- =====================================================
-- INSERTION DE DONNÉES INITIALES
-- =====================================================

-- Utilisateur administrateur par défaut
INSERT INTO utilisateurs (email, mot_de_passe, nom, prenom, fonction, role, actif) 
VALUES ('admin@silyprocure.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'SilyProcure', 'Administrateur', 'admin', TRUE);
-- Note: Le mot de passe hashé correspond à "password" - À CHANGER EN PRODUCTION

-- Catégories par défaut
INSERT INTO categories (code, libelle, description) VALUES
('MAT', 'Matériel', 'Matériel et équipements'),
('SERV', 'Services', 'Services et prestations'),
('LOG', 'Logistique', 'Services logistiques et transport'),
('IT', 'Informatique', 'Équipements et services informatiques'),
('BUREAU', 'Bureau', 'Fournitures de bureau');

-- Paramètres système
INSERT INTO parametres (cle, valeur, type_valeur, description) VALUES
('tva_par_defaut', '20.00', 'number', 'Taux de TVA par défaut (%)'),
('delai_paiement_defaut', '30', 'number', 'Délai de paiement par défaut (jours)'),
('penalites_retard', '3', 'number', 'Taux de pénalités de retard (%)'),
('frais_recouvrement', '40', 'number', 'Frais de recouvrement (€)'),
('nom_entreprise', 'SilyProcure', 'string', 'Nom de l''entreprise'),
('email_contact', 'silycore@gmail.com', 'string', 'Email de contact');

-- =====================================================
-- FIN DU SCRIPT
-- =====================================================

