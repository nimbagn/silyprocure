const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { authLimiter } = require('../middleware/security');
const { validateLogin } = require('../middleware/validation');
const router = express.Router();

// Connexion avec rate limiting strict
router.post('/login', authLimiter, validateLogin, async (req, res) => {
    try {
        const { email, mot_de_passe } = req.body;

        if (!email || !mot_de_passe) {
            return res.status(400).json({ error: 'Email et mot de passe requis' });
        }

        // Récupérer l'utilisateur
        // Le wrapper PostgreSQL convertit automatiquement ? en $1, $2, etc.
        let result, users;
        try {
            if (pool.execute) {
                // Utiliser pool.execute (fonctionne avec MySQL et wrapper PostgreSQL)
                result = await pool.execute(
                    'SELECT * FROM utilisateurs WHERE email = ? AND actif = ?',
                    [email, true]
                );
                users = result[0] || result.rows || [];
            } else {
                // PostgreSQL direct (sans wrapper)
                result = await pool.query(
                    'SELECT * FROM utilisateurs WHERE email = $1 AND actif = TRUE',
                    [email]
                );
                users = result.rows || [];
            }
        } catch (dbError) {
            console.error('❌ Erreur base de données lors de la connexion:', dbError.message);
            console.error('   Stack:', dbError.stack);
            return res.status(500).json({ error: 'Erreur serveur lors de la connexion' });
        }

        if (!users || users.length === 0) {
            console.log('⚠️  Aucun utilisateur trouvé pour:', email);
            return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
        }

        const user = users[0];

        // Vérifier le mot de passe
        const isValidPassword = await bcrypt.compare(mot_de_passe, user.mot_de_passe);

        if (!isValidPassword) {
            console.log('⚠️  Mot de passe incorrect pour:', email);
            return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
        }
        
        console.log('✅ Connexion réussie pour:', email);

        // Mettre à jour la dernière connexion
        if (pool.execute) {
            await pool.execute(
                'UPDATE utilisateurs SET derniere_connexion = NOW() WHERE id = ?',
                [user.id]
            );
        } else {
            await pool.query(
                'UPDATE utilisateurs SET derniere_connexion = NOW() WHERE id = $1',
                [user.id]
            );
        }

        // Générer le token JWT
        if (!process.env.JWT_SECRET) {
            console.error('❌ ERREUR: JWT_SECRET non défini');
            return res.status(500).json({ error: 'Erreur de configuration serveur' });
        }
        
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        // Retourner les informations utilisateur (sans le mot de passe)
        const { mot_de_passe: _, ...userWithoutPassword } = user;

        res.json({
            message: 'Connexion réussie',
            token,
            user: userWithoutPassword
        });
    } catch (error) {
        console.error('Erreur lors de la connexion:', error);
        res.status(500).json({ error: 'Erreur serveur lors de la connexion' });
    }
});

// Vérifier le token
router.get('/verify', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Token manquant' });
        }

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ error: 'Erreur de configuration serveur' });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Récupérer l'utilisateur
        let result, users;
        if (pool.execute) {
            result = await pool.execute(
                'SELECT id, email, nom, prenom, role, actif FROM utilisateurs WHERE id = ?',
                [decoded.userId]
            );
            users = result[0] || result.rows || [];
        } else {
            result = await pool.query(
                'SELECT id, email, nom, prenom, role, actif FROM utilisateurs WHERE id = $1',
                [decoded.userId]
            );
            users = result.rows || [];
        }

        if (!users || users.length === 0) {
            return res.status(401).json({ error: 'Utilisateur non trouvé' });
        }

        res.json({ user: users[0] });
    } catch (error) {
        res.status(401).json({ error: 'Token invalide' });
    }
});

module.exports = router;

