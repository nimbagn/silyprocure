const jwt = require('jsonwebtoken');
const pool = require('../config/database');

// Middleware d'authentification
const authenticate = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({ error: 'Token d\'authentification manquant' });
        }

        // Vérifier que JWT_SECRET est défini
        if (!process.env.JWT_SECRET) {
            console.error('❌ ERREUR CRITIQUE: JWT_SECRET n\'est pas défini dans les variables d\'environnement');
            return res.status(500).json({ error: 'Erreur de configuration serveur' });
        }

        // Vérifier le token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Récupérer l'utilisateur
        let result, users;
        if (pool.execute) {
            result = await pool.execute(
                'SELECT id, email, nom, prenom, role, actif FROM utilisateurs WHERE id = ? AND actif = ?',
                [decoded.userId, true]
            );
            users = result[0] || result.rows || [];
        } else {
            result = await pool.query(
                'SELECT id, email, nom, prenom, role, actif FROM utilisateurs WHERE id = $1 AND actif = TRUE',
                [decoded.userId]
            );
            users = result.rows || [];
        }

        if (!users || users.length === 0) {
            return res.status(401).json({ error: 'Utilisateur non trouvé ou inactif' });
        }

        req.user = users[0];
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token invalide ou expiré' });
    }
};

// Middleware de vérification des rôles
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentification requise' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Accès refusé. Rôle insuffisant.' });
        }

        next();
    };
};

module.exports = {
    authenticate,
    requireRole
};

