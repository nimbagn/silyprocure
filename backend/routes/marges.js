const express = require('express');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

router.use(authenticate);

// Récupérer la marge active (par défaut)
router.get('/active', async (req, res) => {
    try {
        const [marges] = await pool.execute(
            'SELECT * FROM marges_commerciales WHERE actif = TRUE ORDER BY id DESC LIMIT 1'
        );
        
        if (marges.length === 0) {
            // Retourner une marge par défaut de 20%
            return res.json({ id: null, nom: 'Marge par défaut', pourcentage: 20.00, description: 'Marge commerciale par défaut' });
        }
        
        res.json(marges[0]);
    } catch (error) {
        console.error('Erreur récupération marge active:', error);
        // En cas d'erreur (table n'existe pas encore), retourner une marge par défaut
        res.json({ id: null, nom: 'Marge par défaut', pourcentage: 20.00, description: 'Marge commerciale par défaut' });
    }
});

// Récupérer toutes les marges
router.get('/', async (req, res) => {
    try {
        const [marges] = await pool.execute(
            'SELECT * FROM marges_commerciales ORDER BY actif DESC, id DESC'
        );
        res.json(marges);
    } catch (error) {
        console.error('Erreur récupération marges:', error);
        res.json([]);
    }
});

// Créer une marge
router.post('/', async (req, res) => {
    try {
        const { nom, pourcentage, description } = req.body;
        
        if (!nom || !pourcentage) {
            return res.status(400).json({ error: 'Nom et pourcentage requis' });
        }
        
        const [result] = await pool.execute(
            'INSERT INTO marges_commerciales (nom, pourcentage, description) VALUES (?, ?, ?)',
            [nom, pourcentage, description || null]
        );
        
        res.status(201).json({ id: result.insertId, message: 'Marge créée avec succès' });
    } catch (error) {
        console.error('Erreur création marge:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

