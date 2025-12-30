-- Migration : Créer la table pour l'historique des interactions clients
-- Permet de suivre toutes les interactions d'un client avec la plateforme

CREATE TABLE IF NOT EXISTS historique_clients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL COMMENT 'ID du client',
    type_interaction ENUM('demande_devis', 'devis_consulte', 'devis_accepte', 'devis_refuse', 'commande_creee', 'commande_livree', 'facture_generee', 'facture_payee', 'note_ajoutee', 'statut_modifie') NOT NULL COMMENT 'Type d interaction',
    reference_document VARCHAR(100) COMMENT 'Reference du document lie (numero devis, commande, etc.)',
    document_id INT COMMENT 'ID du document lie (devis_id, commande_id, etc.)',
    description TEXT COMMENT 'Description de l interaction',
    utilisateur_id INT COMMENT 'ID de l utilisateur qui a effectue l action (NULL si action automatique)',
    date_interaction DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Date de l interaction',
    metadata JSON COMMENT 'Donnees supplementaires en JSON (statut, montant, etc.)',
    INDEX idx_client_id (client_id),
    INDEX idx_type_interaction (type_interaction),
    INDEX idx_date_interaction (date_interaction),
    INDEX idx_document_id (document_id),
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

