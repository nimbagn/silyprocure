/**
 * Script pour créer la table liens_externes
 * Compatible PostgreSQL
 */

const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

async function addLiensExternes() {
    let client = null;
    
    try {
        console.log('🔄 Création de la table liens_externes...');
        
        const sqlFile = path.join(__dirname, '../../database/add_liens_externes_postgresql.sql');
        const sql = fs.readFileSync(sqlFile, 'utf8');
        
        client = await pool.connect();
        
        // Parser les instructions SQL (gérer les blocs DO $$)
        const statements = [];
        let currentStatement = '';
        let inDollarQuote = false;
        let dollarTag = '';
        let i = 0;
        
        while (i < sql.length) {
            const char = sql[i];
            
            if (char === '$' && !inDollarQuote) {
                let tag = '$';
                let j = i + 1;
                while (j < sql.length && sql[j] !== '$') {
                    tag += sql[j];
                    j++;
                }
                if (j < sql.length && sql[j] === '$') {
                    tag += '$';
                    dollarTag = tag;
                    inDollarQuote = true;
                    currentStatement += tag;
                    i = j + 1;
                    continue;
                }
            }
            
            if (inDollarQuote) {
                currentStatement += char;
                if (currentStatement.endsWith(dollarTag)) {
                    inDollarQuote = false;
                    dollarTag = '';
                    statements.push(currentStatement.trim());
                    currentStatement = '';
                }
            } else if (char === ';') {
                if (currentStatement.trim() !== '') {
                    statements.push(currentStatement.trim());
                }
                currentStatement = '';
            } else {
                currentStatement += char;
            }
            i++;
        }
        
        if (currentStatement.trim() !== '') {
            statements.push(currentStatement.trim());
        }

        for (const statement of statements) {
            if (statement && !statement.startsWith('SELECT')) {
                await client.query(statement);
            }
        }
        
        console.log('✅ Table liens_externes créée avec succès');
        
    } catch (error) {
        console.error('❌ Erreur lors de la création de la table liens_externes:', error);
        throw error;
    } finally {
        if (client) {
            client.release();
        }
    }
}

if (require.main === module) {
    addLiensExternes()
        .then(() => {
            console.log('✅ Migration terminée');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Erreur migration:', error);
            process.exit(1);
        });
}

module.exports = addLiensExternes;

