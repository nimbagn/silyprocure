const pool = require('../backend/config/database');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function runMigration() {
    console.log('🔄 Exécution de la migration demandes_devis...');
    
    try {
        const sql = fs.readFileSync(
            path.join(__dirname, 'migration_demandes_devis.sql'),
            'utf8'
        );

        // Exécuter le script SQL
        await pool.execute(sql);
        
        console.log('✅ Migration demandes_devis exécutée avec succès !');
        
        // Vérifier que la table existe
        const [tables] = await pool.execute(
            "SHOW TABLES LIKE 'demandes_devis'"
        );
        
        if (tables.length > 0) {
            console.log('✅ Table demandes_devis créée avec succès');
        } else {
            console.log('⚠️  Table demandes_devis non trouvée');
        }
        
    } catch (error) {
        console.error('❌ Erreur lors de la migration:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

runMigration();

