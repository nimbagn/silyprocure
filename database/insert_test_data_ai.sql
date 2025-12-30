-- Script de données de test pour les fonctionnalités IA
-- Crée une RFQ avec plusieurs devis pour tester l'analyse IA

USE silypro;

-- Variables pour les IDs existants
SET @admin_id = (SELECT id FROM utilisateurs WHERE role = 'admin' LIMIT 1);
SET @fourn_tech = (SELECT id FROM entreprises WHERE nom LIKE '%Tech%' OR secteur_activite LIKE '%Informatique%' LIMIT 1);
SET @fourn_bureau = (SELECT id FROM entreprises WHERE nom LIKE '%Bureau%' OR secteur_activite LIKE '%Bureau%' LIMIT 1);
SET @fourn_autre = (SELECT id FROM entreprises WHERE type = 'fournisseur' AND id NOT IN (@fourn_tech, @fourn_bureau) LIMIT 1);

-- Si aucun fournisseur n'existe, créer des fournisseurs de test
INSERT IGNORE INTO entreprises (nom, type, secteur_activite, email, telephone, ville, pays, actif)
VALUES
('TechGuinée SARL', 'fournisseur', 'Informatique', 'contact@techguinee.gn', '+224 XXX XXX XXX', 'Conakry', 'Guinée', 1),
('BureauPro Conakry', 'fournisseur', 'Mobilier de bureau', 'contact@bureaupro.gn', '+224 XXX XXX XXX', 'Conakry', 'Guinée', 1),
('Fournisseur Premium', 'fournisseur', 'Équipements professionnels', 'contact@premium.gn', '+224 XXX XXX XXX', 'Conakry', 'Guinée', 1);

-- Récupérer les IDs des fournisseurs
SET @fourn_tech = (SELECT id FROM entreprises WHERE nom = 'TechGuinée SARL' LIMIT 1);
SET @fourn_bureau = (SELECT id FROM entreprises WHERE nom = 'BureauPro Conakry' LIMIT 1);
SET @fourn_premium = (SELECT id FROM entreprises WHERE nom = 'Fournisseur Premium' LIMIT 1);

-- Créer des produits de test si nécessaire
INSERT IGNORE INTO categories (libelle, description, parent_id)
VALUES ('Informatique', 'Équipements informatiques', NULL);

SET @cat_info = (SELECT id FROM categories WHERE libelle = 'Informatique' LIMIT 1);

INSERT IGNORE INTO produits (reference, libelle, description, categorie_id, unite, actif)
VALUES
('ORD-PC-001', 'Ordinateur portable Dell Latitude', 'Ordinateur portable professionnel 15 pouces', @cat_info, 'unité', 1),
('ORD-PC-002', 'Ordinateur de bureau HP ProDesk', 'PC de bureau professionnel', @cat_info, 'unité', 1),
('IMPR-001', 'Imprimante HP LaserJet Pro', 'Imprimante laser professionnelle', @cat_info, 'unité', 1);

SET @prod_ord1 = (SELECT id FROM produits WHERE reference = 'ORD-PC-001' LIMIT 1);
SET @prod_ord2 = (SELECT id FROM produits WHERE reference = 'ORD-PC-002' LIMIT 1);
SET @prod_impr = (SELECT id FROM produits WHERE reference = 'IMPR-001' LIMIT 1);

-- Créer une RFQ de test pour l'analyse IA
INSERT INTO rfq (numero, date_emission, date_limite_reponse, emetteur_id, destinataire_id, description, statut, categorie_id)
VALUES
('RFQ-TEST-IA-001', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 15 DAY), @admin_id, @fourn_tech, 'RFQ de test pour analyse IA - Équipements informatiques', 'envoye', @cat_info)
ON DUPLICATE KEY UPDATE numero = numero;

SET @rfq_test = (SELECT id FROM rfq WHERE numero = 'RFQ-TEST-IA-001' LIMIT 1);

-- Créer les lignes RFQ
DELETE FROM rfq_lignes WHERE rfq_id = @rfq_test;

INSERT INTO rfq_lignes (rfq_id, produit_id, reference, description, quantite, unite, ordre)
VALUES
(@rfq_test, @prod_ord1, 'ORD-PC-001', 'Ordinateur portable Dell Latitude', 10, 'unité', 1),
(@rfq_test, @prod_ord2, 'ORD-PC-002', 'Ordinateur de bureau HP ProDesk', 5, 'unité', 2),
(@rfq_test, @prod_impr, 'IMPR-001', 'Imprimante HP LaserJet Pro', 3, 'unité', 3);

-- Créer plusieurs devis pour cette RFQ avec des prix variés pour tester l'analyse IA
-- Devis 1 : Prix moyen, bon délai, bonnes conditions
DELETE FROM devis_lignes WHERE devis_id IN (SELECT id FROM devis WHERE rfq_id = @rfq_test);
DELETE FROM devis WHERE rfq_id = @rfq_test;

INSERT INTO devis (numero, rfq_id, fournisseur_id, date_emission, date_validite, delai_livraison, 
                   remise_globale, total_ht, total_tva, total_ttc, conditions_paiement, garanties, 
                   certifications, notes, statut)
VALUES
-- Devis 1 : Meilleur rapport qualité/prix (score élevé attendu)
('DEV-TEST-IA-001', @rfq_test, @fourn_tech, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 15, 
 5, 122800000, 22104000, 144904000, '30% à la commande, 70% à la livraison', 'Garantie 1 an', 
 'ISO 9001', 'Devis compétitif avec bon délai', 'envoye'),

-- Devis 2 : Prix plus élevé mais meilleures garanties
('DEV-TEST-IA-002', @rfq_test, @fourn_premium, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 20, 
 0, 135000000, 24300000, 159300000, '50% à la commande, 50% à la livraison', 'Garantie 2 ans', 
 'ISO 9001, ISO 14001', 'Devis premium avec garanties étendues', 'envoye'),

-- Devis 3 : Prix le plus bas mais délai plus long
('DEV-TEST-IA-003', @rfq_test, @fourn_bureau, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 30, 
 10, 115000000, 20700000, 135700000, '100% à la livraison', 'Garantie 6 mois', 
 NULL, 'Prix très compétitif', 'envoye'),

-- Devis 4 : Prix anormalement bas (anomalie à détecter)
('DEV-TEST-IA-004', @rfq_test, @fourn_tech, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 25, 
 15, 90000000, 16200000, 106200000, '100% d\'avance', 'Garantie 3 mois', 
 NULL, 'Prix promotionnel', 'envoye');

SET @devis1 = (SELECT id FROM devis WHERE numero = 'DEV-TEST-IA-001' LIMIT 1);
SET @devis2 = (SELECT id FROM devis WHERE numero = 'DEV-TEST-IA-002' LIMIT 1);
SET @devis3 = (SELECT id FROM devis WHERE numero = 'DEV-TEST-IA-003' LIMIT 1);
SET @devis4 = (SELECT id FROM devis WHERE numero = 'DEV-TEST-IA-004' LIMIT 1);

-- Lignes pour Devis 1 (prix moyens)
INSERT INTO devis_lignes (devis_id, rfq_ligne_id, produit_id, reference, description, quantite, 
                          prix_unitaire_ht, unite, remise, tva_taux, total_ht, ordre)
SELECT @devis1, rl.id, rl.produit_id, rl.reference, rl.description, rl.quantite,
       CASE 
           WHEN rl.reference = 'ORD-PC-001' THEN 8500000
           WHEN rl.reference = 'ORD-PC-002' THEN 6500000
           WHEN rl.reference = 'IMPR-001' THEN 3200000
       END as prix_unitaire_ht,
       rl.unite, 0, 18,
       CASE 
           WHEN rl.reference = 'ORD-PC-001' THEN 8500000 * rl.quantite
           WHEN rl.reference = 'ORD-PC-002' THEN 6500000 * rl.quantite
           WHEN rl.reference = 'IMPR-001' THEN 3200000 * rl.quantite
       END as total_ht,
       rl.ordre
FROM rfq_lignes rl
WHERE rl.rfq_id = @rfq_test;

-- Lignes pour Devis 2 (prix plus élevés)
INSERT INTO devis_lignes (devis_id, rfq_ligne_id, produit_id, reference, description, quantite, 
                          prix_unitaire_ht, unite, remise, tva_taux, total_ht, ordre)
SELECT @devis2, rl.id, rl.produit_id, rl.reference, rl.description, rl.quantite,
       CASE 
           WHEN rl.reference = 'ORD-PC-001' THEN 9200000
           WHEN rl.reference = 'ORD-PC-002' THEN 7000000
           WHEN rl.reference = 'IMPR-001' THEN 3500000
       END as prix_unitaire_ht,
       rl.unite, 0, 18,
       CASE 
           WHEN rl.reference = 'ORD-PC-001' THEN 9200000 * rl.quantite
           WHEN rl.reference = 'ORD-PC-002' THEN 7000000 * rl.quantite
           WHEN rl.reference = 'IMPR-001' THEN 3500000 * rl.quantite
       END as total_ht,
       rl.ordre
FROM rfq_lignes rl
WHERE rl.rfq_id = @rfq_test;

-- Lignes pour Devis 3 (prix bas)
INSERT INTO devis_lignes (devis_id, rfq_ligne_id, produit_id, reference, description, quantite, 
                          prix_unitaire_ht, unite, remise, tva_taux, total_ht, ordre)
SELECT @devis3, rl.id, rl.produit_id, rl.reference, rl.description, rl.quantite,
       CASE 
           WHEN rl.reference = 'ORD-PC-001' THEN 8000000
           WHEN rl.reference = 'ORD-PC-002' THEN 6000000
           WHEN rl.reference = 'IMPR-001' THEN 3000000
       END as prix_unitaire_ht,
       rl.unite, 0, 18,
       CASE 
           WHEN rl.reference = 'ORD-PC-001' THEN 8000000 * rl.quantite
           WHEN rl.reference = 'ORD-PC-002' THEN 6000000 * rl.quantite
           WHEN rl.reference = 'IMPR-001' THEN 3000000 * rl.quantite
       END as total_ht,
       rl.ordre
FROM rfq_lignes rl
WHERE rl.rfq_id = @rfq_test;

-- Lignes pour Devis 4 (prix anormalement bas - anomalie)
INSERT INTO devis_lignes (devis_id, rfq_ligne_id, produit_id, reference, description, quantite, 
                          prix_unitaire_ht, unite, remise, tva_taux, total_ht, ordre)
SELECT @devis4, rl.id, rl.produit_id, rl.reference, rl.description, rl.quantite,
       CASE 
           WHEN rl.reference = 'ORD-PC-001' THEN 6500000
           WHEN rl.reference = 'ORD-PC-002' THEN 5000000
           WHEN rl.reference = 'IMPR-001' THEN 2500000
       END as prix_unitaire_ht,
       rl.unite, 0, 18,
       CASE 
           WHEN rl.reference = 'ORD-PC-001' THEN 6500000 * rl.quantite
           WHEN rl.reference = 'ORD-PC-002' THEN 5000000 * rl.quantite
           WHEN rl.reference = 'IMPR-001' THEN 2500000 * rl.quantite
       END as total_ht,
       rl.ordre
FROM rfq_lignes rl
WHERE rl.rfq_id = @rfq_test;

-- Mettre à jour les totaux des devis (recalculer)
UPDATE devis d
SET 
    d.total_ht = (
        SELECT COALESCE(SUM(dl.total_ht), 0) * (1 - d.remise_globale / 100)
        FROM devis_lignes dl
        WHERE dl.devis_id = d.id
    ),
    d.total_tva = (
        SELECT COALESCE(SUM(dl.total_ht * dl.tva_taux / 100), 0) * (1 - d.remise_globale / 100)
        FROM devis_lignes dl
        WHERE dl.devis_id = d.id
    ),
    d.total_ttc = (
        SELECT COALESCE(SUM(dl.total_ht * (1 + dl.tva_taux / 100)), 0) * (1 - d.remise_globale / 100)
        FROM devis_lignes dl
        WHERE dl.devis_id = d.id
    )
WHERE d.rfq_id = @rfq_test;

-- Afficher les IDs créés pour faciliter les tests
SELECT 
    d.id as devis_id,
    d.numero,
    e.nom as fournisseur,
    d.total_ttc,
    d.delai_livraison,
    d.garanties
FROM devis d
LEFT JOIN entreprises e ON d.fournisseur_id = e.id
WHERE d.rfq_id = @rfq_test
ORDER BY d.total_ttc;

