-- Migration : Table pour les liens de remplissage externes
-- Permet de générer des liens sécurisés pour les fournisseurs externes
-- Date : 2024

USE silypro;

-- Table pour stocker les liens de remplissage externes
CREATE TABLE IF NOT EXISTS liens_externes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rfq_id INT NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    fournisseur_id INT NOT NULL,
    email_envoye VARCHAR(255),
    date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
    date_expiration DATETIME,
    utilise BOOLEAN DEFAULT FALSE,
    date_utilisation DATETIME NULL,
    ip_utilisation VARCHAR(45),
    FOREIGN KEY (rfq_id) REFERENCES rfq(id) ON DELETE CASCADE,
    FOREIGN KEY (fournisseur_id) REFERENCES entreprises(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_rfq (rfq_id),
    INDEX idx_fournisseur (fournisseur_id),
    INDEX idx_utilise (utilise)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT '✅ Migration liens externes appliquée avec succès' AS message;

