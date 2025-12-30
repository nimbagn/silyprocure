const express = require('express');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

router.use(authenticate);

// Liste des SLA
router.get('/', async (req, res) => {
    try {
        const { statut, fournisseur_id, client_id } = req.query;
        let query = `
            SELECT s.*, 
                   e1.nom as fournisseur_nom,
                   e2.nom as client_nom
            FROM sla s
            LEFT JOIN entreprises e1 ON s.fournisseur_id = e1.id
            LEFT JOIN entreprises e2 ON s.client_id = e2.id
            WHERE 1=1
        `;
        const params = [];

        if (statut) {
            query += ' AND s.statut = ?';
            params.push(statut);
        }

        if (fournisseur_id) {
            query += ' AND s.fournisseur_id = ?';
            params.push(fournisseur_id);
        }

        if (client_id) {
            query += ' AND s.client_id = ?';
            params.push(client_id);
        }

        query += ' ORDER BY s.date_entree_vigueur DESC';

        const [slas] = await pool.execute(query, params);
        res.json(slas);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

