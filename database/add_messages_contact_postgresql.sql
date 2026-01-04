-- Script pour créer la table messages_contact dans PostgreSQL
-- Cette table stocke les messages provenant du formulaire de contact de la page d'accueil

CREATE TABLE IF NOT EXISTS messages_contact (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    telephone VARCHAR(50),
    sujet VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    lu BOOLEAN DEFAULT FALSE,
    traite BOOLEAN DEFAULT FALSE,
    traite_par INTEGER,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes_internes TEXT,
    CONSTRAINT fk_messages_contact_traite_par FOREIGN KEY (traite_par) REFERENCES utilisateurs(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_contact_lu ON messages_contact(lu);
CREATE INDEX IF NOT EXISTS idx_messages_contact_traite ON messages_contact(traite);
CREATE INDEX IF NOT EXISTS idx_messages_contact_date_creation ON messages_contact(date_creation);
CREATE INDEX IF NOT EXISTS idx_messages_contact_email ON messages_contact(email);

CREATE TRIGGER update_messages_contact_modtime BEFORE UPDATE ON messages_contact
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

