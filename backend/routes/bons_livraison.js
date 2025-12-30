const express = require('express');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

router.use(authenticate);

// Liste des BL
router.get('/', async (req, res) => {
    try {
        const { commande_id, statut } = req.query;
        let query = `
            SELECT bl.*, 
                   c.numero as commande_numero,
                   e.nom as transporteur_nom
            FROM bons_livraison bl
            LEFT JOIN commandes c ON bl.commande_id = c.id
            LEFT JOIN entreprises e ON bl.transporteur_id = e.id
            WHERE 1=1
        `;
        const params = [];

        if (commande_id) {
            query += ' AND bl.commande_id = ?';
            params.push(commande_id);
        }

        if (statut) {
            query += ' AND bl.statut = ?';
            params.push(statut);
        }

        query += ' ORDER BY bl.date_emission DESC';

        const [bls] = await pool.execute(query, params);
        res.json(bls);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

