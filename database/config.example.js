/**
 * Configuration de la base de données SilyProcure (Node.js)
 * 
 * Copiez ce fichier en config.js et modifiez les valeurs si nécessaire
 */

module.exports = {
    database: {
        host: 'localhost',
        port: 3306,
        database: 'silypro',
        user: 'soul',
        password: 'Satina2025',
        charset: 'utf8mb4',
        connectionLimit: 10,
        timezone: 'local'
    }
};

