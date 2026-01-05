/**
 * Script pour ajouter les colonnes manquantes à la table entreprises
 * Compatibilité avec le code existant
 */

const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

async function addEntreprisesColumns() {
    let client = null;
    
    try {
        console.log('🔄 Ajout des colonnes manquantes à la table entreprises...');
        
        // Lire le script SQL
        const sqlFile = path.join(__dirname, '../../database/add_entreprises_columns.sql');
        const sql = fs.readFileSync(sqlFile, 'utf8');
        
        // Obtenir une connexion
        client = await pool.connect();
        
        // Parser le script SQL en instructions individuelles (gérer les DO $$ blocks)
        const statements = [];
        let currentStatement = '';
        let inDoBlock = false;
        let doBlockDepth = 0;
        
        const lines = sql.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmedLine = line.trim();
            
            // Ignorer les lignes vides et les commentaires
            if (!trimmedLine || trimmedLine.startsWith('--')) {
                continue;
            }
            
            if (trimmedLine.startsWith('DO $$')) {
                inDoBlock = true;
                doBlockDepth = 1;
                currentStatement = trimmedLine;
            } else if (inDoBlock) {
                currentStatement += '\n' + line;
                // Compter les occurrences de $$ pour détecter la fin du bloc
                const matches = line.match(/\$\$/g);
                if (matches) {
                    doBlockDepth += matches.length - 2; // -2 car on compte l'ouverture et la fermeture
                    if (doBlockDepth <= 0) {
                        inDoBlock = false;
                        statements.push(currentStatement);
                        currentStatement = '';
                    }
                }
            } else if (trimmedLine && !trimmedLine.startsWith('/*')) {
                currentStatement += (currentStatement ? '\n' : '') + line;
                if (trimmedLine.endsWith(';')) {
                    statements.push(currentStatement);
                    currentStatement = '';
                }
            }
        }
        
        // Ajouter la dernière instruction si elle existe
        if (currentStatement.trim()) {
            statements.push(currentStatement);
        }
        
        // Exécuter chaque instruction
        for (const statement of statements) {
            if (statement.trim()) {
                await client.query(statement);
            }
        }
        
        console.log('✅ Colonnes ajoutées avec succès à la table entreprises');
        
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
    addEntreprisesColumns()
        .then(() => {
            console.log('✅ Migration terminée');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Erreur migration:', error);
            process.exit(1);
        });
}

module.exports = addEntreprisesColumns;

