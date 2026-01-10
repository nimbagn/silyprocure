-- =====================================================
-- Script de mise à jour de la table demandes_devis
-- Pour PostgreSQL - Actualisation de la base de données
-- =====================================================

-- 0. Créer la fonction update_modified_column si elle n'existe pas
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.date_modification = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. Vérifier et ajouter la colonne mode_notification si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'demandes_devis' 
        AND column_name = 'mode_notification'
    ) THEN
        ALTER TABLE demandes_devis 
        ADD COLUMN mode_notification VARCHAR(50) DEFAULT 'email';
        RAISE NOTICE 'Colonne mode_notification ajoutée';
    END IF;
END $$;

-- 2. Vérifier et ajouter la colonne code_postal_livraison si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'demandes_devis' 
        AND column_name = 'code_postal_livraison'
    ) THEN
        ALTER TABLE demandes_devis 
        ADD COLUMN code_postal_livraison VARCHAR(20);
        RAISE NOTICE 'Colonne code_postal_livraison ajoutée';
    END IF;
END $$;

-- 3. Vérifier et ajouter la colonne adresse_ligne2_livraison si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'demandes_devis' 
        AND column_name = 'adresse_ligne2_livraison'
    ) THEN
        ALTER TABLE demandes_devis 
        ADD COLUMN adresse_ligne2_livraison TEXT;
        RAISE NOTICE 'Colonne adresse_ligne2_livraison ajoutée';
    END IF;
END $$;

-- 4. Vérifier et ajouter la colonne date_livraison_souhaitee si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'demandes_devis' 
        AND column_name = 'date_livraison_souhaitee'
    ) THEN
        ALTER TABLE demandes_devis 
        ADD COLUMN date_livraison_souhaitee DATE;
        RAISE NOTICE 'Colonne date_livraison_souhaitee ajoutée';
    END IF;
END $$;

-- 5. Vérifier et ajouter la colonne budget_estime si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'demandes_devis' 
        AND column_name = 'budget_estime'
    ) THEN
        ALTER TABLE demandes_devis 
        ADD COLUMN budget_estime DECIMAL(15, 2);
        RAISE NOTICE 'Colonne budget_estime ajoutée';
    END IF;
END $$;

-- 6. Vérifier et ajouter la colonne type_livraison si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'demandes_devis' 
        AND column_name = 'type_livraison'
    ) THEN
        ALTER TABLE demandes_devis 
        ADD COLUMN type_livraison VARCHAR(50);
        RAISE NOTICE 'Colonne type_livraison ajoutée';
    END IF;
END $$;

-- 7. Vérifier et ajouter la colonne notes si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'demandes_devis' 
        AND column_name = 'notes'
    ) THEN
        ALTER TABLE demandes_devis 
        ADD COLUMN notes TEXT;
        RAISE NOTICE 'Colonne notes ajoutée';
    END IF;
END $$;

-- 8. S'assurer que la table demandes_devis_lignes existe avec toutes les colonnes nécessaires
CREATE TABLE IF NOT EXISTS demandes_devis_lignes (
    id SERIAL PRIMARY KEY,
    demande_devis_id INTEGER NOT NULL,
    description VARCHAR(500) NOT NULL,
    secteur VARCHAR(100),
    quantite DECIMAL(10,2) NOT NULL DEFAULT 1.00,
    unite VARCHAR(50) DEFAULT 'unité',
    ordre INTEGER DEFAULT 0,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_demandes_devis_lignes_demande FOREIGN KEY (demande_devis_id) REFERENCES demandes_devis(id) ON DELETE CASCADE
);

-- 9. Créer les index si ils n'existent pas
CREATE INDEX IF NOT EXISTS idx_demandes_devis_lignes_demande ON demandes_devis_lignes(demande_devis_id);
CREATE INDEX IF NOT EXISTS idx_demandes_devis_lignes_secteur ON demandes_devis_lignes(secteur);

-- 10. Vérifier que la colonne service existe (pour compatibilité)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'demandes_devis' 
        AND column_name = 'service'
    ) THEN
        ALTER TABLE demandes_devis 
        ADD COLUMN service VARCHAR(100);
        RAISE NOTICE 'Colonne service ajoutée';
    END IF;
END $$;

-- 11. Mettre à jour les valeurs NULL pour mode_notification
UPDATE demandes_devis 
SET mode_notification = 'email' 
WHERE mode_notification IS NULL;

-- 12. Mettre à jour les valeurs NULL pour pays_livraison
UPDATE demandes_devis 
SET pays_livraison = 'Guinée' 
WHERE pays_livraison IS NULL;

-- 12.1. Créer le trigger pour date_modification si il n'existe pas
DROP TRIGGER IF EXISTS update_demandes_devis_modtime ON demandes_devis;
CREATE TRIGGER update_demandes_devis_modtime 
    BEFORE UPDATE ON demandes_devis
    FOR EACH ROW 
    EXECUTE FUNCTION update_modified_column();

-- 13. Créer une vue pour faciliter les requêtes avec nb_articles
CREATE OR REPLACE VIEW v_demandes_devis_avec_articles AS
SELECT 
    d.*,
    u.nom as traite_par_nom,
    u.prenom as traite_par_prenom,
    COALESCE(COUNT(l.id), 0) as nb_articles,
    STRING_AGG(
        l.description || ' (' || l.quantite || ' ' || COALESCE(l.unite, 'unité') || ')',
        '; '
        ORDER BY l.ordre
    ) as articles_resume
FROM demandes_devis d
LEFT JOIN utilisateurs u ON d.traite_par = u.id
LEFT JOIN demandes_devis_lignes l ON d.id = l.demande_devis_id
GROUP BY d.id, u.nom, u.prenom;

-- 14. Afficher un résumé
DO $$
DECLARE
    total_demandes INTEGER;
    total_lignes INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_demandes FROM demandes_devis;
    SELECT COUNT(*) INTO total_lignes FROM demandes_devis_lignes;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Mise à jour terminée avec succès !';
    RAISE NOTICE 'Total demandes: %', total_demandes;
    RAISE NOTICE 'Total lignes articles: %', total_lignes;
    RAISE NOTICE '========================================';
END $$;

