-- Migration : Créer la table pour l'historique des interactions clients (PostgreSQL)
-- Permet de suivre toutes les interactions d'un client avec la plateforme

CREATE TABLE IF NOT EXISTS historique_clients (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL,
    type_interaction VARCHAR(50) NOT NULL CHECK (type_interaction IN (
        'demande_devis', 'devis_consulte', 'devis_accepte', 'devis_refuse', 
        'commande_creee', 'commande_livree', 'facture_generee', 'facture_proforma_generee',
        'facture_payee', 'note_ajoutee', 'statut_modifie'
    )),
    reference_document VARCHAR(100),
    document_id INTEGER,
    description TEXT,
    utilisateur_id INTEGER,
    date_interaction TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB,
    CONSTRAINT fk_historique_clients_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    CONSTRAINT fk_historique_clients_utilisateur FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_historique_clients_client_id ON historique_clients(client_id);
CREATE INDEX IF NOT EXISTS idx_historique_clients_type_interaction ON historique_clients(type_interaction);
CREATE INDEX IF NOT EXISTS idx_historique_clients_date_interaction ON historique_clients(date_interaction);
CREATE INDEX IF NOT EXISTS idx_historique_clients_document_id ON historique_clients(document_id);

