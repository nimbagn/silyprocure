-- Migration pour créer la table messages_contact
-- Cette table stocke les messages provenant du formulaire de contact de la page d'accueil

CREATE TABLE IF NOT EXISTS messages_contact (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(255) NOT NULL COMMENT 'Nom complet de l''expéditeur',
    email VARCHAR(255) NOT NULL COMMENT 'Email de l''expéditeur',
    telephone VARCHAR(50) COMMENT 'Numéro de téléphone',
    sujet VARCHAR(255) NOT NULL COMMENT 'Sujet du message',
    message TEXT NOT NULL COMMENT 'Contenu du message',
    lu BOOLEAN DEFAULT FALSE COMMENT 'Message lu ou non',
    traite BOOLEAN DEFAULT FALSE COMMENT 'Message traité ou non',
    traite_par INT COMMENT 'ID de l''utilisateur qui a traité le message',
    date_creation DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Date de création',
    date_modification DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Date de dernière modification',
    notes_internes TEXT COMMENT 'Notes internes pour le suivi',
    FOREIGN KEY (traite_par) REFERENCES utilisateurs(id) ON DELETE SET NULL,
    INDEX idx_lu (lu),
    INDEX idx_traite (traite),
    INDEX idx_date_creation (date_creation),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

