-- Migration : Ajouter les liens entre demandes_devis, devis et commandes
-- Permet de suivre le parcours complet : demande client → devis client → commande

-- Ajouter demande_devis_id dans la table devis
ALTER TABLE devis 
ADD COLUMN IF NOT EXISTS demande_devis_id INT NULL COMMENT 'ID de la demande de devis client d\'origine' 
AFTER rfq_id;

-- Ajouter l'index et la clé étrangère
ALTER TABLE devis 
ADD INDEX IF NOT EXISTS idx_demande_devis_id (demande_devis_id);

ALTER TABLE devis 
ADD CONSTRAINT fk_devis_demande_devis 
FOREIGN KEY (demande_devis_id) REFERENCES demandes_devis(id) ON DELETE SET NULL;

-- Ajouter demande_devis_id dans la table commandes
ALTER TABLE commandes 
ADD COLUMN IF NOT EXISTS demande_devis_id INT NULL COMMENT 'ID de la demande de devis client d\'origine' 
AFTER devis_id;

-- Ajouter l'index et la clé étrangère
ALTER TABLE commandes 
ADD INDEX IF NOT EXISTS idx_commande_demande_devis_id (demande_devis_id);

ALTER TABLE commandes 
ADD CONSTRAINT fk_commande_demande_devis 
FOREIGN KEY (demande_devis_id) REFERENCES demandes_devis(id) ON DELETE SET NULL;

