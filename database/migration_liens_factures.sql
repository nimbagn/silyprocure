-- Migration : Extension de la table liens_externes pour supporter les factures proforma
-- Permet de générer des liens de validation/signature pour les clients
-- Date : 2025-01-17

-- Pour MySQL (syntaxe compatible avec vérification d'existence)

SET @dbname = DATABASE();
SET @tablename = 'liens_externes';

-- Ajouter la colonne facture_id si elle n'existe pas
SET @columnname = 'facture_id';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' INT NULL COMMENT ''ID de la facture pour les liens de validation/signature''')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Ajouter la colonne type_lien si elle n'existe pas
SET @columnname2 = 'type_lien';
SET @preparedStatement2 = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname2)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname2, ' ENUM(''rfq'', ''facture'') DEFAULT ''rfq'' COMMENT ''Type de lien: rfq pour remplissage devis, facture pour validation/signature''')
));
PREPARE alterIfNotExists2 FROM @preparedStatement2;
EXECUTE alterIfNotExists2;
DEALLOCATE PREPARE alterIfNotExists2;

-- Ajouter la colonne client_id si elle n'existe pas
SET @columnname3 = 'client_id';
SET @preparedStatement3 = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname3)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname3, ' INT NULL COMMENT ''ID du client pour les liens de facture''')
));
PREPARE alterIfNotExists3 FROM @preparedStatement3;
EXECUTE alterIfNotExists3;
DEALLOCATE PREPARE alterIfNotExists3;

-- Modifier rfq_id pour qu'il soit nullable (puisque maintenant on peut avoir facture_id)
ALTER TABLE liens_externes
MODIFY COLUMN rfq_id INT NULL;

-- Ajouter les index s'ils n'existent pas
SET @indexname1 = 'idx_facture_id';
SET @preparedStatement4 = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (index_name = @indexname1)
  ) > 0,
  'SELECT 1',
  CONCAT('CREATE INDEX ', @indexname1, ' ON ', @tablename, ' (facture_id)')
));
PREPARE createIndexIfNotExists1 FROM @preparedStatement4;
EXECUTE createIndexIfNotExists1;
DEALLOCATE PREPARE createIndexIfNotExists1;

SET @indexname2 = 'idx_type_lien';
SET @preparedStatement5 = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (index_name = @indexname2)
  ) > 0,
  'SELECT 1',
  CONCAT('CREATE INDEX ', @indexname2, ' ON ', @tablename, ' (type_lien)')
));
PREPARE createIndexIfNotExists2 FROM @preparedStatement5;
EXECUTE createIndexIfNotExists2;
DEALLOCATE PREPARE createIndexIfNotExists2;

SET @indexname3 = 'idx_client_id';
SET @preparedStatement6 = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (index_name = @indexname3)
  ) > 0,
  'SELECT 1',
  CONCAT('CREATE INDEX ', @indexname3, ' ON ', @tablename, ' (client_id)')
));
PREPARE createIndexIfNotExists3 FROM @preparedStatement6;
EXECUTE createIndexIfNotExists3;
DEALLOCATE PREPARE createIndexIfNotExists3;

-- Ajouter les contraintes de clé étrangère si elles n'existent pas
-- Note: MySQL ne supporte pas IF NOT EXISTS pour les contraintes, on utilise un bloc conditionnel
SET @constraintname1 = 'fk_liens_externes_facture';
SET @preparedStatement7 = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (constraint_name = @constraintname1)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD CONSTRAINT ', @constraintname1, ' FOREIGN KEY (facture_id) REFERENCES factures(id) ON DELETE CASCADE')
));
PREPARE addConstraintIfNotExists1 FROM @preparedStatement7;
EXECUTE addConstraintIfNotExists1;
DEALLOCATE PREPARE addConstraintIfNotExists1;

SET @constraintname2 = 'fk_liens_externes_client';
SET @preparedStatement8 = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (constraint_name = @constraintname2)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD CONSTRAINT ', @constraintname2, ' FOREIGN KEY (client_id) REFERENCES entreprises(id) ON DELETE CASCADE')
));
PREPARE addConstraintIfNotExists2 FROM @preparedStatement8;
EXECUTE addConstraintIfNotExists2;
DEALLOCATE PREPARE addConstraintIfNotExists2;

SELECT '✅ Migration liens_externes pour factures appliquée avec succès' AS message;

