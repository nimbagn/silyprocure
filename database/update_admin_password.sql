-- Script pour mettre à jour le mot de passe admin avec un hash bcryptjs compatible
-- Le nouveau mot de passe est "password" (à changer en production)

USE silypro;

-- Mettre à jour le mot de passe admin avec un hash bcryptjs valide
-- Hash de "password" généré avec bcryptjs (10 rounds)
UPDATE utilisateurs 
SET mot_de_passe = '$2a$10$wWha4smxDlP/9X7fRAdT3uf/jMA5hu21.IqYpjZ1zOzdu5nQSI9NK'
WHERE email = 'admin@silyprocure.com';

-- Vérification
SELECT email, nom, prenom, role, actif FROM utilisateurs WHERE email = 'admin@silyprocure.com';

