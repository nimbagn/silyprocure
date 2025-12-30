-- Migration : Ajout RCCM et changement monnaie GNF
-- Date : 2024

USE silypro;

-- Ajouter la colonne RCCM à la table entreprises
ALTER TABLE entreprises 
ADD COLUMN rccm VARCHAR(50) AFTER siret,
ADD COLUMN numero_contribuable VARCHAR(50) AFTER rccm,
ADD COLUMN capital_social DECIMAL(15,2) AFTER numero_contribuable,
ADD COLUMN forme_juridique VARCHAR(100) AFTER capital_social,
ADD COLUMN secteur_activite VARCHAR(255) AFTER forme_juridique;

-- Créer un index sur RCCM
CREATE INDEX idx_rccm ON entreprises(rccm);

-- Mettre à jour les commentaires
ALTER TABLE entreprises MODIFY COLUMN siret VARCHAR(14) COMMENT 'SIRET (optionnel, pour entreprises françaises)';
ALTER TABLE entreprises MODIFY COLUMN rccm VARCHAR(50) COMMENT 'RCCM (Registre du Commerce et du Crédit Mobilier)';

-- Mettre à jour le pays par défaut dans adresses
ALTER TABLE adresses MODIFY COLUMN pays VARCHAR(100) DEFAULT 'Guinée';

-- Mettre à jour les paramètres pour la monnaie
UPDATE parametres SET valeur = 'GNF' WHERE cle = 'monnaie';
INSERT INTO parametres (cle, valeur, type_valeur, description) 
VALUES ('monnaie', 'GNF', 'string', 'Monnaie utilisée (Franc guinéen)')
ON DUPLICATE KEY UPDATE valeur = 'GNF';

