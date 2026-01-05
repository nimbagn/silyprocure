/**
 * Script pour ajouter les colonnes manquantes à la table clients
 * Compatibilité avec le code existant
 */

const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

async function addClientsColumns() {
    let client = null;
    
    try {
        console.log('🔄 Ajout des colonnes manquantes à la table clients...');
        
        // Lire le script SQL
        const sqlFile = path.join(__dirname, '../../database/add_clients_columns.sql');
        const sql = fs.readFileSync(sqlFile, 'utf8');
        
        // Obtenir une connexion
        client = await pool.connect();
        
        // Exécuter le script SQL
        await client.query(sql);
        
        console.log('✅ Colonnes ajoutées avec succès à la table clients');
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'ajout des colonnes:', error);
        throw error;
    } finally {
        if (client) {
            client.release();
        }
    }
}

// Exécuter si appelé directement
if (require.main === module) {
    addClientsColumns()
        .then(() => {
            console.log('✅ Migration terminée');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Erreur migration:', error);
            process.exit(1);
        });
}

module.exports = addClientsColumns;

