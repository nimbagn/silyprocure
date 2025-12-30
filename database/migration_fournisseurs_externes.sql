-- Migration : Support des fournisseurs externes
-- Permet de distinguer les fournisseurs avec compte sur la plateforme des fournisseurs externes
-- Date : 2024

USE silypro;

-- Ajouter la colonne externe à la table entreprises
-- TRUE = fournisseur externe (pas de compte sur la plateforme)
-- FALSE ou NULL = fournisseur avec compte sur la plateforme
ALTER TABLE entreprises 
ADD COLUMN externe BOOLEAN DEFAULT FALSE AFTER actif;

-- Créer un index sur externe pour les requêtes de filtrage
CREATE INDEX idx_externe ON entreprises(externe);

-- Ajouter le rôle superviseur dans la table utilisateurs
-- Note: MySQL ne permet pas de modifier un ENUM directement, on doit le recréer
-- Pour l'instant, on va utiliser une approche différente en ajoutant une note
-- Le rôle superviseur sera géré au niveau applicatif

-- Mettre à jour les commentaires
ALTER TABLE entreprises MODIFY COLUMN externe BOOLEAN DEFAULT FALSE COMMENT 'TRUE si le fournisseur est externe (pas de compte sur la plateforme)';

-- Vérification
DESCRIBE entreprises;

SELECT '✅ Migration fournisseurs externes appliquée avec succès' AS message;

