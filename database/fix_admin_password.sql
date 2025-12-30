-- Script pour corriger le mot de passe admin avec le hash bcrypt correct
-- Le mot de passe est "12345" (hashé avec bcryptjs)

USE silypro;

-- Hash bcrypt de "12345" (10 rounds)
UPDATE utilisateurs 
SET mot_de_passe = '$2a$10$GyNtpn93D89sK/NGGw3IA.DWZmfynow6TffQusyqj80NwX2OpfI2i'
WHERE email = 'admin@silyprocure.com';

-- Vérification
SELECT email, nom, prenom, role, actif, LEFT(mot_de_passe, 20) as mot_de_passe_preview 
FROM utilisateurs 
WHERE email = 'admin@silyprocure.com';

