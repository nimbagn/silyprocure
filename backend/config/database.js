const { Pool } = require('pg');
require('dotenv').config();

// Configuration de la connexion à la base de données PostgreSQL
// Utiliser DATABASE_URL en priorité (format Render), sinon utiliser les variables individuelles
let dbConfig;

if (process.env.DATABASE_URL) {
    // Utiliser DATABASE_URL (format Render)
    dbConfig = {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000
    };
} else {
    // Utiliser les variables individuelles
    dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'silypro',
        user: process.env.DB_USER || 'soul',
        password: process.env.DB_PASSWORD || 'Satina2025',
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    };
}

// Création du pool de connexions
const pool = new Pool(dbConfig);

// Gestion des erreurs du pool
pool.on('error', (err, client) => {
    console.error('❌ Erreur inattendue sur le client PostgreSQL inactif', err);
    process.exit(-1);
});

// Wrapper pour compatibilité avec mysql2 (pool.execute devient pool.query)
pool.execute = async (query, params) => {
    try {
        let pgQuery = query;
        let paramIndex = 1;
        const pgParams = [];
        
        // Vérifier si la requête contient déjà des placeholders PostgreSQL ($1, $2, etc.)
        const hasPostgresPlaceholders = /\$\d+/.test(query);
        
        if (hasPostgresPlaceholders) {
            // Si la requête contient déjà des placeholders PostgreSQL, utiliser directement les paramètres
            pgParams.push(...(params || []));
        } else if (params && params.length > 0) {
            // Convertir les placeholders ? en $1, $2, etc. pour PostgreSQL
            pgQuery = query.replace(/\?/g, () => {
                pgParams.push(params[paramIndex - 1]);
                return `$${paramIndex++}`;
            });
        }
        
        // Si c'est un INSERT sans RETURNING, l'ajouter automatiquement pour récupérer l'ID
        const queryUpper = pgQuery.trim().toUpperCase();
        if (queryUpper.startsWith('INSERT') && 
            !queryUpper.includes('RETURNING') &&
            !queryUpper.includes('SELECT')) {
            // Extraire le nom de la table
            const tableMatch = pgQuery.match(/INTO\s+(\w+)/i);
            if (tableMatch) {
                pgQuery += ' RETURNING id';
            }
        }
        
        // Remplacer les fonctions MySQL par leurs équivalents PostgreSQL
        pgQuery = pgQuery.replace(/IFNULL\s*\(/gi, 'COALESCE(');
        pgQuery = pgQuery.replace(/GROUP_CONCAT\s*\(/gi, 'STRING_AGG(');
        pgQuery = pgQuery.replace(/SEPARATOR\s+['"]([^'"]+)['"]/gi, (match, sep) => `, '${sep}'`);
        
        // Remplacer DATE_FORMAT par TO_CHAR pour PostgreSQL
        pgQuery = pgQuery.replace(/DATE_FORMAT\s*\(\s*([^,]+)\s*,\s*['"]([^'"]+)['"]\s*\)/gi, (match, dateExpr, format) => {
            // Convertir le format MySQL en format PostgreSQL
            const pgFormat = format
                .replace(/%Y/g, 'YYYY')
                .replace(/%m/g, 'MM')
                .replace(/%d/g, 'DD')
                .replace(/%H/g, 'HH24')
                .replace(/%i/g, 'MI')
                .replace(/%s/g, 'SS');
            return `TO_CHAR(${dateExpr.trim()}, '${pgFormat}')`;
        });
        
        // Remplacer DATE_SUB par soustraction d'INTERVAL pour PostgreSQL
        pgQuery = pgQuery.replace(/DATE_SUB\s*\(\s*([^,]+)\s*,\s*INTERVAL\s+(\d+)\s+(\w+)\s*\)/gi, (match, dateExpr, amount, unit) => {
            const pgUnit = unit.toLowerCase() === 'month' ? 'months' : 
                          unit.toLowerCase() === 'day' ? 'days' :
                          unit.toLowerCase() === 'year' ? 'years' :
                          unit.toLowerCase() === 'hour' ? 'hours' :
                          unit.toLowerCase() === 'minute' ? 'minutes' : unit.toLowerCase() + 's';
            return `${dateExpr.trim()} - INTERVAL '${amount} ${pgUnit}'`;
        });
        
        // Remplacer MONTH() et YEAR() par EXTRACT() pour PostgreSQL
        pgQuery = pgQuery.replace(/MONTH\s*\(\s*([^)]+)\s*\)/gi, (match, dateExpr) => {
            return `EXTRACT(MONTH FROM ${dateExpr.trim()})`;
        });
        pgQuery = pgQuery.replace(/YEAR\s*\(\s*([^)]+)\s*\)/gi, (match, dateExpr) => {
            return `EXTRACT(YEAR FROM ${dateExpr.trim()})`;
        });
        
        // Remplacer CURRENT_DATE() par CURRENT_DATE (sans parenthèses)
        pgQuery = pgQuery.replace(/CURRENT_DATE\s*\(\s*\)/gi, 'CURRENT_DATE');
        
        // Remplacer NOW() par CURRENT_TIMESTAMP (ou garder NOW() qui fonctionne aussi)
        // NOW() fonctionne en PostgreSQL, donc on peut le laisser
        
        const result = await pool.query(pgQuery, pgParams);
        
        // Créer un objet compatible avec mysql2 pour insertId
        const mockResult = {
            insertId: null,
            affectedRows: result.rowCount,
            rows: result.rows,
            fields: result.fields
        };
        
        // Si la requête contient RETURNING et qu'on a un résultat, extraire l'ID
        if (pgQuery.toUpperCase().includes('RETURNING') && result.rows.length > 0) {
            const row = result.rows[0];
            // Chercher la colonne 'id' ou la première colonne
            mockResult.insertId = row.id || row[Object.keys(row)[0]];
        }
        
        // Retourner le format [rows, mockResult] comme mysql2
        // mysql2 retourne [rows, fields] mais on ajoute insertId dans mockResult
        return [result.rows, mockResult];
    } catch (error) {
        throw error;
    }
};

// Adapter pool.query pour retourner aussi insertId quand nécessaire
const originalQuery = pool.query.bind(pool);
pool.query = async (query, params) => {
    const result = await originalQuery(query, params);
    
    // Ajouter insertId si c'est un INSERT avec RETURNING
    if (query.toUpperCase().includes('INSERT') && 
        query.toUpperCase().includes('RETURNING') && 
        result.rows.length > 0) {
        result.insertId = result.rows[0].id || result.rows[0][Object.keys(result.rows[0])[0]];
    }
    
    return result;
};

// Ajouter getConnection() pour compatibilité MySQL (retourne un client PostgreSQL)
pool.getConnection = async () => {
    const client = await pool.connect();
    let transactionStarted = false;
    
    // Wrapper pour compatibilité MySQL
    const connection = {
        execute: async (query, params) => {
            // Utiliser le client de la transaction pour toutes les requêtes
            let pgQuery = query;
            let paramIndex = 1;
            const pgParams = [];
            
            // Vérifier si la requête contient déjà des placeholders PostgreSQL ($1, $2, etc.)
            const hasPostgresPlaceholders = /\$\d+/.test(query);
            
            if (hasPostgresPlaceholders) {
                // Si la requête contient déjà des placeholders PostgreSQL, utiliser directement les paramètres
                pgParams.push(...(params || []));
            } else if (params && params.length > 0) {
                // Convertir les placeholders ? en $1, $2, etc. pour PostgreSQL
                pgQuery = query.replace(/\?/g, () => {
                    pgParams.push(params[paramIndex - 1]);
                    return `$${paramIndex++}`;
                });
            }
            
            // Si c'est un INSERT sans RETURNING, l'ajouter automatiquement
            const queryUpper = pgQuery.trim().toUpperCase();
            if (queryUpper.startsWith('INSERT') && 
                !queryUpper.includes('RETURNING') &&
                !queryUpper.includes('SELECT')) {
                const tableMatch = pgQuery.match(/INTO\s+(\w+)/i);
                if (tableMatch) {
                    pgQuery += ' RETURNING id';
                }
            }
            
            // Remplacer les fonctions MySQL par leurs équivalents PostgreSQL
            pgQuery = pgQuery.replace(/IFNULL\s*\(/gi, 'COALESCE(');
            pgQuery = pgQuery.replace(/GROUP_CONCAT\s*\(/gi, 'STRING_AGG(');
            pgQuery = pgQuery.replace(/SEPARATOR\s+['"]([^'"]+)['"]/gi, (match, sep) => `, '${sep}'`);
            
            // Remplacer DATE_FORMAT par TO_CHAR pour PostgreSQL
            pgQuery = pgQuery.replace(/DATE_FORMAT\s*\(\s*([^,]+)\s*,\s*['"]([^'"]+)['"]\s*\)/gi, (match, dateExpr, format) => {
                const pgFormat = format
                    .replace(/%Y/g, 'YYYY')
                    .replace(/%m/g, 'MM')
                    .replace(/%d/g, 'DD')
                    .replace(/%H/g, 'HH24')
                    .replace(/%i/g, 'MI')
                    .replace(/%s/g, 'SS');
                return `TO_CHAR(${dateExpr.trim()}, '${pgFormat}')`;
            });
            
            // Remplacer DATE_SUB par soustraction d'INTERVAL pour PostgreSQL
            pgQuery = pgQuery.replace(/DATE_SUB\s*\(\s*([^,]+)\s*,\s*INTERVAL\s+(\d+)\s+(\w+)\s*\)/gi, (match, dateExpr, amount, unit) => {
                const pgUnit = unit.toLowerCase() === 'month' ? 'months' : 
                              unit.toLowerCase() === 'day' ? 'days' :
                              unit.toLowerCase() === 'year' ? 'years' :
                              unit.toLowerCase() === 'hour' ? 'hours' :
                              unit.toLowerCase() === 'minute' ? 'minutes' : unit.toLowerCase() + 's';
                return `${dateExpr.trim()} - INTERVAL '${amount} ${pgUnit}'`;
            });
            
            // Remplacer MONTH() et YEAR() par EXTRACT() pour PostgreSQL
            pgQuery = pgQuery.replace(/MONTH\s*\(\s*([^)]+)\s*\)/gi, (match, dateExpr) => {
                return `EXTRACT(MONTH FROM ${dateExpr.trim()})`;
            });
            pgQuery = pgQuery.replace(/YEAR\s*\(\s*([^)]+)\s*\)/gi, (match, dateExpr) => {
                return `EXTRACT(YEAR FROM ${dateExpr.trim()})`;
            });
            
            // Remplacer CURRENT_DATE() par CURRENT_DATE (sans parenthèses)
            pgQuery = pgQuery.replace(/CURRENT_DATE\s*\(\s*\)/gi, 'CURRENT_DATE');
            
            const result = await client.query(pgQuery, pgParams);
            
            // Créer un objet compatible avec mysql2
            const mockResult = {
                insertId: null,
                affectedRows: result.rowCount,
                rows: result.rows,
                fields: result.fields
            };
            
            if (pgQuery.toUpperCase().includes('RETURNING') && result.rows.length > 0) {
                const row = result.rows[0];
                mockResult.insertId = row.id || row[Object.keys(row)[0]];
            }
            
            // Retourner le format [rows, mockResult] comme mysql2
            return [result.rows, mockResult];
        },
        query: async (query, params) => {
            return await client.query(query, params);
        },
        beginTransaction: async () => {
            await client.query('BEGIN');
            transactionStarted = true;
        },
        commit: async () => {
            await client.query('COMMIT');
            transactionStarted = false;
            client.release();
        },
        rollback: async () => {
            await client.query('ROLLBACK');
            transactionStarted = false;
            client.release();
        },
        release: () => {
            if (!transactionStarted) {
                client.release();
            }
        },
        // Garder le client pour les requêtes dans la transaction
        _client: client
    };
    
    return connection;
};

// Test de connexion (après avoir défini tous les wrappers)
// Utiliser la méthode originale du Pool PostgreSQL directement
const originalPoolQuery = Pool.prototype.query.bind(pool);
originalPoolQuery('SELECT NOW() as now')
    .then((result) => {
        console.log('✅ Connexion à la base de données PostgreSQL réussie');
    })
    .catch(err => {
        console.error('❌ Erreur de connexion à la base de données:', err.message);
        // Ne pas faire échouer le démarrage si la DB n'est pas disponible
    });

module.exports = pool;

