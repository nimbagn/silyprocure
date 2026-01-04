// Script d'initialisation de la base de données pour Render
// S'exécute automatiquement au premier démarrage si la base est vide

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function initDatabase() {
    console.log('🗄️  Vérification de la base de données...');
    
    // Utiliser DATABASE_URL si disponible (format Render), sinon utiliser les variables individuelles
    const connectionConfig = process.env.DATABASE_URL ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    } : {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    };
    
    const pool = new Pool(connectionConfig);

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
        
        const sqlPath = path.join(__dirname, '../../database/silypro_create_database_postgresql.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        // Exécuter le schéma (sans les commandes psql comme \c)
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s && !s.startsWith('\\') && !s.startsWith('--'))
            .filter(s => s.length > 0);

        for (const statement of statements) {
            if (statement.trim()) {
                try {
                    await pool.query(statement);
                } catch (error) {
                    // Ignorer les erreurs de "already exists"
                    if (!error.message.includes('already exists') && 
                        !error.message.includes('duplicate')) {
                        console.warn('⚠️  Avertissement:', error.message);
                    }
                }
            }
        }
        
        console.log('✅ Base de données initialisée avec succès!');
        
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

