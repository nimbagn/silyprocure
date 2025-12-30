-- Migration pour ajouter le système de fichiers joints
-- Permet d'attacher des fichiers aux documents (RFQ, Devis, Commandes, Factures)

CREATE TABLE IF NOT EXISTS fichiers_joints (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type_document VARCHAR(50) NOT NULL COMMENT 'Type de document: rfq, devis, commande, facture',
    document_id INT NOT NULL COMMENT 'ID du document associé',
    nom_fichier VARCHAR(255) NOT NULL COMMENT 'Nom original du fichier',
    chemin_fichier VARCHAR(500) NOT NULL COMMENT 'Chemin relatif du fichier',
    taille_fichier BIGINT NOT NULL COMMENT 'Taille en octets',
    type_mime VARCHAR(100) COMMENT 'Type MIME du fichier',
    description TEXT COMMENT 'Description optionnelle',
    uploader_id INT NOT NULL COMMENT 'Utilisateur qui a uploadé le fichier',
    date_upload DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploader_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    INDEX idx_document (type_document, document_id),
    INDEX idx_uploader (uploader_id),
    INDEX idx_date (date_upload)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

