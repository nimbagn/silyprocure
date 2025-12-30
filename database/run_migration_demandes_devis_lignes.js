const pool = require('../backend/config/database');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function runMigration() {
    console.log('🔄 Exécution de la migration demandes_devis_lignes...');
    
    try {
        const sql = fs.readFileSync(
            path.join(__dirname, 'migration_demandes_devis_lignes.sql'),
            'utf8'
        );

        // Exécuter le script SQL ligne par ligne
        const statements = sql.split(';').filter(s => s.trim().length > 0);
        
        for (const statement of statements) {
            if (statement.trim()) {
                try {
                    await pool.execute(statement.trim());
                } catch (error) {
                    // Ignorer les erreurs "column already exists" ou "table already exists"
                    if (!error.message.includes('already exists') && !error.message.includes('Duplicate column')) {
                        console.warn('⚠️  Avertissement:', error.message);
                    }
                }
            }
        }

        // Ajouter les colonnes d'adresse de livraison si elles n'existent pas
        const columns = ['adresse_livraison', 'ville_livraison', 'pays_livraison'];
        for (const column of columns) {
            try {
                const [existing] = await pool.execute(
                    `SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.COLUMNS 
                     WHERE TABLE_SCHEMA = DATABASE() 
                     AND TABLE_NAME = 'demandes_devis' 
                     AND COLUMN_NAME = ?`,
                    [column]
                );
                
                if (existing[0].count === 0) {
                    let alterStatement = '';
                    if (column === 'adresse_livraison') {
                        alterStatement = 'ALTER TABLE demandes_devis ADD COLUMN adresse_livraison TEXT COMMENT \'Adresse complète de livraison\'';
                    } else if (column === 'ville_livraison') {
                        alterStatement = 'ALTER TABLE demandes_devis ADD COLUMN ville_livraison VARCHAR(255) COMMENT \'Ville de livraison\'';
                    } else if (column === 'pays_livraison') {
                        alterStatement = 'ALTER TABLE demandes_devis ADD COLUMN pays_livraison VARCHAR(100) DEFAULT \'Guinée\' COMMENT \'Pays de livraison\'';
                    }
                    
                    if (alterStatement) {
                        await pool.execute(alterStatement);
                        console.log(`✅ Colonne ${column} ajoutée`);
                    }
                }
            } catch (error) {
                console.warn(`⚠️  Erreur lors de l'ajout de la colonne ${column}:`, error.message);
            }
        }
        
        console.log('✅ Migration demandes_devis_lignes exécutée avec succès !');
        
        // Vérifier que la table existe
        const [tables] = await pool.execute(
            "SHOW TABLES LIKE 'demandes_devis_lignes'"
        );
        
        if (tables.length > 0) {
            console.log('✅ Table demandes_devis_lignes créée avec succès');
        } else {
            console.log('⚠️  Table demandes_devis_lignes non trouvée');
        }
        
    } catch (error) {
        console.error('❌ Erreur lors de la migration:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

runMigration();

