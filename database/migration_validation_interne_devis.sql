-- Migration pour ajouter le champ validation_interne dans la table devis
-- Permet de gérer la validation interne des devis fournisseurs avant envoi au client

-- Vérifier si la colonne existe avant de l'ajouter (MySQL)
SET @dbname = DATABASE();
SET @tablename = 'devis';
SET @columnname = 'validation_interne';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' ENUM(''en_attente_validation'', ''valide_interne'', ''refuse_interne'') DEFAULT ''en_attente_validation'' COMMENT ''Statut de validation interne du devis par l''''équipe''')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Ajouter une colonne pour les commentaires de validation interne
SET @columnname2 = 'commentaire_validation_interne';
SET @preparedStatement2 = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname2)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname2, ' TEXT NULL COMMENT ''Commentaires de l''''équipe lors de la validation interne''')
));
PREPARE alterIfNotExists2 FROM @preparedStatement2;
EXECUTE alterIfNotExists2;
DEALLOCATE PREPARE alterIfNotExists2;

-- Ajouter une colonne pour l'utilisateur qui a validé
SET @columnname3 = 'valide_par_id';
SET @preparedStatement3 = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname3)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname3, ' INT NULL COMMENT ''ID de l''''utilisateur qui a validé le devis en interne'', ADD FOREIGN KEY (', @columnname3, ') REFERENCES utilisateurs(id) ON DELETE SET NULL')
));
PREPARE alterIfNotExists3 FROM @preparedStatement3;
EXECUTE alterIfNotExists3;
DEALLOCATE PREPARE alterIfNotExists3;

-- Ajouter une colonne pour la date de validation interne
SET @columnname4 = 'date_validation_interne';
SET @preparedStatement4 = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname4)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname4, ' DATETIME NULL COMMENT ''Date de validation interne du devis''')
));
PREPARE alterIfNotExists4 FROM @preparedStatement4;
EXECUTE alterIfNotExists4;
DEALLOCATE PREPARE alterIfNotExists4;

-- Ajouter un index pour améliorer les performances des requêtes
SET @indexname = 'idx_validation_interne';
SET @preparedStatement5 = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (index_name = @indexname)
  ) > 0,
  'SELECT 1',
  CONCAT('CREATE INDEX ', @indexname, ' ON ', @tablename, ' (', @columnname, ')')
));
PREPARE createIndexIfNotExists FROM @preparedStatement5;
EXECUTE createIndexIfNotExists;
DEALLOCATE PREPARE createIndexIfNotExists;

