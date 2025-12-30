-- Script de création de l'utilisateur et de la base de données SilyProcure
-- À exécuter en tant que root ou administrateur MySQL

-- Créer l'utilisateur 'soul' s'il n'existe pas
CREATE USER IF NOT EXISTS 'soul'@'localhost' IDENTIFIED BY 'Satina2025';

-- Créer la base de données si elle n'existe pas
CREATE DATABASE IF NOT EXISTS silypro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Accorder tous les privilèges sur la base silypro à l'utilisateur soul
GRANT ALL PRIVILEGES ON silypro.* TO 'soul'@'localhost';

-- Appliquer les changements
FLUSH PRIVILEGES;

-- Afficher un message de confirmation
SELECT 'Utilisateur soul créé avec succès' AS message;

