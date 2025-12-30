-- Migration : Ajouter géolocalisation (latitude, longitude) dans demandes_devis
-- Date : 2024

-- Ajouter les colonnes latitude et longitude
ALTER TABLE demandes_devis 
ADD COLUMN latitude DECIMAL(10, 8) NULL AFTER pays_livraison,
ADD COLUMN longitude DECIMAL(11, 8) NULL AFTER latitude;

-- Ajouter un index pour les recherches géographiques
ALTER TABLE demandes_devis 
ADD INDEX idx_geoloc (latitude, longitude);

-- Commentaires
ALTER TABLE demandes_devis 
MODIFY COLUMN latitude DECIMAL(10, 8) NULL COMMENT 'Latitude GPS de l\'adresse de livraison (optionnel)',
MODIFY COLUMN longitude DECIMAL(11, 8) NULL COMMENT 'Longitude GPS de l\'adresse de livraison (optionnel)';

