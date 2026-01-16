-- =====================================================
-- SilyProcure - Script de création de la base de données
-- Base de données : silypro
-- Utilisateur : soul
-- Mot de passe : Satina2025
-- Moteur : MySQL
-- =====================================================

-- Suppression de la base de données si elle existe
DROP DATABASE IF EXISTS silypro;

-- Création de la base de données
CREATE DATABASE silypro 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Utilisation de la base de données
USE silypro;

-- =====================================================
-- CRÉATION DE L'UTILISATEUR ET DES PERMISSIONS
-- =====================================================

-- Création de l'utilisateur (si nécessaire)
-- DROP USER IF EXISTS 'soul'@'localhost';
-- CREATE USER 'soul'@'localhost' IDENTIFIED BY 'Satina2025';

-- Attribution des permissions
GRANT ALL PRIVILEGES ON silypro.* TO 'soul'@'localhost';
FLUSH PRIVILEGES;

-- =====================================================
-- TABLE : utilisateurs
-- Gestion des utilisateurs du système
-- =====================================================
CREATE TABLE utilisateurs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    mot_de_passe VARCHAR(255) NOT NULL,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    telephone VARCHAR(20),
    fonction VARCHAR(100),
    departement VARCHAR(100),
    role ENUM('admin', 'acheteur', 'approbateur', 'comptable', 'viewer') DEFAULT 'viewer',
    actif BOOLEAN DEFAULT TRUE,
    date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
    date_modification DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    derniere_connexion DATETIME,
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE : entreprises
-- Informations sur les entreprises (acheteurs, fournisseurs, clients)
-- =====================================================
CREATE TABLE entreprises (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    raison_sociale VARCHAR(255),
    siret VARCHAR(14) UNIQUE,
    tva_intracommunautaire VARCHAR(20),
    type_entreprise ENUM('acheteur', 'fournisseur', 'client', 'transporteur') NOT NULL,
    email VARCHAR(255),
    telephone VARCHAR(20),
    site_web VARCHAR(255),
    logo_url VARCHAR(512),
    actif BOOLEAN DEFAULT TRUE,
    notes TEXT,
    date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
    date_modification DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_nom (nom),
    INDEX idx_siret (siret),
    INDEX idx_type (type_entreprise)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE : adresses
-- Adresses des entreprises
-- =====================================================
CREATE TABLE adresses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entreprise_id INT NOT NULL,
    type_adresse ENUM('siege', 'facturation', 'livraison', 'autre') DEFAULT 'siege',
    libelle VARCHAR(100),
    adresse_ligne1 VARCHAR(255) NOT NULL,
    adresse_ligne2 VARCHAR(255),
    code_postal VARCHAR(10) NOT NULL,
    ville VARCHAR(100) NOT NULL,
    pays VARCHAR(100) DEFAULT 'France',
    principal BOOLEAN DEFAULT FALSE,
    date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (entreprise_id) REFERENCES entreprises(id) ON DELETE CASCADE,
    INDEX idx_entreprise (entreprise_id),
    INDEX idx_type (type_adresse)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE : contacts
-- Contacts des entreprises
-- =====================================================
CREATE TABLE contacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entreprise_id INT NOT NULL,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100),
    fonction VARCHAR(100),
    email VARCHAR(255),
    telephone VARCHAR(20),
    mobile VARCHAR(20),
    principal BOOLEAN DEFAULT FALSE,
    actif BOOLEAN DEFAULT TRUE,
    notes TEXT,
    date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
    date_modification DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (entreprise_id) REFERENCES entreprises(id) ON DELETE CASCADE,
    INDEX idx_entreprise (entreprise_id),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE : coordonnees_bancaires
-- Coordonnées bancaires des entreprises
-- =====================================================
CREATE TABLE coordonnees_bancaires (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entreprise_id INT NOT NULL,
    libelle VARCHAR(100),
    iban VARCHAR(34),
    bic VARCHAR(11),
    nom_banque VARCHAR(255),
    principal BOOLEAN DEFAULT FALSE,
    date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (entreprise_id) REFERENCES entreprises(id) ON DELETE CASCADE,
    INDEX idx_entreprise (entreprise_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE : categories
-- Catégories d'achat/produits
-- =====================================================
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) UNIQUE,
    libelle VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id INT,
    actif BOOLEAN DEFAULT TRUE,
    date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_code (code),
    INDEX idx_parent (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE : produits
-- Catalogue de produits et services
-- =====================================================
CREATE TABLE produits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reference VARCHAR(100) UNIQUE NOT NULL,
    libelle VARCHAR(255) NOT NULL,
    description TEXT,
    categorie_id INT,
    unite VARCHAR(20) DEFAULT 'unité',
    prix_unitaire_ht DECIMAL(10,2),
    tva_taux DECIMAL(5,2) DEFAULT 20.00,
    actif BOOLEAN DEFAULT TRUE,
    date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
    date_modification DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (categorie_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_reference (reference),
    INDEX idx_categorie (categorie_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE : projets
-- Gestion de projets
-- =====================================================
CREATE TABLE projets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) UNIQUE,
    libelle VARCHAR(255) NOT NULL,
    description TEXT,
    budget DECIMAL(12,2),
    date_debut DATE,
    date_fin DATE,
    statut ENUM('planifie', 'en_cours', 'suspendu', 'termine', 'annule') DEFAULT 'planifie',
    responsable_id INT,
    date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
    date_modification DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (responsable_id) REFERENCES utilisateurs(id) ON DELETE SET NULL,
    INDEX idx_code (code),
    INDEX idx_statut (statut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE : centres_cout
-- Centres de coût budgétaires
-- =====================================================
CREATE TABLE centres_cout (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    libelle VARCHAR(255) NOT NULL,
    description TEXT,
    budget_annuel DECIMAL(12,2),
    responsable_id INT,
    actif BOOLEAN DEFAULT TRUE,
    date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (responsable_id) REFERENCES utilisateurs(id) ON DELETE SET NULL,
    INDEX idx_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE : rfq
-- Request for Quotation - Demandes de devis
-- =====================================================
CREATE TABLE rfq (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero VARCHAR(50) UNIQUE NOT NULL,
    date_emission DATE NOT NULL,
    date_limite_reponse DATE,
    emetteur_id INT NOT NULL,
    destinataire_id INT NOT NULL,
    contact_destinataire_id INT,
    categorie_id INT,
    description TEXT,
    lieu_livraison_id INT,
    date_livraison_souhaitee DATE,
    incoterms VARCHAR(20),
    conditions_paiement TEXT,
    statut ENUM('brouillon', 'envoye', 'en_cours', 'cloture', 'annule') DEFAULT 'brouillon',
    projet_id INT,
    centre_cout_id INT,
    date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
    date_modification DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (emetteur_id) REFERENCES utilisateurs(id),
    FOREIGN KEY (destinataire_id) REFERENCES entreprises(id),
    FOREIGN KEY (contact_destinataire_id) REFERENCES contacts(id) ON DELETE SET NULL,
    FOREIGN KEY (categorie_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (lieu_livraison_id) REFERENCES adresses(id) ON DELETE SET NULL,
    FOREIGN KEY (projet_id) REFERENCES projets(id) ON DELETE SET NULL,
    FOREIGN KEY (centre_cout_id) REFERENCES centres_cout(id) ON DELETE SET NULL,
    INDEX idx_numero (numero),
    INDEX idx_statut (statut),
    INDEX idx_date_emission (date_emission)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE : rfq_lignes
-- Lignes de RFQ (produits/services demandés)
-- =====================================================
CREATE TABLE rfq_lignes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rfq_id INT NOT NULL,
    produit_id INT,
    reference VARCHAR(100),
    description TEXT NOT NULL,
    quantite DECIMAL(10,2) NOT NULL,
    unite VARCHAR(20) DEFAULT 'unité',
    specifications TEXT,
    ordre INT DEFAULT 0,
    date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rfq_id) REFERENCES rfq(id) ON DELETE CASCADE,
    FOREIGN KEY (produit_id) REFERENCES produits(id) ON DELETE SET NULL,
    INDEX idx_rfq (rfq_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE : devis
-- Réponses aux RFQ - Devis fournisseurs
-- =====================================================
CREATE TABLE devis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero VARCHAR(50) UNIQUE,
    rfq_id INT NOT NULL,
    fournisseur_id INT NOT NULL,
    contact_fournisseur_id INT,
    date_emission DATE NOT NULL,
    date_validite DATE,
    total_ht DECIMAL(12,2) DEFAULT 0.00,
    total_tva DECIMAL(12,2) DEFAULT 0.00,
    total_ttc DECIMAL(12,2) DEFAULT 0.00,
    remise_globale DECIMAL(5,2) DEFAULT 0.00,
    conditions_paiement TEXT,
    delai_livraison INT,
    garanties TEXT,
    certifications TEXT,
    statut ENUM('brouillon', 'envoye', 'accepte', 'refuse', 'expire') DEFAULT 'brouillon',
    notes TEXT,
    date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
    date_modification DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (rfq_id) REFERENCES rfq(id) ON DELETE CASCADE,
    FOREIGN KEY (fournisseur_id) REFERENCES entreprises(id),
    FOREIGN KEY (contact_fournisseur_id) REFERENCES contacts(id) ON DELETE SET NULL,
    INDEX idx_numero (numero),
    INDEX idx_rfq (rfq_id),
    INDEX idx_statut (statut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE : devis_lignes
-- Lignes de devis
-- =====================================================
CREATE TABLE devis_lignes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    devis_id INT NOT NULL,
    rfq_ligne_id INT,
    produit_id INT,
    reference VARCHAR(100),
    description TEXT NOT NULL,
    quantite DECIMAL(10,2) NOT NULL,
    unite VARCHAR(20) DEFAULT 'unité',
    prix_unitaire_ht DECIMAL(10,2) NOT NULL,
    remise DECIMAL(5,2) DEFAULT 0.00,
    total_ht DECIMAL(12,2) NOT NULL,
    tva_taux DECIMAL(5,2) DEFAULT 20.00,
    ordre INT DEFAULT 0,
    date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (devis_id) REFERENCES devis(id) ON DELETE CASCADE,
    FOREIGN KEY (rfq_ligne_id) REFERENCES rfq_lignes(id) ON DELETE SET NULL,
    FOREIGN KEY (produit_id) REFERENCES produits(id) ON DELETE SET NULL,
    INDEX idx_devis (devis_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE : commandes
-- Bons de commande (BC) et Purchase Orders (PO)
-- =====================================================
CREATE TABLE commandes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero VARCHAR(50) UNIQUE NOT NULL,
    type_commande ENUM('BC', 'PO') NOT NULL,
    date_commande DATE NOT NULL,
    date_livraison_souhaitee DATE,
    date_livraison_prevue DATE,
    commandeur_id INT NOT NULL,
    fournisseur_id INT NOT NULL,
    contact_fournisseur_id INT,
    devis_id INT,
    rfq_id INT,
    adresse_livraison_id INT,
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
    delai_paiement_jours INT DEFAULT 30,
    mode_paiement VARCHAR(50),
    statut ENUM('brouillon', 'envoye', 'accepte', 'en_preparation', 'partiellement_livre', 'livre', 'annule') DEFAULT 'brouillon',
    date_acceptation DATE,
    projet_id INT,
    centre_cout_id INT,
    budget_approuve DECIMAL(12,2),
    notes TEXT,
    date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
    date_modification DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (commandeur_id) REFERENCES utilisateurs(id),
    FOREIGN KEY (fournisseur_id) REFERENCES entreprises(id),
    FOREIGN KEY (contact_fournisseur_id) REFERENCES contacts(id) ON DELETE SET NULL,
    FOREIGN KEY (devis_id) REFERENCES devis(id) ON DELETE SET NULL,
    FOREIGN KEY (rfq_id) REFERENCES rfq(id) ON DELETE SET NULL,
    FOREIGN KEY (adresse_livraison_id) REFERENCES adresses(id) ON DELETE SET NULL,
    FOREIGN KEY (projet_id) REFERENCES projets(id) ON DELETE SET NULL,
    FOREIGN KEY (centre_cout_id) REFERENCES centres_cout(id) ON DELETE SET NULL,
    INDEX idx_numero (numero),
    INDEX idx_type (type_commande),
    INDEX idx_statut (statut),
    INDEX idx_date_commande (date_commande)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE : commande_lignes
-- Lignes de commande
-- =====================================================
CREATE TABLE commande_lignes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    commande_id INT NOT NULL,
    produit_id INT,
    reference VARCHAR(100),
    description TEXT NOT NULL,
    quantite DECIMAL(10,2) NOT NULL,
    quantite_livree DECIMAL(10,2) DEFAULT 0.00,
    unite VARCHAR(20) DEFAULT 'unité',
    prix_unitaire_ht DECIMAL(10,2) NOT NULL,
    remise DECIMAL(5,2) DEFAULT 0.00,
    total_ht DECIMAL(12,2) NOT NULL,
    tva_taux DECIMAL(5,2) DEFAULT 20.00,
    ordre INT DEFAULT 0,
    date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (commande_id) REFERENCES commandes(id) ON DELETE CASCADE,
    FOREIGN KEY (produit_id) REFERENCES produits(id) ON DELETE SET NULL,
    INDEX idx_commande (commande_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE : bons_livraison
-- Bons de livraison (BL)
-- =====================================================
CREATE TABLE bons_livraison (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero VARCHAR(50) UNIQUE NOT NULL,
    commande_id INT NOT NULL,
    date_emission DATE NOT NULL,
    date_livraison DATE,
    heure_livraison TIME,
    transporteur_id INT,
    numero_suivi VARCHAR(100),
    numero_colis VARCHAR(100),
    poids_total DECIMAL(10,2),
    volume DECIMAL(10,2),
    statut ENUM('brouillon', 'en_transit', 'livre', 'partiel', 'retard', 'annule') DEFAULT 'brouillon',
    receptionne_par VARCHAR(255),
    date_reception DATETIME,
    reserves TEXT,
    notes TEXT,
    date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
    date_modification DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (commande_id) REFERENCES commandes(id) ON DELETE CASCADE,
    FOREIGN KEY (transporteur_id) REFERENCES entreprises(id) ON DELETE SET NULL,
    INDEX idx_numero (numero),
    INDEX idx_commande (commande_id),
    INDEX idx_statut (statut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE : bl_lignes
-- Lignes de bon de livraison
-- =====================================================
CREATE TABLE bl_lignes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bl_id INT NOT NULL,
    commande_ligne_id INT NOT NULL,
    quantite_livree DECIMAL(10,2) NOT NULL,
    quantite_commandee DECIMAL(10,2) NOT NULL,
    etat ENUM('conforme', 'non_conforme', 'endommage', 'manquant') DEFAULT 'conforme',
    notes TEXT,
    date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bl_id) REFERENCES bons_livraison(id) ON DELETE CASCADE,
    FOREIGN KEY (commande_ligne_id) REFERENCES commande_lignes(id) ON DELETE CASCADE,
    INDEX idx_bl (bl_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE : factures
-- Factures et factures proforma
-- =====================================================
CREATE TABLE factures (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero VARCHAR(50) UNIQUE NOT NULL,
    type_facture ENUM('proforma', 'facture', 'avoir') DEFAULT 'facture',
    date_emission DATE NOT NULL,
    date_echeance DATE,
    facturier_id INT NOT NULL,
    client_id INT NOT NULL,
    contact_client_id INT,
    commande_id INT,
    bl_id INT,
    adresse_facturation_id INT,
    total_ht DECIMAL(12,2) DEFAULT 0.00,
    total_tva DECIMAL(12,2) DEFAULT 0.00,
    total_ttc DECIMAL(12,2) DEFAULT 0.00,
    montant_regle DECIMAL(12,2) DEFAULT 0.00,
    reste_a_payer DECIMAL(12,2) DEFAULT 0.00,
    conditions_paiement TEXT,
    delai_paiement_jours INT DEFAULT 30,
    mode_paiement VARCHAR(50),
    statut ENUM('brouillon', 'envoyee', 'en_attente', 'partiellement_payee', 'payee', 'impayee', 'annulee') DEFAULT 'brouillon',
    penalites_taux DECIMAL(5,2),
    frais_recouvrement DECIMAL(10,2),
    notes TEXT,
    date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
    date_modification DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (facturier_id) REFERENCES entreprises(id),
    FOREIGN KEY (client_id) REFERENCES entreprises(id),
    FOREIGN KEY (contact_client_id) REFERENCES contacts(id) ON DELETE SET NULL,
    FOREIGN KEY (commande_id) REFERENCES commandes(id) ON DELETE SET NULL,
    FOREIGN KEY (bl_id) REFERENCES bons_livraison(id) ON DELETE SET NULL,
    FOREIGN KEY (adresse_facturation_id) REFERENCES adresses(id) ON DELETE SET NULL,
    INDEX idx_numero (numero),
    INDEX idx_type (type_facture),
    INDEX idx_statut (statut),
    INDEX idx_date_emission (date_emission)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE : facture_lignes
-- Lignes de facture
-- =====================================================
CREATE TABLE facture_lignes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    facture_id INT NOT NULL,
    produit_id INT,
    reference VARCHAR(100),
    description TEXT NOT NULL,
    quantite DECIMAL(10,2) NOT NULL,
    unite VARCHAR(20) DEFAULT 'unité',
    prix_unitaire_ht DECIMAL(10,2) NOT NULL,
    remise DECIMAL(5,2) DEFAULT 0.00,
    total_ht DECIMAL(12,2) NOT NULL,
    tva_taux DECIMAL(5,2) DEFAULT 20.00,
    ordre INT DEFAULT 0,
    date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (facture_id) REFERENCES factures(id) ON DELETE CASCADE,
    FOREIGN KEY (produit_id) REFERENCES produits(id) ON DELETE SET NULL,
    INDEX idx_facture (facture_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE : paiements
-- Suivi des paiements
-- =====================================================
CREATE TABLE paiements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    facture_id INT NOT NULL,
    montant DECIMAL(12,2) NOT NULL,
    date_paiement DATE NOT NULL,
    mode_paiement VARCHAR(50) NOT NULL,
    reference_paiement VARCHAR(100),
    banque VARCHAR(255),
    notes TEXT,
    date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (facture_id) REFERENCES factures(id) ON DELETE CASCADE,
    INDEX idx_facture (facture_id),
    INDEX idx_date_paiement (date_paiement)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE : sla
-- Service Level Agreements
-- =====================================================
CREATE TABLE sla (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero VARCHAR(50) UNIQUE NOT NULL,
    date_signature DATE,
    date_entree_vigueur DATE NOT NULL,
    date_expiration DATE,
    fournisseur_id INT NOT NULL,
    client_id INT NOT NULL,
    contact_fournisseur_id INT,
    contact_client_id INT,
    description TEXT,
    disponibilite_cible DECIMAL(5,2),
    temps_reponse_urgent INT,
    temps_reponse_standard INT,
    temps_reponse_non_urgent INT,
    temps_resolution_critique INT,
    temps_resolution_majeur INT,
    temps_resolution_mineur INT,
    frequence_reporting VARCHAR(50),
    responsable_reporting_id INT,
    statut ENUM('brouillon', 'actif', 'suspendu', 'expire', 'resilie') DEFAULT 'brouillon',
    notes TEXT,
    date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
    date_modification DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (fournisseur_id) REFERENCES entreprises(id),
    FOREIGN KEY (client_id) REFERENCES entreprises(id),
    FOREIGN KEY (contact_fournisseur_id) REFERENCES contacts(id) ON DELETE SET NULL,
    FOREIGN KEY (contact_client_id) REFERENCES contacts(id) ON DELETE SET NULL,
    FOREIGN KEY (responsable_reporting_id) REFERENCES utilisateurs(id) ON DELETE SET NULL,
    INDEX idx_numero (numero),
    INDEX idx_statut (statut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE : documents_joints
-- Pièces jointes aux documents
-- =====================================================
CREATE TABLE documents_joints (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type_document ENUM('rfq', 'devis', 'commande', 'bl', 'facture', 'sla', 'autre') NOT NULL,
    document_id INT NOT NULL,
    nom_fichier VARCHAR(255) NOT NULL,
    chemin_fichier VARCHAR(500) NOT NULL,
    type_mime VARCHAR(100),
    taille_octets INT,
    description TEXT,
    date_upload DATETIME DEFAULT CURRENT_TIMESTAMP,
    upload_par_id INT,
    INDEX idx_type_document (type_document, document_id),
    INDEX idx_upload_par (upload_par_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE : historique
-- Historique des actions sur les documents
-- =====================================================
CREATE TABLE historique (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type_document ENUM('rfq', 'devis', 'commande', 'bl', 'facture', 'sla', 'autre') NOT NULL,
    document_id INT NOT NULL,
    utilisateur_id INT,
    action VARCHAR(100) NOT NULL,
    description TEXT,
    donnees_avant TEXT,
    donnees_apres TEXT,
    date_action DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_type_document (type_document, document_id),
    INDEX idx_utilisateur (utilisateur_id),
    INDEX idx_date (date_action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE : notifications
-- Système de notifications
-- =====================================================
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    utilisateur_id INT NOT NULL,
    type_notification VARCHAR(50) NOT NULL,
    titre VARCHAR(255) NOT NULL,
    message TEXT,
    type_document VARCHAR(50),
    document_id INT,
    lu BOOLEAN DEFAULT FALSE,
    date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    INDEX idx_utilisateur (utilisateur_id),
    INDEX idx_lu (lu),
    INDEX idx_date (date_creation)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE : parametres
-- Paramètres système
-- =====================================================
CREATE TABLE parametres (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cle VARCHAR(100) UNIQUE NOT NULL,
    valeur TEXT,
    type_valeur ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description TEXT,
    date_modification DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_cle (cle)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

