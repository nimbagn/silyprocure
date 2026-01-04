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

// Test de connexion
pool.query('SELECT NOW()')
    .then(() => {
        console.log('✅ Connexion à la base de données PostgreSQL réussie');
    })
    .catch(err => {
        console.error('❌ Erreur de connexion à la base de données:', err.message);
    });

// Wrapper pour compatibilité avec mysql2 (pool.execute devient pool.query)
pool.execute = async (query, params) => {
    try {
        let pgQuery = query;
        let paramIndex = 1;
        const pgParams = [];
        
        // Convertir les placeholders ? en $1, $2, etc. pour PostgreSQL
        if (params && params.length > 0) {
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

module.exports = pool;

