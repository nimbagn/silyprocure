const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
    let connection;
    
    try {
        // Configuration de la base de données
        const dbConfig = {
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            database: process.env.DB_NAME || 'silypro',
            user: process.env.DB_USER || 'soul',
            password: process.env.DB_PASSWORD || 'Satina2025',
            multipleStatements: true
        };

        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connexion à la base de données réussie');

        // Lire le fichier SQL
        const sqlFile = path.join(__dirname, 'migration_ai_analyses.sql');
        const sql = fs.readFileSync(sqlFile, 'utf8');

        // Exécuter la migration
        console.log('📝 Exécution de la migration...');
        await connection.query(sql);
        
        console.log('✅ Migration réussie !');
        console.log('   - Table ai_analyses créée');
        console.log('   - Table ai_recommendations créée');
        console.log('   - Table ai_anomalies créée');
        
    } catch (error) {
        console.error('❌ Erreur lors de la migration:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

runMigration();

