const express = require('express');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

router.use(authenticate);

// Liste des projets
router.get('/', async (req, res) => {
    try {
        const { statut } = req.query;
        let query = `
            SELECT p.*, 
                   u.nom as responsable_nom, u.prenom as responsable_prenom
            FROM projets p
            LEFT JOIN utilisateurs u ON p.responsable_id = u.id
            WHERE 1=1
        `;
        const params = [];

        if (statut) {
            query += ' AND p.statut = ?';
            params.push(statut);
        }

        query += ' ORDER BY p.date_creation DESC';

        const [projets] = await pool.execute(query, params);
        res.json(projets);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Liste des centres de coût
router.get('/centres-cout', async (req, res) => {
    try {
        const [centres] = await pool.execute(
            'SELECT * FROM centres_cout WHERE actif = 1 ORDER BY code'
        );
        res.json(centres);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

