/**
 * Script de Vérification de la Base de Données - SilyProcure
 * 
 * Vérifie que toutes les tables nécessaires existent et contiennent des données
 */

const pool = require('./backend/config/database');

// Liste des tables critiques
const TABLES_CRITIQUES = [
    'utilisateurs',
    'entreprises',
    'produits',
    'rfq',
    'devis',
    'commandes',
    'factures',
    'demandes_devis',
    'clients',
    'bons_livraison'
];

// Couleurs pour la console
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m'
};

function log(message, type = 'info') {
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
    const color = type === 'error' ? colors.red : type === 'success' ? colors.green : type === 'warning' ? colors.yellow : colors.cyan;
    console.log(`${color}${prefix} ${message}${colors.reset}`);
}

async function verifierTable(tableName) {
    try {
        // Détecter le type de base de données
        const isPostgreSQL = process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql';
        
        let exists;
        if (isPostgreSQL) {
            // PostgreSQL
            const result = await pool.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = $1
                );
            `, [tableName]);
            exists = result.rows[0].exists;
        } else {
            // MySQL - utiliser getConnection() pour une connexion directe
            const dbName = process.env.DB_NAME || 'silypro';
            const connection = await pool.getConnection();
            try {
                const [rows] = await connection.query(`
                    SELECT COUNT(*) as count
                    FROM information_schema.tables 
                    WHERE table_schema = ? 
                    AND table_name = ?
                `, [dbName, tableName]);
                exists = rows[0].count > 0;
            } finally {
                connection.release();
            }
        }

        if (!exists) {
            log(`Table '${tableName}' n'existe pas`, 'error');
            return { exists: false, count: 0 };
        }

        // Compter les lignes
        let count;
        if (isPostgreSQL) {
            const countResult = await pool.query(`SELECT COUNT(*) as count FROM ${tableName}`);
            count = parseInt(countResult.rows[0].count);
        } else {
            // MySQL - utiliser getConnection() pour une connexion directe
            const connection = await pool.getConnection();
            try {
                const [rows] = await connection.query(`SELECT COUNT(*) as count FROM ${tableName}`);
                count = parseInt(rows[0].count);
            } finally {
                connection.release();
            }
        }

        if (count === 0) {
            log(`Table '${tableName}' existe mais est vide`, 'warning');
        } else {
            log(`Table '${tableName}' existe avec ${count} enregistrement(s)`, 'success');
        }

        return { exists: true, count };
    } catch (error) {
        log(`Erreur lors de la vérification de '${tableName}': ${error.message}`, 'error');
        return { exists: false, count: 0, error: error.message };
    }
}

async function verifierUtilisateurAdmin() {
    try {
        const isPostgreSQL = process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql';
        const query = `
            SELECT COUNT(*) as count 
            FROM utilisateurs 
            WHERE role = 'admin' AND actif = true
        `;
        
        let count;
        if (isPostgreSQL) {
            const result = await pool.query(query);
            count = parseInt(result.rows[0].count);
        } else {
            // MySQL - utiliser getConnection() pour une connexion directe
            const connection = await pool.getConnection();
            try {
                const [rows] = await connection.query(query);
                count = parseInt(rows[0].count);
            } finally {
                connection.release();
            }
        }
        
        if (count === 0) {
            log('Aucun utilisateur admin actif trouvé', 'error');
            return false;
        } else {
            log(`${count} utilisateur(s) admin actif(s) trouvé(s)`, 'success');
            return true;
        }
    } catch (error) {
        log(`Erreur lors de la vérification des admins: ${error.message}`, 'error');
        return false;
    }
}

async function verifierConnexion() {
    try {
        const isPostgreSQL = process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql';
        
        let currentTime;
        if (isPostgreSQL) {
            const query = 'SELECT NOW() as current_time';
            const result = await pool.query(query);
            currentTime = result.rows[0].current_time;
        } else {
            // Pour MySQL, utiliser getConnection() pour obtenir une connexion directe
            // et exécuter la requête sans passer par le wrapper
            // Note: current_time est un mot-clé réservé en MySQL, utiliser backticks
            const connection = await pool.getConnection();
            try {
                const [rows] = await connection.query('SELECT NOW() as `current_time`');
                currentTime = rows[0].current_time;
            } finally {
                connection.release();
            }
        }
            
        log(`Connexion à la base de données réussie - ${currentTime}`, 'success');
        return true;
    } catch (error) {
        log(`Erreur de connexion à la base de données: ${error.message || error}`, 'error');
        if (error.stack) {
            console.error('Stack trace:', error.stack);
        }
        return false;
    }
}

async function verifierStructure() {
    log('\n=== VÉRIFICATION DE LA STRUCTURE DE LA BASE DE DONNÉES ===', 'info');
    
    const results = {};
    let totalTables = 0;
    let tablesOk = 0;
    let tablesVides = 0;
    let tablesManquantes = 0;

    for (const table of TABLES_CRITIQUES) {
        const result = await verifierTable(table);
        results[table] = result;
        
        totalTables++;
        if (result.exists) {
            if (result.count > 0) {
                tablesOk++;
            } else {
                tablesVides++;
            }
        } else {
            tablesManquantes++;
        }
    }

    // Résumé
    log('\n=== RÉSUMÉ ===', 'info');
    log(`Total de tables vérifiées: ${totalTables}`, 'info');
    log(`Tables OK (avec données): ${tablesOk}`, 'success');
    log(`Tables vides: ${tablesVides}`, tablesVides > 0 ? 'warning' : 'success');
    log(`Tables manquantes: ${tablesManquantes}`, tablesManquantes > 0 ? 'error' : 'success');

    return {
        totalTables,
        tablesOk,
        tablesVides,
        tablesManquantes,
        results
    };
}

async function runVerification() {
    log('🔍 DÉMARRAGE DE LA VÉRIFICATION DE LA BASE DE DONNÉES', 'info');

    // Test de connexion
    const connexionOk = await verifierConnexion();
    if (!connexionOk) {
        log('❌ Impossible de se connecter à la base de données. Vérifiez la configuration.', 'error');
        process.exit(1);
    }

    // Vérification des utilisateurs admin
    log('\n=== VÉRIFICATION DES UTILISATEURS ADMIN ===', 'info');
    const adminOk = await verifierUtilisateurAdmin();

    // Vérification de la structure
    const structure = await verifierStructure();

    // Conclusion
    log('\n=== CONCLUSION ===', 'info');
    if (structure.tablesManquantes > 0) {
        log('❌ Des tables critiques sont manquantes. Veuillez exécuter les migrations.', 'error');
        process.exit(1);
    } else if (!adminOk) {
        log('⚠️  Aucun utilisateur admin actif. Créez un compte admin pour pouvoir tester.', 'warning');
        process.exit(0);
    } else if (structure.tablesVides > 0) {
        log('⚠️  Certaines tables sont vides. Les tests peuvent être limités.', 'warning');
        process.exit(0);
    } else {
        log('✅ La base de données est prête pour les tests!', 'success');
        process.exit(0);
    }
}

// Exécution
if (require.main === module) {
    runVerification()
        .catch(error => {
            log(`❌ Erreur fatale: ${error.message}`, 'error');
            console.error(error);
            process.exit(1);
        });
}

module.exports = { runVerification, verifierTable };

