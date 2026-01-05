-- =====================================================
-- Migration : Création de la table liens_externes pour PostgreSQL
-- Cette table stocke les liens de remplissage externes pour les fournisseurs
-- =====================================================

-- Créer la table liens_externes si elle n'existe pas
CREATE TABLE IF NOT EXISTS liens_externes (
    id SERIAL PRIMARY KEY,
    rfq_id INTEGER NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    fournisseur_id INTEGER NOT NULL,
    email_envoye VARCHAR(255),
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_expiration TIMESTAMP,
    utilise BOOLEAN DEFAULT FALSE,
    date_utilisation TIMESTAMP NULL,
    ip_utilisation VARCHAR(45),
    CONSTRAINT fk_liens_externes_rfq FOREIGN KEY (rfq_id) REFERENCES rfq(id) ON DELETE CASCADE,
    CONSTRAINT fk_liens_externes_fournisseur FOREIGN KEY (fournisseur_id) REFERENCES entreprises(id) ON DELETE CASCADE
);

-- Créer les index
CREATE INDEX IF NOT EXISTS idx_liens_externes_token ON liens_externes(token);
CREATE INDEX IF NOT EXISTS idx_liens_externes_rfq ON liens_externes(rfq_id);
CREATE INDEX IF NOT EXISTS idx_liens_externes_fournisseur ON liens_externes(fournisseur_id);
CREATE INDEX IF NOT EXISTS idx_liens_externes_utilise ON liens_externes(utilise);
CREATE INDEX IF NOT EXISTS idx_liens_externes_date_expiration ON liens_externes(date_expiration);

-- Trigger pour mettre à jour date_creation automatiquement (déjà géré par DEFAULT)
-- Pas besoin de trigger supplémentaire car DEFAULT CURRENT_TIMESTAMP gère déjà cela

SELECT '✅ Table liens_externes créée avec succès' AS message;

