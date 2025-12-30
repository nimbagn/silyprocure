-- Migration : Catalogue fournisseur (version sécurisée)
-- Vérifie l'existence des colonnes avant de les ajouter
-- Date : 2024

USE silypro;

-- Fonction pour ajouter une colonne seulement si elle n'existe pas
-- (MySQL ne supporte pas IF NOT EXISTS pour ALTER TABLE, donc on utilise une procédure)

DELIMITER $$

DROP PROCEDURE IF EXISTS add_column_if_not_exists$$
CREATE PROCEDURE add_column_if_not_exists(
    IN table_name VARCHAR(64),
    IN column_name VARCHAR(64),
    IN column_definition TEXT
)
BEGIN
    DECLARE column_exists INT DEFAULT 0;
    
    SELECT COUNT(*) INTO column_exists
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = table_name
    AND COLUMN_NAME = column_name;
    
    IF column_exists = 0 THEN
        SET @sql = CONCAT('ALTER TABLE ', table_name, ' ADD COLUMN ', column_name, ' ', column_definition);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END$$

DELIMITER ;

-- Ajouter les colonnes si elles n'existent pas
CALL add_column_if_not_exists('produits', 'fournisseur_id', 'INT NULL AFTER categorie_id');
CALL add_column_if_not_exists('produits', 'reference_fournisseur', 'VARCHAR(100) NULL AFTER reference');
CALL add_column_if_not_exists('produits', 'prix_fournisseur', 'DECIMAL(10,2) NULL AFTER prix_unitaire_ht');
CALL add_column_if_not_exists('produits', 'disponible', 'BOOLEAN DEFAULT TRUE AFTER actif');
CALL add_column_if_not_exists('produits', 'delai_livraison_jours', 'INT NULL AFTER disponible');
CALL add_column_if_not_exists('produits', 'quantite_minimale', 'DECIMAL(10,2) NULL AFTER delai_livraison_jours');
CALL add_column_if_not_exists('produits', 'image_url', 'VARCHAR(255) NULL AFTER quantite_minimale');

-- Ajouter la contrainte de clé étrangère si elle n'existe pas
SET @fk_exists = (SELECT COUNT(*) FROM information_schema.table_constraints 
    WHERE constraint_schema = DATABASE() 
    AND table_name = 'produits' 
    AND constraint_name = 'fk_produit_fournisseur');

SET @sql = IF(@fk_exists = 0,
    'ALTER TABLE produits ADD CONSTRAINT fk_produit_fournisseur FOREIGN KEY (fournisseur_id) REFERENCES entreprises(id) ON DELETE CASCADE',
    'SELECT "Contrainte fk_produit_fournisseur existe déjà"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Créer les index s'ils n'existent pas
SET @index_exists = (SELECT COUNT(*) FROM information_schema.statistics 
    WHERE table_schema = DATABASE() 
    AND table_name = 'produits' 
    AND index_name = 'idx_fournisseur');
    
SET @sql = IF(@index_exists = 0,
    'CREATE INDEX idx_fournisseur ON produits(fournisseur_id)',
    'SELECT "Index idx_fournisseur existe déjà"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_fourn_ref_exists = (SELECT COUNT(*) FROM information_schema.statistics 
    WHERE table_schema = DATABASE() 
    AND table_name = 'produits' 
    AND index_name = 'idx_fournisseur_reference');
    
SET @sql = IF(@index_fourn_ref_exists = 0,
    'CREATE INDEX idx_fournisseur_reference ON produits(fournisseur_id, reference)',
    'SELECT "Index idx_fournisseur_reference existe déjà"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Nettoyer la procédure
DROP PROCEDURE IF EXISTS add_column_if_not_exists;

-- Commentaires
ALTER TABLE produits MODIFY COLUMN fournisseur_id INT NULL COMMENT 'ID du fournisseur (NULL = produit générique)';
ALTER TABLE produits MODIFY COLUMN reference_fournisseur VARCHAR(100) NULL COMMENT 'Référence du produit chez le fournisseur';
ALTER TABLE produits MODIFY COLUMN prix_fournisseur DECIMAL(10,2) NULL COMMENT 'Prix proposé par le fournisseur (peut différer du prix catalogue)';
ALTER TABLE produits MODIFY COLUMN disponible BOOLEAN DEFAULT TRUE COMMENT 'Disponibilité du produit chez le fournisseur';
ALTER TABLE produits MODIFY COLUMN delai_livraison_jours INT NULL COMMENT 'Délai de livraison en jours';
ALTER TABLE produits MODIFY COLUMN quantite_minimale DECIMAL(10,2) NULL COMMENT 'Quantité minimale de commande';

SELECT '✅ Migration catalogue fournisseur appliquée avec succès' AS message;

