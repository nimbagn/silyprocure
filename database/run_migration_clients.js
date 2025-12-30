const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function runMigration() {
    console.log('🔄 Exécution de la migration clients...');
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

        // Vérifier si la table clients existe déjà
        const [tables] = await connection.execute(
            `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'clients'`,
            [process.env.DB_NAME || 'silypro']
        );

        if (tables.length === 0) {
            console.log('Création de la table clients...');
            
            // Créer la table clients
            await connection.execute(`
                CREATE TABLE clients (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    nom VARCHAR(255) NOT NULL COMMENT 'Nom complet du client',
                    email VARCHAR(255) NOT NULL COMMENT 'Email du client',
                    telephone VARCHAR(50) COMMENT 'Numero de telephone',
                    entreprise VARCHAR(255) COMMENT 'Nom de l entreprise du client',
                    adresse VARCHAR(500) COMMENT 'Adresse complete',
                    ville VARCHAR(100) COMMENT 'Ville',
                    pays VARCHAR(100) COMMENT 'Pays',
                    secteur_activite VARCHAR(100) COMMENT 'Secteur d activite de l entreprise',
                    site_web VARCHAR(255) COMMENT 'Site web de l entreprise',
                    notes TEXT COMMENT 'Notes sur le client',
                    date_creation DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Date de creation',
                    date_modification DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Date de derniere modification',
                    date_derniere_demande DATETIME COMMENT 'Date de la derniere demande de devis',
                    nombre_demandes INT DEFAULT 0 COMMENT 'Nombre total de demandes',
                    statut ENUM('actif', 'inactif', 'prospect') DEFAULT 'prospect' COMMENT 'Statut du client',
                    INDEX idx_email (email),
                    INDEX idx_entreprise (entreprise),
                    INDEX idx_statut (statut),
                    INDEX idx_date_derniere_demande (date_derniere_demande),
                    UNIQUE KEY unique_email (email)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            `);
            console.log('✅ Table clients créée avec succès !');
        } else {
            console.log('ℹ️  La table clients existe déjà');
        }
        
        // Vérifier si la colonne client_id existe dans demandes_devis
        const [columns] = await connection.execute(
            `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'demandes_devis'
             AND COLUMN_NAME = 'client_id'`,
            [process.env.DB_NAME || 'silypro']
        );

        if (columns.length === 0) {
            console.log('Ajout de la colonne client_id dans demandes_devis...');
            await connection.execute(`
                ALTER TABLE demandes_devis 
                ADD COLUMN client_id INT NULL COMMENT 'ID du client dans la table clients'
                AFTER id;
            `);
            console.log('✅ Colonne client_id ajoutée');
            
            // Ajouter l'index
            try {
                await connection.execute(`
                    ALTER TABLE demandes_devis 
                    ADD INDEX idx_client_id (client_id);
                `);
                console.log('✅ Index idx_client_id ajouté');
            } catch (err) {
                if (err.code !== 'ER_DUP_KEYNAME' && err.errno !== 1061) {
                    throw err;
                }
                console.log('ℹ️  L\'index idx_client_id existe déjà');
            }

            // Vérifier si la contrainte existe déjà
            const [constraints] = await connection.execute(
                `SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
                 WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'demandes_devis'
                 AND CONSTRAINT_NAME = 'fk_demande_client'`,
                [process.env.DB_NAME || 'silypro']
            );

            if (constraints.length === 0) {
                // Ajouter la clé étrangère
                await connection.execute(`
                    ALTER TABLE demandes_devis 
                    ADD CONSTRAINT fk_demande_client 
                    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;
                `);
                console.log('✅ Clé étrangère fk_demande_client ajoutée');
            } else {
                console.log('ℹ️  La clé étrangère fk_demande_client existe déjà');
            }
        } else {
            console.log('ℹ️  La colonne client_id existe déjà');
        }
        
        console.log('✅ Migration clients terminée avec succès !');

    } catch (error) {
        console.error('❌ Erreur lors de la migration clients:', error);
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

runMigration();

