const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function runMigration() {
    console.log('🔄 Exécution de la migration historique clients...');
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'silypro',
            multipleStatements: true
        });
        console.log('✅ Connexion à la base de données MySQL réussie');

        // Vérifier si la table existe déjà
        const [tables] = await connection.execute(
            `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'historique_clients'`,
            [process.env.DB_NAME || 'silypro']
        );

        if (tables.length === 0) {
            console.log('Création de la table historique_clients...');
            
            await connection.execute(`
                CREATE TABLE historique_clients (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    client_id INT NOT NULL COMMENT 'ID du client',
                    type_interaction ENUM('demande_devis', 'devis_consulte', 'devis_accepte', 'devis_refuse', 'commande_creee', 'commande_livree', 'facture_generee', 'facture_payee', 'note_ajoutee', 'statut_modifie') NOT NULL COMMENT 'Type d interaction',
                    reference_document VARCHAR(100) COMMENT 'Reference du document lie',
                    document_id INT COMMENT 'ID du document lie',
                    description TEXT COMMENT 'Description de l interaction',
                    utilisateur_id INT COMMENT 'ID de l utilisateur qui a effectue l action',
                    date_interaction DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Date de l interaction',
                    metadata JSON COMMENT 'Donnees supplementaires en JSON',
                    INDEX idx_client_id (client_id),
                    INDEX idx_type_interaction (type_interaction),
                    INDEX idx_date_interaction (date_interaction),
                    INDEX idx_document_id (document_id),
                    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
                    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE SET NULL
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            `);
            console.log('✅ Table historique_clients créée avec succès !');
        } else {
            console.log('ℹ️  La table historique_clients existe déjà');
        }

    } catch (error) {
        console.error('❌ Erreur lors de la migration historique clients:', error);
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

runMigration();

