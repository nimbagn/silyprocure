const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function runMigration() {
    console.log('🔄 Exécution de la migration géolocalisation demandes_devis...');
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

        const migrationSqlPath = path.join(__dirname, 'migration_geolocalisation_demandes.sql');
        const migrationSql = fs.readFileSync(migrationSqlPath, 'utf8');

        // Exécuter le script SQL
        await connection.query(migrationSql);
        console.log('✅ Migration géolocalisation demandes_devis exécutée avec succès !');
        console.log('📋 Colonnes latitude et longitude ajoutées à la table demandes_devis');

    } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('ℹ️  Les colonnes latitude et longitude existent déjà');
        } else {
            console.error('❌ Erreur lors de la migration géolocalisation:', error);
            throw error;
        }
    } finally {
        if (connection) await connection.end();
    }
}

runMigration();

