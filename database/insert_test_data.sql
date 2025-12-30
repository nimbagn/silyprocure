-- =====================================================
-- SilyProcure - Données de test
-- Script pour insérer des données de démonstration
-- =====================================================

USE silypro;

-- =====================================================
-- CATÉGORIES (si elles n'existent pas déjà)
-- =====================================================
INSERT IGNORE INTO categories (libelle, description, actif) VALUES
('Matériel informatique', 'Ordinateurs, serveurs, périphériques', TRUE),
('Fournitures de bureau', 'Papeterie, mobilier de bureau', TRUE),
('Équipements industriels', 'Machines, outils, équipements lourds', TRUE),
('Services', 'Prestations de services divers', TRUE),
('Matériaux de construction', 'Ciment, fer, bois, etc.', TRUE);

-- Récupérer les IDs des catégories
SET @cat_info = (SELECT id FROM categories WHERE libelle = 'Matériel informatique' LIMIT 1);
SET @cat_bureau = (SELECT id FROM categories WHERE libelle = 'Fournitures de bureau' LIMIT 1);
SET @cat_industriel = (SELECT id FROM categories WHERE libelle = 'Équipements industriels' LIMIT 1);
SET @cat_service = (SELECT id FROM categories WHERE libelle = 'Services' LIMIT 1);
SET @cat_construction = (SELECT id FROM categories WHERE libelle = 'Matériaux de construction' LIMIT 1);

-- =====================================================
-- ENTREPRISES
-- =====================================================
INSERT INTO entreprises (nom, raison_sociale, rccm, numero_contribuable, capital_social, forme_juridique, secteur_activite, type_entreprise, email, telephone, site_web, actif) VALUES
-- Fournisseurs
('TechGuinée SARL', 'TechGuinée Société à Responsabilité Limitée', 'RG-001-2020-A-12345', 'NC-001-2020', 50000000, 'SARL', 'Technologie et informatique', 'fournisseur', 'contact@techguinee.gn', '+224 612 34 56 78', 'https://www.techguinee.gn', TRUE),
('BureauPro Conakry', 'BureauPro Conakry SA', 'RG-002-2019-A-23456', 'NC-002-2019', 100000000, 'SA', 'Fournitures de bureau', 'fournisseur', 'info@bureaupro.gn', '+224 623 45 67 89', 'https://www.bureaupro.gn', TRUE),
('Industrie Guinée', 'Industrie Guinée SARL', 'RG-003-2021-A-34567', 'NC-003-2021', 200000000, 'SARL', 'Équipements industriels', 'fournisseur', 'ventes@industrie.gn', '+224 634 56 78 90', NULL, TRUE),
('Services Pro', 'Services Pro SARL', 'RG-004-2020-A-45678', 'NC-004-2020', 30000000, 'SARL', 'Services professionnels', 'fournisseur', 'contact@servicespro.gn', '+224 645 67 89 01', NULL, TRUE),
('MatConakry', 'Matériaux Conakry SA', 'RG-005-2018-A-56789', 'NC-005-2018', 150000000, 'SA', 'Matériaux de construction', 'fournisseur', 'info@matconakry.gn', '+224 656 78 90 12', 'https://www.matconakry.gn', TRUE),

-- Clients
('Ministère des Finances', 'Ministère des Finances de la République de Guinée', NULL, NULL, NULL, 'Administration publique', 'Administration', 'client', 'contact@finances.gov.gn', '+224 30 45 67 89', 'https://www.finances.gov.gn', TRUE),
('Entreprise Nationale', 'Entreprise Nationale SA', 'RG-010-2015-A-11111', 'NC-010-2015', 500000000, 'SA', 'Services publics', 'client', 'contact@entnationale.gn', '+224 30 12 34 56', NULL, TRUE),

-- Transporteurs
('TransGuinée', 'Transport Guinée SARL', 'RG-020-2019-A-22222', 'NC-020-2019', 50000000, 'SARL', 'Transport et logistique', 'transporteur', 'contact@transguinee.gn', '+224 624 11 22 33', NULL, TRUE),
('Logistique Express', 'Logistique Express SARL', 'RG-021-2020-A-33333', 'NC-021-2020', 30000000, 'SARL', 'Transport express', 'transporteur', 'info@logexpress.gn', '+224 625 22 33 44', NULL, TRUE);

-- Récupérer les IDs des entreprises
SET @fourn_tech = (SELECT id FROM entreprises WHERE nom = 'TechGuinée SARL' LIMIT 1);
SET @fourn_bureau = (SELECT id FROM entreprises WHERE nom = 'BureauPro Conakry' LIMIT 1);
SET @fourn_industrie = (SELECT id FROM entreprises WHERE nom = 'Industrie Guinée' LIMIT 1);
SET @fourn_service = (SELECT id FROM entreprises WHERE nom = 'Services Pro' LIMIT 1);
SET @fourn_mat = (SELECT id FROM entreprises WHERE nom = 'MatConakry' LIMIT 1);
SET @client_min = (SELECT id FROM entreprises WHERE nom = 'Ministère des Finances' LIMIT 1);
SET @client_ent = (SELECT id FROM entreprises WHERE nom = 'Entreprise Nationale' LIMIT 1);

-- =====================================================
-- ADRESSES (pour quelques entreprises)
-- =====================================================
INSERT INTO adresses (entreprise_id, type_adresse, libelle, adresse_ligne1, code_postal, ville, pays, principal) VALUES
(@fourn_tech, 'siege', 'Siège social', 'Route du Niger, Immeuble Tech', '', 'Conakry', 'Guinée', TRUE),
(@fourn_bureau, 'siege', 'Siège social', 'Boulevard du Commerce', '', 'Conakry', 'Guinée', TRUE),
(@fourn_industrie, 'siege', 'Siège social', 'Zone industrielle de Kagbélén', '', 'Conakry', 'Guinée', TRUE),
(@client_min, 'siege', 'Ministère', 'Avenue de la République', '', 'Conakry', 'Guinée', TRUE);

-- =====================================================
-- PRODUITS
-- =====================================================
INSERT INTO produits (reference, libelle, categorie_id, prix_unitaire_ht, unite, tva_taux, description) VALUES
-- Matériel informatique
('ORD-PC-001', 'Ordinateur portable Dell Latitude', @cat_info, 8500000, 'unité', 18, 'Ordinateur portable professionnel, Intel Core i5, 8GB RAM, 256GB SSD'),
('ORD-PC-002', 'Ordinateur de bureau HP ProDesk', @cat_info, 6500000, 'unité', 18, 'PC de bureau professionnel, Intel Core i5, 8GB RAM, 500GB HDD'),
('SERVEUR-001', 'Serveur Dell PowerEdge', @cat_info, 25000000, 'unité', 18, 'Serveur rack 1U, Intel Xeon, 16GB RAM, 2x500GB HDD'),
('IMPR-001', 'Imprimante HP LaserJet Pro', @cat_info, 3200000, 'unité', 18, 'Imprimante laser monochrome, réseau, recto-verso automatique'),

-- Fournitures de bureau
('BUREAU-001', 'Bureau ergonomique 120cm', @cat_bureau, 850000, 'unité', 18, 'Bureau en bois massif, tiroirs intégrés'),
('CHAISE-001', 'Chaise de bureau ergonomique', @cat_bureau, 450000, 'unité', 18, 'Chaise pivotante, dossier réglable, accoudoirs'),
('PAPIER-001', 'Rame de papier A4 80g', @cat_bureau, 25000, 'unité', 18, 'Papier blanc, 500 feuilles par rame'),

-- Équipements industriels
('GEN-001', 'Groupe électrogène 50KVA', @cat_industriel, 45000000, 'unité', 18, 'Groupe électrogène diesel, 50KVA, silencieux'),
('COMP-001', 'Compresseur d''air industriel', @cat_industriel, 12000000, 'unité', 18, 'Compresseur 100L, 3CV, avec accessoires'),

-- Matériaux de construction
('CIMENT-001', 'Ciment Portland 50kg', @cat_construction, 75000, 'sac', 18, 'Ciment de qualité supérieure, sac de 50kg'),
('FER-001', 'Barre de fer à béton 12mm', @cat_construction, 12000, 'mètre', 18, 'Barre de fer lisse, diamètre 12mm');

-- =====================================================
-- PROJETS (optionnel)
-- =====================================================
INSERT INTO projets (libelle, description, date_debut, date_fin, budget, responsable_id, statut) VALUES
('Modernisation IT', 'Projet de modernisation du parc informatique', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 6 MONTH), 500000000.00, 1, 'en_cours'),
('Extension bâtiment', 'Construction d''une extension du bâtiment principal', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 12 MONTH), 2000000000.00, 1, 'en_cours');

-- =====================================================
-- RFQ (Demandes de devis)
-- =====================================================
SET @projet_it = (SELECT id FROM projets WHERE libelle = 'Modernisation IT' LIMIT 1);

INSERT INTO rfq (numero, date_emission, date_limite_reponse, emetteur_id, destinataire_id, description, statut, projet_id) VALUES
('RFQ-2024-0001', DATE_SUB(CURDATE(), INTERVAL 15 DAY), DATE_ADD(CURDATE(), INTERVAL 15 DAY), 1, @fourn_tech, 'Demande de devis pour équipements informatiques - Projet Modernisation IT', 'en_cours', @projet_it),
('RFQ-2024-0002', DATE_SUB(CURDATE(), INTERVAL 10 DAY), DATE_ADD(CURDATE(), INTERVAL 20 DAY), 1, @fourn_bureau, 'Demande de devis pour mobilier de bureau', 'en_cours', NULL),
('RFQ-2024-0003', DATE_SUB(CURDATE(), INTERVAL 5 DAY), DATE_ADD(CURDATE(), INTERVAL 25 DAY), 1, @fourn_industrie, 'Demande de devis pour groupe électrogène', 'brouillon', NULL);

-- Lignes RFQ
SET @rfq1 = (SELECT id FROM rfq WHERE numero = 'RFQ-2024-0001' LIMIT 1);
SET @rfq2 = (SELECT id FROM rfq WHERE numero = 'RFQ-2024-0002' LIMIT 1);
SET @rfq3 = (SELECT id FROM rfq WHERE numero = 'RFQ-2024-0003' LIMIT 1);

SET @prod_ord1 = (SELECT id FROM produits WHERE reference = 'ORD-PC-001' LIMIT 1);
SET @prod_ord2 = (SELECT id FROM produits WHERE reference = 'ORD-PC-002' LIMIT 1);
SET @prod_impr = (SELECT id FROM produits WHERE reference = 'IMPR-001' LIMIT 1);
SET @prod_bureau = (SELECT id FROM produits WHERE reference = 'BUREAU-001' LIMIT 1);
SET @prod_chaise = (SELECT id FROM produits WHERE reference = 'CHAISE-001' LIMIT 1);
SET @prod_gen = (SELECT id FROM produits WHERE reference = 'GEN-001' LIMIT 1);

INSERT INTO rfq_lignes (rfq_id, produit_id, reference, description, quantite, unite, ordre) VALUES
(@rfq1, @prod_ord1, 'ORD-PC-001', 'Ordinateur portable Dell Latitude', 10, 'unité', 1),
(@rfq1, @prod_ord2, 'ORD-PC-002', 'Ordinateur de bureau HP ProDesk', 5, 'unité', 2),
(@rfq1, @prod_impr, 'IMPR-001', 'Imprimante HP LaserJet Pro', 3, 'unité', 3),
(@rfq2, @prod_bureau, 'BUREAU-001', 'Bureau ergonomique 120cm', 15, 'unité', 1),
(@rfq2, @prod_chaise, 'CHAISE-001', 'Chaise de bureau ergonomique', 15, 'unité', 2),
(@rfq3, @prod_gen, 'GEN-001', 'Groupe électrogène 50KVA', 1, 'unité', 1);

-- =====================================================
-- DEVIS (Réponses aux RFQ)
-- =====================================================
INSERT INTO devis (numero, rfq_id, fournisseur_id, date_devis, date_validite, statut, tva_taux, remise_globale) VALUES
('DEV-2024-0001', @rfq1, @fourn_tech, DATE_SUB(CURDATE(), INTERVAL 5 DAY), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 'envoye', 18, 5),
('DEV-2024-0002', @rfq2, @fourn_bureau, DATE_SUB(CURDATE(), INTERVAL 3 DAY), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 'envoye', 18, 0);

-- Lignes devis
SET @devis1 = (SELECT id FROM devis WHERE numero = 'DEV-2024-0001' LIMIT 1);
SET @devis2 = (SELECT id FROM devis WHERE numero = 'DEV-2024-0002' LIMIT 1);

INSERT INTO devis_lignes (devis_id, produit_id, reference, description, quantite, prix_unitaire_ht, unite, ordre) VALUES
(@devis1, @prod_ord1, 'ORD-PC-001', 'Ordinateur portable Dell Latitude', 10, 8200000, 'unité', 1),
(@devis1, @prod_ord2, 'ORD-PC-002', 'Ordinateur de bureau HP ProDesk', 5, 6300000, 'unité', 2),
(@devis1, @prod_impr, 'IMPR-001', 'Imprimante HP LaserJet Pro', 3, 3100000, 'unité', 3),
(@devis2, @prod_bureau, 'BUREAU-001', 'Bureau ergonomique 120cm', 15, 850000, 'unité', 1),
(@devis2, @prod_chaise, 'CHAISE-001', 'Chaise de bureau ergonomique', 15, 450000, 'unité', 2);

-- Mettre à jour les totaux des devis
UPDATE devis SET 
    total_ht = (SELECT SUM(quantite * prix_unitaire_ht) FROM devis_lignes WHERE devis_id = devis.id),
    total_tva = (SELECT SUM(quantite * prix_unitaire_ht) * tva_taux / 100 FROM devis_lignes WHERE devis_id = devis.id),
    total_ttc = (SELECT SUM(quantite * prix_unitaire_ht) * (1 + tva_taux / 100) FROM devis_lignes WHERE devis_id = devis.id)
WHERE id IN (@devis1, @devis2);

-- =====================================================
-- COMMANDES (optionnel - une commande acceptée)
-- =====================================================
INSERT INTO commandes (numero, fournisseur_id, date_commande, date_livraison_prevue, statut, tva_taux, total_ht, total_tva, total_ttc) VALUES
('CMD-2024-0001', @fourn_tech, DATE_SUB(CURDATE(), INTERVAL 2 DAY), DATE_ADD(CURDATE(), INTERVAL 15 DAY), 'envoye', 18, 113500000, 20430000, 133930000);

SET @cmd1 = (SELECT id FROM commandes WHERE numero = 'CMD-2024-0001' LIMIT 1);

INSERT INTO commande_lignes (commande_id, produit_id, reference, description, quantite, prix_unitaire_ht, unite, ordre) VALUES
(@cmd1, @prod_ord1, 'ORD-PC-001', 'Ordinateur portable Dell Latitude', 10, 8200000, 'unité', 1),
(@cmd1, @prod_impr, 'IMPR-001', 'Imprimante HP LaserJet Pro', 3, 3100000, 'unité', 2);

-- =====================================================
-- MESSAGE DE CONFIRMATION
-- =====================================================
SELECT 
    '✅ Données de test insérées avec succès !' AS message,
    (SELECT COUNT(*) FROM entreprises) AS total_entreprises,
    (SELECT COUNT(*) FROM produits) AS total_produits,
    (SELECT COUNT(*) FROM rfq) AS total_rfq,
    (SELECT COUNT(*) FROM devis) AS total_devis,
    (SELECT COUNT(*) FROM commandes) AS total_commandes;

