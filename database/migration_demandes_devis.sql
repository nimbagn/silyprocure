-- Migration pour créer la table demandes_devis
-- Cette table stocke les demandes de devis depuis la page d'accueil publique

CREATE TABLE IF NOT EXISTS demandes_devis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(255) NOT NULL COMMENT 'Nom complet du demandeur',
    email VARCHAR(255) NOT NULL COMMENT 'Email du demandeur',
    telephone VARCHAR(50) COMMENT 'Numéro de téléphone',
    entreprise VARCHAR(255) COMMENT 'Nom de l\'entreprise',
    service VARCHAR(100) COMMENT 'Service demandé (gestion-rfq, comparaison-devis, etc.)',
    message TEXT COMMENT 'Message du demandeur',
    statut ENUM('nouvelle', 'en_cours', 'traitee', 'annulee') DEFAULT 'nouvelle' COMMENT 'Statut de la demande',
    date_creation DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Date de création',
    date_modification DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Date de dernière modification',
    traite_par INT COMMENT 'ID de l\'utilisateur qui a traité la demande',
    notes_internes TEXT COMMENT 'Notes internes pour le suivi',
    INDEX idx_statut (statut),
    INDEX idx_date_creation (date_creation),
    INDEX idx_email (email),
    FOREIGN KEY (traite_par) REFERENCES utilisateurs(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

