const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuration de la connexion à la base de données
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

// Création du pool de connexions
const pool = mysql.createPool(dbConfig);

// Test de connexion
pool.getConnection()
    .then(connection => {
        console.log('✅ Connexion à la base de données MySQL réussie');
        connection.release();
    })
    .catch(err => {
        console.error('❌ Erreur de connexion à la base de données:', err.message);
    });

module.exports = pool;

