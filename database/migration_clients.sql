-- Migration : Créer la table clients pour centraliser les informations clients
-- Permet de faire des analyses, relances et de réutiliser les informations

CREATE TABLE IF NOT EXISTS clients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(255) NOT NULL COMMENT 'Nom complet du client',
    email VARCHAR(255) NOT NULL COMMENT 'Email du client',
    telephone VARCHAR(50) COMMENT 'Numéro de téléphone',
    entreprise VARCHAR(255) COMMENT 'Nom de l\'entreprise du client',
    adresse VARCHAR(500) COMMENT 'Adresse complète',
    ville VARCHAR(100) COMMENT 'Ville',
    pays VARCHAR(100) COMMENT 'Pays',
    secteur_activite VARCHAR(100) COMMENT 'Secteur d\'activité de l\'entreprise',
    site_web VARCHAR(255) COMMENT 'Site web de l\'entreprise',
    notes TEXT COMMENT 'Notes sur le client',
    date_creation DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Date de création',
    date_modification DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Date de dernière modification',
    date_derniere_demande DATETIME COMMENT 'Date de la dernière demande de devis',
    nombre_demandes INT DEFAULT 0 COMMENT 'Nombre total de demandes',
    statut ENUM('actif', 'inactif', 'prospect') DEFAULT 'prospect' COMMENT 'Statut du client',
    INDEX idx_email (email),
    INDEX idx_entreprise (entreprise),
    INDEX idx_statut (statut),
    INDEX idx_date_derniere_demande (date_derniere_demande),
    UNIQUE KEY unique_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ajouter la colonne client_id dans demandes_devis pour lier à la table clients
ALTER TABLE demandes_devis 
ADD COLUMN IF NOT EXISTS client_id INT NULL COMMENT 'ID du client dans la table clients' 
AFTER id;

-- Ajouter l'index et la clé étrangère
ALTER TABLE demandes_devis 
ADD INDEX IF NOT EXISTS idx_client_id (client_id);

ALTER TABLE demandes_devis 
ADD CONSTRAINT fk_demande_client 
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;

