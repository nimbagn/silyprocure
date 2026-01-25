-- Migration : Extension de la table liens_externes pour supporter les factures proforma
-- Permet de générer des liens de validation/signature pour les clients
-- Date : 2025-01-17

-- Pour MySQL
ALTER TABLE liens_externes 
ADD COLUMN IF NOT EXISTS facture_id INT NULL,
ADD COLUMN IF NOT EXISTS type_lien ENUM('rfq', 'facture') DEFAULT 'rfq' COMMENT 'Type de lien: rfq pour remplissage devis, facture pour validation/signature',
ADD COLUMN IF NOT EXISTS client_id INT NULL COMMENT 'ID du client pour les liens de facture';

-- Ajouter les index et contraintes
ALTER TABLE liens_externes
ADD INDEX IF NOT EXISTS idx_facture_id (facture_id),
ADD INDEX IF NOT EXISTS idx_type_lien (type_lien),
ADD INDEX IF NOT EXISTS idx_client_id (client_id);

-- Ajouter la contrainte de clé étrangère pour facture_id
ALTER TABLE liens_externes
ADD CONSTRAINT fk_liens_externes_facture 
FOREIGN KEY (facture_id) REFERENCES factures(id) ON DELETE CASCADE;

-- Ajouter la contrainte de clé étrangère pour client_id
ALTER TABLE liens_externes
ADD CONSTRAINT fk_liens_externes_client 
FOREIGN KEY (client_id) REFERENCES entreprises(id) ON DELETE CASCADE;

-- Modifier rfq_id pour qu'il soit nullable (puisque maintenant on peut avoir facture_id)
ALTER TABLE liens_externes
MODIFY COLUMN rfq_id INT NULL;

SELECT '✅ Migration liens_externes pour factures appliquée avec succès' AS message;

