-- Migration pour ajouter les colonnes stock_disponible et caracteristiques_techniques à la table produits
-- Ces colonnes sont optionnelles car le fournisseur peut ne pas donner son stock

USE silypro;

-- Désactiver temporairement les vérifications de clés étrangères si nécessaire
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Ajouter la colonne stock_disponible (optionnelle, NULL autorisé)
ALTER TABLE produits
ADD COLUMN stock_disponible INT NULL DEFAULT NULL AFTER unite;

-- 2. Ajouter la colonne caracteristiques_techniques (optionnelle, NULL autorisé)
ALTER TABLE produits
ADD COLUMN caracteristiques_techniques TEXT NULL DEFAULT NULL AFTER description;

-- Réactiver les vérifications de clés étrangères
SET FOREIGN_KEY_CHECKS = 1;

-- Vérification
DESCRIBE produits;

