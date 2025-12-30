// Script pour exécuter la migration fichiers_joints via Node.js
const pool = require('../backend/config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    let connection;
    try {
        console.log('🔄 Exécution de la migration fichiers_joints...');
        
        connection = await pool.getConnection();
        
        const sql = fs.readFileSync(
            path.join(__dirname, 'migration_fichiers_joints.sql'),
            'utf8'
        );
        
        // Exécuter le SQL
        await connection.query(sql);
        
        console.log('✅ Migration fichiers_joints exécutée avec succès !');
        console.log('📋 Table fichiers_joints créée');
        
    } catch (error) {
        console.error('❌ Erreur lors de la migration:', error.message);
        if (error.code === 'ER_TABLE_EXISTS_ERROR') {
            console.log('ℹ️  La table fichiers_joints existe déjà');
        }
        process.exit(1);
    } finally {
        if (connection) {
            connection.release();
        }
        await pool.end();
        process.exit(0);
    }
}

runMigration();

