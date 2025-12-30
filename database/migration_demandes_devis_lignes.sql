-- Migration pour ajouter les lignes d'articles et l'adresse de livraison aux demandes de devis

-- Table pour stocker les lignes d'articles des demandes de devis
CREATE TABLE IF NOT EXISTS demandes_devis_lignes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    demande_devis_id INT NOT NULL,
    description VARCHAR(500) NOT NULL COMMENT 'Description de l\'article',
    secteur VARCHAR(100) COMMENT 'Secteur/Catégorie (alimentation, électronique, chimique, etc.)',
    quantite DECIMAL(10,2) NOT NULL DEFAULT 1.00 COMMENT 'Quantité demandée',
    unite VARCHAR(50) DEFAULT 'unité' COMMENT 'Unité de mesure',
    ordre INT DEFAULT 0 COMMENT 'Ordre d\'affichage',
    date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (demande_devis_id) REFERENCES demandes_devis(id) ON DELETE CASCADE,
    INDEX idx_demande (demande_devis_id),
    INDEX idx_secteur (secteur)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ajouter une colonne pour l'adresse de livraison dans demandes_devis
-- Note: Ces colonnes seront ajoutées par le script Node.js qui vérifie leur existence

