const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function runMigration() {
    let connection;
    
    try {
        // Utiliser la même configuration que backend/config/database.js
        const config = {
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'soul',
            password: process.env.DB_PASSWORD || 'Satina2025',
            database: process.env.DB_NAME || 'silypro',
            multipleStatements: true,
            charset: 'utf8mb4'
        };
        
        console.log(`🔌 Tentative de connexion à MySQL...`);
        console.log(`   Host: ${config.host}`);
        console.log(`   Database: ${config.database}`);
        console.log(`   User: ${config.user}`);
        
        console.log('🔌 Connexion à la base de données...');
        connection = await mysql.createConnection(config);
        console.log('✅ Connecté à la base de données');
        
        // Vérifier si la table existe déjà
        const [tables] = await connection.execute(
            "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ? AND table_name = 'messages_contact'",
            [config.database]
        );
        
        if (tables[0].count > 0) {
            console.log('⚠️  La table messages_contact existe déjà. Vérification de la structure...');
            
            // Vérifier les colonnes essentielles
            const [columns] = await connection.execute(
                "SELECT COLUMN_NAME FROM information_schema.columns WHERE table_schema = ? AND table_name = 'messages_contact'",
                [config.database]
            );
            
            const columnNames = columns.map(c => c.COLUMN_NAME);
            const requiredColumns = ['id', 'nom', 'email', 'sujet', 'message', 'lu', 'traite'];
            const missingColumns = requiredColumns.filter(col => !columnNames.includes(col));
            
            if (missingColumns.length > 0) {
                console.log(`⚠️  Colonnes manquantes: ${missingColumns.join(', ')}`);
                console.log('💡 La table existe mais peut avoir une structure différente.');
            } else {
                console.log('✅ La table messages_contact existe déjà avec la bonne structure.');
                return;
            }
        }
        
        console.log('📝 Création de la table messages_contact...');
        
        // Créer la table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS messages_contact (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nom VARCHAR(255) NOT NULL COMMENT 'Nom complet de l''expéditeur',
                email VARCHAR(255) NOT NULL COMMENT 'Email de l''expéditeur',
                telephone VARCHAR(50) COMMENT 'Numéro de téléphone',
                sujet VARCHAR(255) NOT NULL COMMENT 'Sujet du message',
                message TEXT NOT NULL COMMENT 'Contenu du message',
                lu BOOLEAN DEFAULT FALSE COMMENT 'Message lu ou non',
                traite BOOLEAN DEFAULT FALSE COMMENT 'Message traité ou non',
                traite_par INT COMMENT 'ID de l''utilisateur qui a traité le message',
                date_creation DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Date de création',
                date_modification DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Date de dernière modification',
                notes_internes TEXT COMMENT 'Notes internes pour le suivi',
                FOREIGN KEY (traite_par) REFERENCES utilisateurs(id) ON DELETE SET NULL,
                INDEX idx_lu (lu),
                INDEX idx_traite (traite),
                INDEX idx_date_creation (date_creation),
                INDEX idx_email (email)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        
        console.log('✅ Table messages_contact créée avec succès !');
        
    } catch (error) {
        console.error('❌ Erreur lors de la migration:', error.message);
        
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('\n💡 Erreur d\'authentification MySQL.');
            console.error('   Vérifiez vos identifiants dans le fichier .env ou dans backend/config/database.js');
        } else if (error.code === 'ER_BAD_DB_ERROR') {
            console.error('\n💡 La base de données n\'existe pas.');
            console.error('   Créez d\'abord la base de données: CREATE DATABASE silypro;');
        } else if (error.code === 'ER_DUP_ENTRY' || error.message.includes('already exists')) {
            console.log('⚠️  La table existe déjà.');
        } else {
            console.error('\n💡 Détails de l\'erreur:', error);
        }
        
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Connexion fermée');
        }
    }
}

// Exécuter la migration
runMigration();

