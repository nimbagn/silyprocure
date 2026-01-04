-- Script pour ajouter le rôle "superviseur" à la contrainte CHECK existante
-- À exécuter sur la base de données PostgreSQL existante

-- Supprimer l'ancienne contrainte
ALTER TABLE utilisateurs DROP CONSTRAINT IF EXISTS chk_role;
ALTER TABLE utilisateurs DROP CONSTRAINT IF EXISTS utilisateurs_role_check;

-- Ajouter la nouvelle contrainte avec le rôle superviseur
ALTER TABLE utilisateurs 
ADD CONSTRAINT chk_role CHECK (role IN ('admin', 'superviseur', 'acheteur', 'approbateur', 'comptable', 'viewer'));

-- Vérifier que la contrainte a été créée
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'utilisateurs'::regclass 
AND conname = 'chk_role';

