-- Migration : Catalogue fournisseur
-- Permet à chaque fournisseur d'avoir son propre catalogue de produits
-- Date : 2024

USE silypro;

-- Ajouter la colonne fournisseur_id à la table produits
-- NULL = produit générique (catalogue général)
-- NOT NULL = produit spécifique à un fournisseur
ALTER TABLE produits 
ADD COLUMN fournisseur_id INT NULL AFTER categorie_id,
ADD COLUMN reference_fournisseur VARCHAR(100) NULL AFTER reference,
ADD COLUMN prix_fournisseur DECIMAL(10,2) NULL AFTER prix_unitaire_ht,
ADD COLUMN disponible BOOLEAN DEFAULT TRUE AFTER actif,
ADD COLUMN delai_livraison_jours INT NULL AFTER disponible,
ADD COLUMN quantite_minimale DECIMAL(10,2) NULL AFTER delai_livraison_jours,
ADD COLUMN image_url VARCHAR(255) NULL AFTER quantite_minimale;

-- Ajouter la contrainte de clé étrangère
ALTER TABLE produits 
ADD CONSTRAINT fk_produit_fournisseur 
FOREIGN KEY (fournisseur_id) REFERENCES entreprises(id) ON DELETE CASCADE;

-- Créer un index sur fournisseur_id
CREATE INDEX idx_fournisseur ON produits(fournisseur_id);

-- Créer un index composite sur fournisseur_id et reference
CREATE INDEX idx_fournisseur_reference ON produits(fournisseur_id, reference);

-- Modifier la contrainte UNIQUE sur reference pour permettre les mêmes références pour différents fournisseurs
-- (mais unique par fournisseur)
ALTER TABLE produits DROP INDEX idx_reference;
ALTER TABLE produits DROP INDEX reference;

-- Note: MySQL ne supporte pas les index partiels avec WHERE
-- On va gérer l'unicité dans l'application :
-- - Pour les produits génériques (fournisseur_id NULL), la référence doit être unique
-- - Pour les produits fournisseur, la référence peut être la même pour différents fournisseurs
--   mais doit être unique pour un même fournisseur
-- On crée un index composite pour optimiser les recherches
-- (Vérifier si les index existent déjà avant de les créer)
SET @index_exists = (SELECT COUNT(*) FROM information_schema.statistics 
    WHERE table_schema = DATABASE() 
    AND table_name = 'produits' 
    AND index_name = 'idx_reference');
    
SET @index_fourn_exists = (SELECT COUNT(*) FROM information_schema.statistics 
    WHERE table_schema = DATABASE() 
    AND table_name = 'produits' 
    AND index_name = 'idx_fournisseur_reference');

SET @sql = IF(@index_exists = 0, 
    'CREATE INDEX idx_reference ON produits(reference)', 
    'SELECT "Index idx_reference existe déjà"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(@index_fourn_exists = 0, 
    'CREATE INDEX idx_fournisseur_reference ON produits(fournisseur_id, reference)', 
    'SELECT "Index idx_fournisseur_reference existe déjà"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Commentaires
ALTER TABLE produits MODIFY COLUMN fournisseur_id INT NULL COMMENT 'ID du fournisseur (NULL = produit générique)';
ALTER TABLE produits MODIFY COLUMN reference_fournisseur VARCHAR(100) NULL COMMENT 'Référence du produit chez le fournisseur';
ALTER TABLE produits MODIFY COLUMN prix_fournisseur DECIMAL(10,2) NULL COMMENT 'Prix proposé par le fournisseur (peut différer du prix catalogue)';
ALTER TABLE produits MODIFY COLUMN disponible BOOLEAN DEFAULT TRUE COMMENT 'Disponibilité du produit chez le fournisseur';
ALTER TABLE produits MODIFY COLUMN delai_livraison_jours INT NULL COMMENT 'Délai de livraison en jours';
ALTER TABLE produits MODIFY COLUMN quantite_minimale DECIMAL(10,2) NULL COMMENT 'Quantité minimale de commande';

SELECT '✅ Migration catalogue fournisseur appliquée avec succès' AS message;

