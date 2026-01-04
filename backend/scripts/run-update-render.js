// Script pour exécuter la mise à jour complète de la base de données sur Render
// Exécute database/update_render_complete.sql

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runUpdate() {
    console.log('🔄 Démarrage de la mise à jour complète de la base de données...');
    
    // Utiliser DATABASE_URL si disponible (format Render), sinon utiliser les variables individuelles
    let connectionConfig;
    
    if (process.env.DATABASE_URL) {
        console.log('📊 Utilisation de DATABASE_URL');
        connectionConfig = {
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        };
    } else {
        if (!process.env.DB_HOST || !process.env.DB_NAME || !process.env.DB_USER || !process.env.DB_PASSWORD) {
            console.error('❌ Variables DB_* non définies');
            console.error('💡 Définissez DATABASE_URL ou les variables DB_HOST, DB_NAME, DB_USER, DB_PASSWORD');
            process.exit(1);
        }
        
        const port = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432;
        connectionConfig = {
            host: process.env.DB_HOST,
            port: isNaN(port) ? 5432 : port,
            database: process.env.DB_NAME,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
        };
    }
    
    const pool = new Pool(connectionConfig);
    
    try {
        // Lire le script SQL
        const sqlPath = path.join(__dirname, '../../database/update_render_complete.sql');
        
        if (!fs.existsSync(sqlPath)) {
            console.error(`❌ Fichier SQL non trouvé: ${sqlPath}`);
            process.exit(1);
        }
        
        console.log(`📄 Lecture du script: ${sqlPath}`);
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        // Nettoyer le SQL (supprimer les commandes psql)
        const cleanedSql = sql
            .replace(/\\[a-zA-Z]+\s*[^\n]*/g, '')
            .replace(/--[^\n]*/g, '')
            .replace(/\n\s*\n\s*\n/g, '\n\n')
            .trim();
        
        // Parser les instructions SQL (gérer les blocs DO $$)
        const statements = [];
        let currentStatement = '';
        let inDollarQuote = false;
        let dollarTag = '';
        let i = 0;
        
        while (i < cleanedSql.length) {
            const char = cleanedSql[i];
            
            // Détecter le début d'un bloc $$ (dollar quoting)
            if (char === '$' && !inDollarQuote) {
                let tag = '$';
                let j = i + 1;
                while (j < cleanedSql.length && cleanedSql[j] !== '$') {
                    tag += cleanedSql[j];
                    j++;
                }
                if (j < cleanedSql.length && cleanedSql[j] === '$') {
                    tag += '$';
                    dollarTag = tag;
                    inDollarQuote = true;
                    currentStatement += tag;
                    i = j + 1;
                    continue;
                }
            }
            
            // Détecter la fin d'un bloc $$
            if (inDollarQuote) {
                const remaining = cleanedSql.substr(i);
                if (remaining.startsWith(dollarTag)) {
                    currentStatement += dollarTag;
                    const tagLength = dollarTag.length;
                    inDollarQuote = false;
                    dollarTag = '';
                    i += tagLength;
                    continue;
                }
            }
            
            // Détecter la fin d'une instruction SQL
            if (char === ';' && !inDollarQuote) {
                currentStatement += ';';
                const trimmed = currentStatement.trim();
                if (trimmed && trimmed !== ';') {
                    statements.push(trimmed);
                }
                currentStatement = '';
                i++;
                continue;
            }
            
            currentStatement += char;
            i++;
        }
        
        // Ajouter la dernière instruction si elle existe
        if (currentStatement.trim() && currentStatement.trim() !== ';') {
            statements.push(currentStatement.trim());
        }
        
        console.log(`📋 ${statements.length} instructions SQL à exécuter`);
        
        // Exécuter les instructions
        let successCount = 0;
        let errorCount = 0;
        
        for (let idx = 0; idx < statements.length; idx++) {
            const statement = statements[idx];
            if (!statement.trim() || statement.trim() === ';') {
                continue;
            }
            
            try {
                await pool.query(statement.trim());
                successCount++;
                if ((idx + 1) % 10 === 0) {
                    console.log(`   ✓ ${idx + 1}/${statements.length} instructions exécutées...`);
                }
            } catch (error) {
                errorCount++;
                // Ignorer certaines erreurs attendues
                const ignorableErrors = [
                    'already exists',
                    'duplicate',
                    'does not exist',
                    'relation already exists',
                    'constraint already exists',
                    'index already exists',
                    'trigger already exists'
                ];
                
                const shouldIgnore = ignorableErrors.some(msg => 
                    error.message.toLowerCase().includes(msg.toLowerCase())
                );
                
                if (!shouldIgnore) {
                    console.warn(`⚠️  Erreur SQL (instruction ${idx + 1}):`, error.message.substring(0, 150));
                }
            }
        }
        
        console.log(`\n✅ Mise à jour terminée!`);
        console.log(`   ✓ ${successCount} instructions réussies`);
        if (errorCount > 0) {
            console.log(`   ⚠️  ${errorCount} erreurs (certaines attendues - tables/colonnes déjà existantes)`);
        }
        
        // Vérifier les tables créées
        const tablesCheck = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('clients', 'demandes_devis', 'demandes_devis_lignes', 'messages_contact')
            ORDER BY table_name
        `);
        
        console.log(`\n📊 Tables vérifiées:`);
        tablesCheck.rows.forEach(row => {
            console.log(`   ✓ ${row.table_name}`);
        });
        
    } catch (error) {
        console.error('❌ Erreur lors de la mise à jour:', error.message);
        throw error;
    } finally {
        await pool.end();
    }
}

// Exécuter seulement si appelé directement
if (require.main === module) {
    runUpdate()
        .then(() => {
            console.log('\n✅ Mise à jour complète terminée avec succès!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Erreur:', error);
            process.exit(1);
        });
}

module.exports = runUpdate;

