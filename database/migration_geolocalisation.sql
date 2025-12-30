-- Migration : Ajout de la géolocalisation
-- Date : 2024

USE silypro;

-- Ajouter les colonnes de géolocalisation à la table adresses
ALTER TABLE adresses 
ADD COLUMN latitude DECIMAL(10, 8) AFTER pays,
ADD COLUMN longitude DECIMAL(11, 8) AFTER latitude;

-- Créer un index pour les recherches géographiques
CREATE INDEX idx_location ON adresses(latitude, longitude);

-- Ajouter un champ pour les notes de géolocalisation
ALTER TABLE adresses 
ADD COLUMN notes_geolocalisation TEXT AFTER longitude;

