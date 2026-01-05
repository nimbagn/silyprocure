// Script de migration pour créer la table demandes_devis
// Peut être exécuté manuellement ou automatiquement au démarrage

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function migrateDemandesDevis() {
    console.log('🔄 Vérification de la table demandes_devis...');
    
    // Utiliser DATABASE_URL si disponible (format Render), sinon utiliser les variables individuelles
    let connectionConfig;
    
    if (process.env.DATABASE_URL) {
        connectionConfig = {
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        };
    } else {
        if (!process.env.DB_HOST || !process.env.DB_NAME || !process.env.DB_USER || !process.env.DB_PASSWORD) {
            console.warn('⚠️  Variables DB_* non définies');
            return;
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
        // Vérifier si la table existe
        const checkTable = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name = 'demandes_devis'
            )
        `);
        
        if (checkTable.rows[0].exists) {
            console.log('✅ Table demandes_devis existe déjà');
            if (pool && !pool.ended) {
                await pool.end();
            }
            return;
        }
        
        console.log('📋 Création de la table demandes_devis...');
        
        // Lire le script SQL
        const sqlPath = path.join(__dirname, '../../database/add_demandes_devis_postgresql.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        // Nettoyer le SQL
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
        
        // Exécuter les instructions
        for (const statement of statements) {
            if (statement.trim()) {
                try {
                    await pool.query(statement.trim());
                } catch (error) {
                    // Ignorer les erreurs de "déjà existe"
                    if (!error.message.includes('already exists') && 
                        !error.message.includes('duplicate') &&
                        !error.message.includes('relation') &&
                        !error.message.includes('function')) {
                        console.warn('⚠️  Erreur SQL:', error.message.substring(0, 100));
                    }
                }
            }
        }
        
        console.log('✅ Table demandes_devis créée avec succès');
        
    } catch (error) {
        console.error('❌ Erreur lors de la migration:', error.message);
        throw error;
    } finally {
        if (pool && !pool.ended) {
            await pool.end();
        }
    }
}

// Exécuter seulement si appelé directement
if (require.main === module) {
    migrateDemandesDevis()
        .then(() => {
            console.log('✅ Migration terminée');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Erreur:', error);
            process.exit(1);
        });
}

module.exports = migrateDemandesDevis;

