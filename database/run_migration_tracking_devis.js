const pool = require('../backend/config/database');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function runMigration() {
    console.log('🔄 Exécution de la migration tracking_devis...');
    
    try {
        // Ajouter les colonnes si elles n'existent pas
        const columns = [
            { name: 'reference', type: 'VARCHAR(50) UNIQUE', comment: 'Référence unique de la demande' },
            { name: 'token_suivi', type: 'VARCHAR(100) UNIQUE', comment: 'Token sécurisé pour le suivi public' },
            { name: 'mode_notification', type: "ENUM('email', 'sms', 'whatsapp') DEFAULT 'email'", comment: 'Mode de notification choisi par le client' },
            { name: 'notification_envoyee', type: 'BOOLEAN DEFAULT FALSE', comment: 'Indique si la notification a été envoyée' }
        ];

        for (const column of columns) {
            try {
                const [existing] = await pool.execute(
                    `SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.COLUMNS 
                     WHERE TABLE_SCHEMA = DATABASE() 
                     AND TABLE_NAME = 'demandes_devis' 
                     AND COLUMN_NAME = ?`,
                    [column.name]
                );
                
                if (existing[0].count === 0) {
                    await pool.execute(
                        `ALTER TABLE demandes_devis ADD COLUMN ${column.name} ${column.type} COMMENT '${column.comment}'`
                    );
                    console.log(`✅ Colonne ${column.name} ajoutée`);
                } else {
                    console.log(`ℹ️  Colonne ${column.name} existe déjà`);
                }
            } catch (error) {
                console.warn(`⚠️  Erreur lors de l'ajout de la colonne ${column.name}:`, error.message);
            }
        }

        // Créer les index (MySQL ne supporte pas IF NOT EXISTS pour CREATE INDEX)
        try {
            const [existingToken] = await pool.execute(
                `SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.STATISTICS 
                 WHERE TABLE_SCHEMA = DATABASE() 
                 AND TABLE_NAME = 'demandes_devis' 
                 AND INDEX_NAME = 'idx_token_suivi'`
            );
            if (existingToken[0].count === 0) {
                await pool.execute('CREATE INDEX idx_token_suivi ON demandes_devis(token_suivi)');
                console.log('✅ Index idx_token_suivi créé');
            }
        } catch (error) {
            console.warn('⚠️  Erreur index token_suivi:', error.message);
        }

        try {
            const [existingRef] = await pool.execute(
                `SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.STATISTICS 
                 WHERE TABLE_SCHEMA = DATABASE() 
                 AND TABLE_NAME = 'demandes_devis' 
                 AND INDEX_NAME = 'idx_reference'`
            );
            if (existingRef[0].count === 0) {
                await pool.execute('CREATE INDEX idx_reference ON demandes_devis(reference)');
                console.log('✅ Index idx_reference créé');
            }
        } catch (error) {
            console.warn('⚠️  Erreur index reference:', error.message);
        }
        
        console.log('✅ Migration tracking_devis exécutée avec succès !');
        
    } catch (error) {
        console.error('❌ Erreur lors de la migration:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

runMigration();

