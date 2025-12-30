-- Migration pour ajouter le système de marge commerciale
-- Permet de majorer les devis reçus avant de créer des factures pour les clients

-- Table pour stocker les configurations de marge
CREATE TABLE IF NOT EXISTS marges_commerciales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    pourcentage DECIMAL(5,2) NOT NULL DEFAULT 20.00,
    description TEXT,
    actif BOOLEAN DEFAULT TRUE,
    date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
    date_modification DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_actif (actif)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insérer une marge par défaut de 20%
INSERT INTO marges_commerciales (nom, pourcentage, description, actif) 
VALUES ('Marge standard', 20.00, 'Marge commerciale standard de 20%', TRUE)
ON DUPLICATE KEY UPDATE nom=nom;

-- Ajouter une colonne pour stocker le prix d'achat (prix du fournisseur) dans les lignes de facture
-- Vérifier si les colonnes existent avant de les ajouter
SET @dbname = DATABASE();
SET @tablename = 'facture_lignes';
SET @columnname1 = 'prix_achat_ht';
SET @columnname2 = 'marge_appliquee';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname1)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname1, ' DECIMAL(12,2) DEFAULT NULL COMMENT ''Prix d\'\'achat HT (prix du fournisseur avant majoration)''')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname2)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname2, ' DECIMAL(5,2) DEFAULT NULL COMMENT ''Pourcentage de marge appliquée''')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Ajouter une colonne pour stocker le total d'achat dans la facture
SET @tablename2 = 'factures';
SET @columnname3 = 'total_achat_ht';
SET @columnname4 = 'marge_totale';

SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename2)
      AND (table_schema = @dbname)
      AND (column_name = @columnname3)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename2, ' ADD COLUMN ', @columnname3, ' DECIMAL(12,2) DEFAULT 0.00 COMMENT ''Total HT d\'\'achat (prix fournisseur avant majoration)''')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename2)
      AND (table_schema = @dbname)
      AND (column_name = @columnname4)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename2, ' ADD COLUMN ', @columnname4, ' DECIMAL(12,2) DEFAULT 0.00 COMMENT ''Marge totale générée''')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

