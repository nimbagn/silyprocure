-- Script pour charger RFQ, Devis et Commandes
-- Utilise les entreprises et produits existants

USE silypro;

-- Récupérer les IDs existants
SET @fourn_tech = (SELECT id FROM entreprises WHERE nom = 'TechGuinée SARL' LIMIT 1);
SET @fourn_bureau = (SELECT id FROM entreprises WHERE nom = 'BureauPro Conakry' LIMIT 1);
SET @fourn_industrie = (SELECT id FROM entreprises WHERE nom = 'Industrie Guinée' LIMIT 1);
SET @prod_ord1 = (SELECT id FROM produits WHERE reference = 'ORD-PC-001' LIMIT 1);
SET @prod_ord2 = (SELECT id FROM produits WHERE reference = 'ORD-PC-002' LIMIT 1);
SET @prod_impr = (SELECT id FROM produits WHERE reference = 'IMPR-001' LIMIT 1);
SET @prod_bureau = (SELECT id FROM produits WHERE reference = 'BUREAU-001' LIMIT 1);
SET @prod_chaise = (SELECT id FROM produits WHERE reference = 'CHAISE-001' LIMIT 1);
SET @prod_gen = (SELECT id FROM produits WHERE reference = 'GEN-001' LIMIT 1);
SET @projet_it = (SELECT id FROM projets WHERE libelle = 'Modernisation IT' LIMIT 1);

-- Créer les projets si nécessaire
INSERT IGNORE INTO projets (libelle, description, date_debut, date_fin, budget, responsable_id, statut) VALUES
('Modernisation IT', 'Projet de modernisation du parc informatique', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 6 MONTH), 500000000.00, 1, 'en_cours'),
('Extension bâtiment', 'Construction d''une extension du bâtiment principal', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 12 MONTH), 2000000000.00, 1, 'en_cours');

SET @projet_it = (SELECT id FROM projets WHERE libelle = 'Modernisation IT' LIMIT 1);

-- RFQ
INSERT INTO rfq (numero, date_emission, date_limite_reponse, emetteur_id, destinataire_id, description, statut, projet_id) VALUES
('RFQ-2024-0001', DATE_SUB(CURDATE(), INTERVAL 15 DAY), DATE_ADD(CURDATE(), INTERVAL 15 DAY), 1, @fourn_tech, 'Demande de devis pour équipements informatiques - Projet Modernisation IT', 'en_cours', @projet_it),
('RFQ-2024-0002', DATE_SUB(CURDATE(), INTERVAL 10 DAY), DATE_ADD(CURDATE(), INTERVAL 20 DAY), 1, @fourn_bureau, 'Demande de devis pour mobilier de bureau', 'en_cours', NULL),
('RFQ-2024-0003', DATE_SUB(CURDATE(), INTERVAL 5 DAY), DATE_ADD(CURDATE(), INTERVAL 25 DAY), 1, @fourn_industrie, 'Demande de devis pour groupe électrogène', 'brouillon', NULL);

SET @rfq1 = (SELECT id FROM rfq WHERE numero = 'RFQ-2024-0001' LIMIT 1);
SET @rfq2 = (SELECT id FROM rfq WHERE numero = 'RFQ-2024-0002' LIMIT 1);
SET @rfq3 = (SELECT id FROM rfq WHERE numero = 'RFQ-2024-0003' LIMIT 1);

-- Lignes RFQ
INSERT INTO rfq_lignes (rfq_id, produit_id, reference, description, quantite, unite, ordre) VALUES
(@rfq1, @prod_ord1, 'ORD-PC-001', 'Ordinateur portable Dell Latitude', 10, 'unité', 1),
(@rfq1, @prod_ord2, 'ORD-PC-002', 'Ordinateur de bureau HP ProDesk', 5, 'unité', 2),
(@rfq1, @prod_impr, 'IMPR-001', 'Imprimante HP LaserJet Pro', 3, 'unité', 3),
(@rfq2, @prod_bureau, 'BUREAU-001', 'Bureau ergonomique 120cm', 15, 'unité', 1),
(@rfq2, @prod_chaise, 'CHAISE-001', 'Chaise de bureau ergonomique', 15, 'unité', 2),
(@rfq3, @prod_gen, 'GEN-001', 'Groupe électrogène 50KVA', 1, 'unité', 1);

-- Devis
INSERT INTO devis (numero, rfq_id, fournisseur_id, date_emission, date_validite, statut, remise_globale) VALUES
('DEV-2024-0001', @rfq1, @fourn_tech, DATE_SUB(CURDATE(), INTERVAL 5 DAY), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 'envoye', 5),
('DEV-2024-0002', @rfq2, @fourn_bureau, DATE_SUB(CURDATE(), INTERVAL 3 DAY), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 'envoye', 0);

SET @devis1 = (SELECT id FROM devis WHERE numero = 'DEV-2024-0001' LIMIT 1);
SET @devis2 = (SELECT id FROM devis WHERE numero = 'DEV-2024-0002' LIMIT 1);

-- Lignes devis
INSERT INTO devis_lignes (devis_id, produit_id, reference, description, quantite, prix_unitaire_ht, unite, tva_taux, total_ht, ordre) VALUES
(@devis1, @prod_ord1, 'ORD-PC-001', 'Ordinateur portable Dell Latitude', 10, 8200000, 'unité', 18, 82000000, 1),
(@devis1, @prod_ord2, 'ORD-PC-002', 'Ordinateur de bureau HP ProDesk', 5, 6300000, 'unité', 18, 31500000, 2),
(@devis1, @prod_impr, 'IMPR-001', 'Imprimante HP LaserJet Pro', 3, 3100000, 'unité', 18, 9300000, 3),
(@devis2, @prod_bureau, 'BUREAU-001', 'Bureau ergonomique 120cm', 15, 850000, 'unité', 18, 12750000, 1),
(@devis2, @prod_chaise, 'CHAISE-001', 'Chaise de bureau ergonomique', 15, 450000, 'unité', 18, 6750000, 2);

-- Mettre à jour les totaux des devis
UPDATE devis SET 
    total_ht = (SELECT COALESCE(SUM(total_ht), 0) FROM devis_lignes WHERE devis_id = devis.id),
    total_tva = (SELECT COALESCE(SUM(total_ht * tva_taux / 100), 0) FROM devis_lignes WHERE devis_id = devis.id),
    total_ttc = (SELECT COALESCE(SUM(total_ht * (1 + tva_taux / 100)), 0) FROM devis_lignes WHERE devis_id = devis.id)
WHERE id IN (@devis1, @devis2);

-- Commande
INSERT INTO commandes (numero, fournisseur_id, date_commande, date_livraison_prevue, statut, tva_taux, total_ht, total_tva, total_ttc) VALUES
('CMD-2024-0001', @fourn_tech, DATE_SUB(CURDATE(), INTERVAL 2 DAY), DATE_ADD(CURDATE(), INTERVAL 15 DAY), 'envoye', 18, 113500000, 20430000, 133930000);

SET @cmd1 = (SELECT id FROM commandes WHERE numero = 'CMD-2024-0001' LIMIT 1);

INSERT INTO commande_lignes (commande_id, produit_id, reference, description, quantite, prix_unitaire_ht, unite, ordre) VALUES
(@cmd1, @prod_ord1, 'ORD-PC-001', 'Ordinateur portable Dell Latitude', 10, 8200000, 'unité', 1),
(@cmd1, @prod_impr, 'IMPR-001', 'Imprimante HP LaserJet Pro', 3, 3100000, 'unité', 2);

SELECT '✅ RFQ, Devis et Commandes créés avec succès !' AS message;

