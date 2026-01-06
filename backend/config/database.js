require('dotenv').config();

// Détection automatique du type de base de données
// Si DATABASE_URL est défini → PostgreSQL (Render)
// Si DB_TYPE=postgresql → PostgreSQL
// Sinon → MySQL (local par défaut)
const usePostgreSQL = process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql';

let pool;

if (usePostgreSQL) {
    // Configuration PostgreSQL
    console.log('📊 Utilisation de PostgreSQL');
    
    const { Pool: PgPool } = require('pg');
    
    let dbConfig;
    if (process.env.DATABASE_URL) {
        dbConfig = {
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false },
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000
        };
    } else {
        dbConfig = {
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432'),
            database: process.env.DB_NAME || 'silypro',
            user: process.env.DB_USER || 'soul',
            password: process.env.DB_PASSWORD || 'Satina2025',
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
            ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
        };
    }

    const pgPool = new PgPool(dbConfig);

    // Gestion des erreurs du pool
    pgPool.on('error', (err, client) => {
        console.error('❌ Erreur inattendue sur le client PostgreSQL inactif', err);
        process.exit(-1);
    });

    // Sauvegarder la méthode originale avant modification
    const originalQuery = pgPool.query.bind(pgPool);

    // Wrapper pour compatibilité avec mysql2 (pool.execute devient pool.query)
    pgPool.execute = async (query, params) => {
        try {
            let pgQuery = query;
            let paramIndex = 1;
            const pgParams = [];
            
            // Vérifier si la requête contient déjà des placeholders PostgreSQL ($1, $2, etc.)
            const hasPostgresPlaceholders = /\$\d+/.test(query);
            
            if (hasPostgresPlaceholders) {
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
            
            // Remplacer DATE_FORMAT par TO_CHAR
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
            
            // Remplacer DATE_SUB par soustraction d'INTERVAL
            pgQuery = pgQuery.replace(/DATE_SUB\s*\(\s*([^,]+)\s*,\s*INTERVAL\s+(\d+)\s+(\w+)\s*\)/gi, (match, dateExpr, amount, unit) => {
                const pgUnit = unit.toLowerCase() === 'month' ? 'months' : 
                              unit.toLowerCase() === 'day' ? 'days' :
                              unit.toLowerCase() === 'year' ? 'years' :
                              unit.toLowerCase() === 'hour' ? 'hours' :
                              unit.toLowerCase() === 'minute' ? 'minutes' : unit.toLowerCase() + 's';
                return `${dateExpr.trim()} - INTERVAL '${amount} ${pgUnit}'`;
            });
            
            // Remplacer MONTH() et YEAR() par EXTRACT()
            pgQuery = pgQuery.replace(/MONTH\s*\(\s*([^)]+)\s*\)/gi, (match, dateExpr) => {
                return `EXTRACT(MONTH FROM ${dateExpr.trim()})`;
            });
            pgQuery = pgQuery.replace(/YEAR\s*\(\s*([^)]+)\s*\)/gi, (match, dateExpr) => {
                return `EXTRACT(YEAR FROM ${dateExpr.trim()})`;
            });
            
            // Remplacer CURRENT_DATE() par CURRENT_DATE
            pgQuery = pgQuery.replace(/CURRENT_DATE\s*\(\s*\)/gi, 'CURRENT_DATE');
            
            const result = await originalQuery(pgQuery, pgParams);
            
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
            
            return [result.rows, mockResult];
        } catch (error) {
            throw error;
        }
    };

    // Adapter pool.query pour retourner aussi insertId
    pgPool.query = async function(query, params) {
        if (!query || typeof query !== 'string' || query.trim() === '') {
            throw new Error('Query vide ou invalide');
        }
        
        const result = await originalQuery(query, params);
        
        if (query.toUpperCase().includes('INSERT') && 
            query.toUpperCase().includes('RETURNING') && 
            result.rows && result.rows.length > 0) {
            result.insertId = result.rows[0].id || result.rows[0][Object.keys(result.rows[0])[0]];
        }
        
        return result;
    };

    // Ajouter getConnection() pour compatibilité MySQL
    pgPool.getConnection = async () => {
        const client = await pgPool.connect();
        let transactionStarted = false;
        
        const connection = {
            execute: async (query, params) => {
                let pgQuery = query;
                let paramIndex = 1;
                const pgParams = [];
                
                const hasPostgresPlaceholders = /\$\d+/.test(query);
                
                if (hasPostgresPlaceholders) {
                    pgParams.push(...(params || []));
                } else if (params && params.length > 0) {
                    pgQuery = query.replace(/\?/g, () => {
                        pgParams.push(params[paramIndex - 1]);
                        return `$${paramIndex++}`;
                    });
                }
                
                const queryUpper = pgQuery.trim().toUpperCase();
                if (queryUpper.startsWith('INSERT') && 
                    !queryUpper.includes('RETURNING') &&
                    !queryUpper.includes('SELECT')) {
                    const tableMatch = pgQuery.match(/INTO\s+(\w+)/i);
                    if (tableMatch) {
                        pgQuery += ' RETURNING id';
                    }
                }
                
                pgQuery = pgQuery.replace(/IFNULL\s*\(/gi, 'COALESCE(');
                pgQuery = pgQuery.replace(/GROUP_CONCAT\s*\(/gi, 'STRING_AGG(');
                pgQuery = pgQuery.replace(/SEPARATOR\s+['"]([^'"]+)['"]/gi, (match, sep) => `, '${sep}'`);
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
                pgQuery = pgQuery.replace(/DATE_SUB\s*\(\s*([^,]+)\s*,\s*INTERVAL\s+(\d+)\s+(\w+)\s*\)/gi, (match, dateExpr, amount, unit) => {
                    const pgUnit = unit.toLowerCase() === 'month' ? 'months' : 
                                  unit.toLowerCase() === 'day' ? 'days' :
                                  unit.toLowerCase() === 'year' ? 'years' :
                                  unit.toLowerCase() === 'hour' ? 'hours' :
                                  unit.toLowerCase() === 'minute' ? 'minutes' : unit.toLowerCase() + 's';
                    return `${dateExpr.trim()} - INTERVAL '${amount} ${pgUnit}'`;
                });
                pgQuery = pgQuery.replace(/MONTH\s*\(\s*([^)]+)\s*\)/gi, (match, dateExpr) => {
                    return `EXTRACT(MONTH FROM ${dateExpr.trim()})`;
                });
                pgQuery = pgQuery.replace(/YEAR\s*\(\s*([^)]+)\s*\)/gi, (match, dateExpr) => {
                    return `EXTRACT(YEAR FROM ${dateExpr.trim()})`;
                });
                pgQuery = pgQuery.replace(/CURRENT_DATE\s*\(\s*\)/gi, 'CURRENT_DATE');
                
                const result = await client.query(pgQuery, pgParams);
                
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
            _client: client
        };
        
        return connection;
    };

    // Test de connexion PostgreSQL
    originalQuery('SELECT NOW() as now')
        .then(() => {
            console.log('✅ Connexion à la base de données PostgreSQL réussie');
        })
        .catch(err => {
            console.error('❌ Erreur de connexion à la base de données PostgreSQL:', err.message);
        });

    pool = pgPool;
} else {
    // Configuration MySQL (local)
    console.log('📊 Utilisation de MySQL');
    
    const mysql = require('mysql2/promise');
    
    const dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        database: process.env.DB_NAME || 'silypro',
        user: process.env.DB_USER || 'soul',
        password: process.env.DB_PASSWORD || 'Satina2025',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        charset: 'utf8mb4'
    };

    const mysqlPool = mysql.createPool(dbConfig);

    // Fonction helper pour convertir les requêtes PostgreSQL en MySQL
    const convertPostgresToMySQL = (query, params) => {
        let mysqlQuery = query;
        let mysqlParams = params || [];
        
        // Convertir les placeholders PostgreSQL ($1, $2, etc.) en ? pour MySQL
        const hasPostgresPlaceholders = /\$\d+/.test(query);
        if (hasPostgresPlaceholders) {
            // Extraire tous les placeholders PostgreSQL dans l'ordre d'apparition
            const placeholdersOrder = [];
            mysqlQuery = mysqlQuery.replace(/\$(\d+)/g, (match, index) => {
                const idx = parseInt(index);
                placeholdersOrder.push(idx);
                return '?';
            });
            
            // Réorganiser les paramètres selon l'ordre des placeholders
            if (params && params.length > 0) {
                // Trouver le placeholder maximum pour vérifier qu'on a assez de paramètres
                const maxPlaceholder = Math.max(...placeholdersOrder);
                if (maxPlaceholder > params.length) {
                    console.warn(`⚠️ Placeholder $${maxPlaceholder} demandé mais seulement ${params.length} paramètre(s) fourni(s)`);
                }
                
                // Réorganiser les paramètres selon l'ordre d'apparition des placeholders
                mysqlParams = placeholdersOrder.map(idx => {
                    if (idx >= 1 && idx <= params.length) {
                        return params[idx - 1];
                    }
                    return null;
                }).filter(p => p !== null);
            } else {
                mysqlParams = [];
            }
        } else {
            // Pas de placeholders PostgreSQL, utiliser les paramètres tels quels
            mysqlParams = params || [];
        }
        
        // Convertir EXTRACT(MONTH FROM ...) en MONTH(...)
        mysqlQuery = mysqlQuery.replace(/EXTRACT\s*\(\s*MONTH\s+FROM\s+([^)]+)\s*\)/gi, (match, dateExpr) => {
            return `MONTH(${dateExpr.trim()})`;
        });
        
        // Convertir EXTRACT(YEAR FROM ...) en YEAR(...)
        mysqlQuery = mysqlQuery.replace(/EXTRACT\s*\(\s*YEAR\s+FROM\s+([^)]+)\s*\)/gi, (match, dateExpr) => {
            return `YEAR(${dateExpr.trim()})`;
        });
        
        // Convertir CURRENT_DATE - INTERVAL 'X unit' en DATE_SUB(CURRENT_DATE(), INTERVAL X unit)
        mysqlQuery = mysqlQuery.replace(/CURRENT_DATE\s*-\s*INTERVAL\s+['"](\d+)\s+(\w+)['"]/gi, (match, amount, unit) => {
            const mysqlUnit = unit.toLowerCase() === 'months' ? 'MONTH' :
                             unit.toLowerCase() === 'month' ? 'MONTH' :
                             unit.toLowerCase() === 'days' ? 'DAY' :
                             unit.toLowerCase() === 'day' ? 'DAY' :
                             unit.toLowerCase() === 'years' ? 'YEAR' :
                             unit.toLowerCase() === 'year' ? 'YEAR' :
                             unit.toLowerCase() === 'hours' ? 'HOUR' :
                             unit.toLowerCase() === 'hour' ? 'HOUR' :
                             unit.toLowerCase() === 'minutes' ? 'MINUTE' :
                             unit.toLowerCase() === 'minute' ? 'MINUTE' : unit.toUpperCase();
            return `DATE_SUB(CURRENT_DATE(), INTERVAL ${amount} ${mysqlUnit})`;
        });
        
        // Convertir CURRENT_DATE en CURRENT_DATE() pour MySQL
        mysqlQuery = mysqlQuery.replace(/\bCURRENT_DATE\b(?!\()/gi, 'CURRENT_DATE()');
        
        // Convertir TO_CHAR(date, 'YYYY-MM') en DATE_FORMAT(date, '%Y-%m')
        mysqlQuery = mysqlQuery.replace(/TO_CHAR\s*\(\s*([^,]+)\s*,\s*['"]([^'"]+)['"]\s*\)/gi, (match, dateExpr, format) => {
            const mysqlFormat = format
                .replace(/YYYY/g, '%Y')
                .replace(/MM/g, '%m')
                .replace(/DD/g, '%d')
                .replace(/HH24/g, '%H')
                .replace(/MI/g, '%i')
                .replace(/SS/g, '%s');
            return `DATE_FORMAT(${dateExpr.trim()}, '${mysqlFormat}')`;
        });
        
        // Convertir COALESCE en IFNULL
        mysqlQuery = mysqlQuery.replace(/COALESCE\s*\(/gi, 'IFNULL(');
        
        // Convertir STRING_AGG en GROUP_CONCAT
        mysqlQuery = mysqlQuery.replace(/STRING_AGG\s*\(\s*([^,]+)\s*,\s*['"]([^'"]+)['"]\s*\)/gi, (match, expr, sep) => {
            return `GROUP_CONCAT(${expr.trim()} SEPARATOR '${sep}')`;
        });
        
        // Supprimer RETURNING id pour MySQL (n'existe pas en MySQL)
        const isInsert = mysqlQuery.trim().toUpperCase().startsWith('INSERT');
        const hasReturning = /RETURNING\s+id/i.test(mysqlQuery);
        if (hasReturning) {
            mysqlQuery = mysqlQuery.replace(/\s+RETURNING\s+id\s*$/i, '');
        }
        
        return { mysqlQuery, mysqlParams, isInsert, hasPostgresPlaceholders };
    };
    
    // Sauvegarder la méthode originale AVANT de la remplacer
    const originalExecute = mysqlPool.execute.bind(mysqlPool);
    
    // Wrapper pour convertir les requêtes PostgreSQL en MySQL
    mysqlPool.execute = async (query, params) => {
        const { mysqlQuery, mysqlParams, isInsert, hasPostgresPlaceholders } = convertPostgresToMySQL(query, params);
        // Debug: afficher la requête convertie si nécessaire
        if (hasPostgresPlaceholders) {
            console.log('🔧 MySQL Conversion:', {
                original: query.substring(0, 100) + '...',
                converted: mysqlQuery.substring(0, 100) + '...',
                paramsCount: params?.length || 0,
                mysqlParamsCount: mysqlParams.length
            });
        }
        
        // Utiliser la méthode originale sauvegardée
        const result = await originalExecute(mysqlQuery, mysqlParams);
        
        // Pour MySQL, result[0] contient les lignes et result[1] contient les métadonnées
        // Adapter le format pour correspondre à PostgreSQL
        const rows = result[0] || [];
        const metadata = result[1] || {};
        const fields = metadata.fields || [];
        
        // Pour les INSERT, MySQL retourne insertId dans les métadonnées (result[0].insertId)
        // ou dans result[1].insertId selon la version de mysql2
        const insertId = isInsert ? (result[0]?.insertId || metadata.insertId || null) : null;
        
        const mockResult = {
            insertId: insertId,
            affectedRows: metadata.affectedRows || 0,
            rows: rows,
            fields: fields
        };
        
        return [rows, mockResult];
    };

    // Sauvegarder getConnection original
    const originalGetConnection = mysqlPool.getConnection.bind(mysqlPool);
    
    // Wrapper pour getConnection() avec conversion automatique
    mysqlPool.getConnection = async () => {
        const connection = await originalGetConnection();
        
        // Sauvegarder execute original de la connexion
        const originalConnectionExecute = connection.execute.bind(connection);
        
        // Wrapper pour connection.execute() avec conversion
        connection.execute = async (query, params) => {
            const { mysqlQuery, mysqlParams, isInsert } = convertPostgresToMySQL(query, params);
            
            // Utiliser la méthode execute originale de la connexion
            const result = await originalConnectionExecute(mysqlQuery, mysqlParams);
            const rows = result[0] || [];
            const metadata = result[1] || {};
            const insertId = isInsert ? (result[0]?.insertId || metadata.insertId || null) : null;
            
            return [rows, {
                insertId: insertId,
                affectedRows: metadata.affectedRows || 0,
                rows: rows,
                fields: metadata.fields || []
            }];
        };
        
        return connection;
    };

    // Test de connexion MySQL
    originalGetConnection()
        .then(connection => {
            console.log('✅ Connexion à la base de données MySQL réussie');
            connection.release();
        })
        .catch(err => {
            console.error('❌ Erreur de connexion à la base de données MySQL:', err.message);
        });

    pool = mysqlPool;
}

module.exports = pool;
