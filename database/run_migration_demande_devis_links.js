const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Utiliser le pool de connexion existant si disponible
let pool;
try {
    pool = require('../backend/config/database');
} catch (e) {
    // Si le pool n'est pas disponible, créer une connexion directe
    pool = null;
}

async function runMigration() {
    console.log('🔄 Exécution de la migration demande_devis_links...');
    let connection;
    try {
        // Essayer d'utiliser le pool existant
        if (pool) {
            connection = await pool.getConnection();
            console.log('✅ Connexion via pool existant');
        } else {
            connection = await mysql.createConnection({
                host: process.env.DB_HOST || 'localhost',
                user: process.env.DB_USER || 'root',
                password: process.env.DB_PASSWORD || '',
                database: process.env.DB_NAME || 'silypro',
                multipleStatements: true
            });
            console.log('✅ Connexion directe à la base de données MySQL réussie');
        }

        const migrationSqlPath = path.join(__dirname, 'migration_demande_devis_links.sql');
        const migrationSql = fs.readFileSync(migrationSqlPath, 'utf8');

        // Exécuter le script SQL ligne par ligne pour éviter les erreurs de syntaxe
        const statements = migrationSql.split(';').filter(s => s.trim().length > 0 && !s.trim().startsWith('--'));
        
        for (const statement of statements) {
            if (statement.trim()) {
                try {
                    await connection.query(statement);
                    console.log('✅ Instruction exécutée');
                } catch (err) {
                    // Ignorer les erreurs "column already exists" ou "constraint already exists"
                    if (err.code === 'ER_DUP_FIELDNAME' || err.code === 'ER_DUP_KEYNAME' || err.code === 'ER_DUP_KEY') {
                        console.log('ℹ️  Colonne/Index/Contrainte existe déjà, ignoré');
                    } else {
                        throw err;
                    }
                }
            }
        }

        console.log('✅ Migration demande_devis_links exécutée avec succès !');

    } catch (error) {
        console.error('❌ Erreur lors de la migration demande_devis_links:', error.message);
        if (error.code) {
            console.error('Code erreur:', error.code);
        }
    } finally {
        if (connection) {
            if (pool) {
                connection.release();
            } else {
                await connection.end();
            }
        }
        if (pool) {
            pool.end();
        }
    }
}

runMigration();

