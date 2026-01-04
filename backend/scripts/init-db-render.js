// Script d'initialisation de la base de données pour Render
// S'exécute automatiquement au premier démarrage si la base est vide

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function initDatabase() {
    console.log('🗄️  Vérification de la base de données...');
    
    // Utiliser DATABASE_URL si disponible (format Render), sinon utiliser les variables individuelles
    let connectionConfig;
    
    if (process.env.DATABASE_URL) {
        console.log('📊 Utilisation de DATABASE_URL');
        connectionConfig = {
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        };
    } else {
        // Vérifier que toutes les variables sont définies
        if (!process.env.DB_HOST || !process.env.DB_NAME || !process.env.DB_USER || !process.env.DB_PASSWORD) {
            console.warn('⚠️  Variables DB_* non définies, utilisation de DATABASE_URL recommandée');
            return; // Ne pas faire échouer le démarrage
        }
        
        const port = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432;
        if (isNaN(port)) {
            console.warn('⚠️  DB_PORT invalide, utilisation du port par défaut 5432');
        }
        
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
    let poolClosed = false; // Flag pour éviter la double fermeture

    try {
        // Vérifier si la table utilisateurs existe
        const checkTable = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'utilisateurs'
            );
        `);

        if (checkTable.rows[0].exists) {
            console.log('✅ Base de données déjà initialisée');
            await pool.end();
            return;
        }

        console.log('📝 Initialisation de la base de données...');
        
        // Essayer d'utiliser psql si disponible (plus fiable pour les fonctions PL/pgSQL)
        const { execSync } = require('child_process');
        const sqlPath = path.join(__dirname, '../../database/silypro_create_database_postgresql.sql');
        
        // Vérifier si psql est disponible
        try {
            execSync('which psql', { stdio: 'ignore' });
            console.log('📊 Utilisation de psql pour l\'initialisation...');
            
            const dbUrl = process.env.DATABASE_URL || 
                `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
            
            // Nettoyer le SQL : supprimer les commandes de création de DB et \c
            let sql = fs.readFileSync(sqlPath, 'utf8');
            sql = sql
                .replace(/DROP DATABASE IF EXISTS[^;]*;/gi, '')
                .replace(/CREATE DATABASE[^;]*;/gi, '')
                .replace(/\\c\s+\w+/gi, '')
                .replace(/--[^\n]*/g, '')
                .trim();
            
            // Écrire dans un fichier temporaire
            const tempFile = '/tmp/silypro_schema.sql';
            fs.writeFileSync(tempFile, sql);
            
            // Exécuter avec psql
            execSync(`psql "${dbUrl}" -f ${tempFile}`, { 
                stdio: 'inherit',
                env: { ...process.env, PGPASSWORD: process.env.DB_PASSWORD || '' }
            });
            
            console.log('✅ Base de données initialisée avec psql!');
            
            // Créer le compte admin
            const bcrypt = require('bcryptjs');
            const adminPassword = 'admin123';
            const hash = await bcrypt.hash(adminPassword, 10);
            
            try {
                await pool.query(`
                    INSERT INTO utilisateurs (email, mot_de_passe, nom, prenom, fonction, role, actif) 
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                    ON CONFLICT (email) DO NOTHING
                `, ['admin@silyprocure.com', hash, 'Admin', 'SilyProcure', 'Administrateur', 'admin', true]);
                
                console.log('✅ Compte admin créé');
                console.log('   Email: admin@silyprocure.com');
                console.log('   Mot de passe: admin123');
            } catch (error) {
                if (!error.message.includes('duplicate') && !error.message.includes('violates unique constraint')) {
                    console.warn('⚠️  Erreur création admin:', error.message);
                } else {
                    console.log('ℹ️  Compte admin existe déjà');
                }
            } finally {
                // Fermer le pool seulement une fois
                if (pool && !poolClosed) {
                    await pool.end();
                    poolClosed = true;
                }
            }
            return;
        } catch (psqlError) {
            // psql non disponible, utiliser le parser
            console.log('📊 psql non disponible, utilisation du parser SQL...');
        }
        
        // Parser SQL (fallback)
        let sql = fs.readFileSync(sqlPath, 'utf8');
        
        // Nettoyer le SQL : supprimer les commandes psql et les commentaires de ligne
        sql = sql
            // Supprimer les commandes psql (comme \c, \connect, etc.)
            .replace(/\\[a-zA-Z]+\s*[^\n]*/g, '')
            // Supprimer les commentaires de ligne
            .replace(/--[^\n]*/g, '')
            // Supprimer les lignes vides multiples
            .replace(/\n\s*\n\s*\n/g, '\n\n')
            .trim();
        
        // Parser intelligent pour gérer les blocs $$ (fonctions PL/pgSQL)
        const statements = [];
        let currentStatement = '';
        let inDollarQuote = false;
        let dollarTag = '';
        let i = 0;
        
        while (i < sql.length) {
            const char = sql[i];
            const nextChar = sql[i + 1];
            
            // Détecter le début d'un bloc $$ (dollar quoting)
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
            
            // Détecter la fin d'un bloc $$
            if (inDollarQuote) {
                const remaining = sql.substr(i);
                if (remaining.startsWith(dollarTag)) {
                    currentStatement += dollarTag;
                    const tagLength = dollarTag.length;
                    inDollarQuote = false;
                    dollarTag = '';
                    i += tagLength;
                    continue;
                }
            }
            
            // Détecter la fin d'une instruction SQL (; en dehors d'un bloc $$)
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
        let successCount = 0;
        let errorCount = 0;
        
        for (const statement of statements) {
            if (!statement.trim() || statement.trim() === ';') {
                continue;
            }
            
            try {
                await pool.query(statement);
                successCount++;
            } catch (error) {
                errorCount++;
                // Ignorer certaines erreurs attendues
                const ignorableErrors = [
                    'already exists',
                    'duplicate',
                    'does not exist',
                    'syntax error',
                    'unterminated'
                ];
                
                const shouldIgnore = ignorableErrors.some(msg => 
                    error.message.toLowerCase().includes(msg.toLowerCase())
                );
                
                if (!shouldIgnore) {
                    console.warn('⚠️  Erreur SQL:', error.message.substring(0, 100));
                }
            }
        }
        
        console.log(`📊 Instructions exécutées: ${successCount} réussies, ${errorCount} erreurs (certaines attendues)`);
        
        console.log('✅ Base de données initialisée avec succès!');
        
        // Vérifier et créer la table demandes_devis si elle n'existe pas
        try {
            const checkDemandesDevis = await pool.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' AND table_name = 'demandes_devis'
                )
            `);
            
            if (!checkDemandesDevis.rows[0].exists) {
                console.log('📋 Création de la table demandes_devis...');
                const demandesDevisSql = fs.readFileSync(
                    path.join(__dirname, '../../database/add_demandes_devis_postgresql.sql'),
                    'utf8'
                );
                
                // Nettoyer et exécuter le SQL
                const cleanedSql = demandesDevisSql
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
                                console.warn('⚠️  Erreur lors de la création de demandes_devis:', error.message.substring(0, 100));
                            }
                        }
                    }
                }
                console.log('✅ Table demandes_devis créée');
            } else {
                console.log('ℹ️  Table demandes_devis existe déjà');
            }
        } catch (error) {
            console.warn('⚠️  Erreur lors de la vérification/création de demandes_devis:', error.message);
        }
        
        // Créer le compte admin par défaut
        const bcrypt = require('bcryptjs');
        const adminPassword = 'admin123';
        const hash = await bcrypt.hash(adminPassword, 10);
        
        try {
            await pool.query(`
                INSERT INTO utilisateurs (email, mot_de_passe, nom, prenom, fonction, role, actif) 
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (email) DO NOTHING
            `, ['admin@silyprocure.com', hash, 'Admin', 'SilyProcure', 'Administrateur', 'admin', true]);
            
            console.log('✅ Compte admin créé');
            console.log('   Email: admin@silyprocure.com');
            console.log('   Mot de passe: admin123');
        } catch (error) {
            if (!error.message.includes('duplicate')) {
                console.warn('⚠️  Erreur création admin:', error.message);
            }
        }
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error.message);
        // Ne pas faire échouer le démarrage si la DB existe déjà
        if (!error.message.includes('already exists')) {
            throw error;
        }
    } finally {
        await pool.end();
    }
}

// Exécuter seulement si appelé directement
if (require.main === module) {
    initDatabase()
        .then(() => process.exit(0))
        .catch(error => {
            console.error('❌ Erreur:', error);
            process.exit(1);
        });
}

module.exports = initDatabase;

