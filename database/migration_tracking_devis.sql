-- Migration pour ajouter le système de suivi des demandes de devis

-- Ajouter les colonnes pour le suivi
ALTER TABLE demandes_devis 
ADD COLUMN IF NOT EXISTS reference VARCHAR(50) UNIQUE COMMENT 'Référence unique de la demande',
ADD COLUMN IF NOT EXISTS token_suivi VARCHAR(100) UNIQUE COMMENT 'Token sécurisé pour le suivi public',
ADD COLUMN IF NOT EXISTS mode_notification ENUM('email', 'sms', 'whatsapp') DEFAULT 'email' COMMENT 'Mode de notification choisi par le client',
ADD COLUMN IF NOT EXISTS notification_envoyee BOOLEAN DEFAULT FALSE COMMENT 'Indique si la notification a été envoyée';

-- Créer un index sur le token de suivi pour des recherches rapides
CREATE INDEX IF NOT EXISTS idx_token_suivi ON demandes_devis(token_suivi);
CREATE INDEX IF NOT EXISTS idx_reference ON demandes_devis(reference);

