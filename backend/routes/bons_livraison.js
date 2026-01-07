const express = require('express');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { notifyClientLivraison } = require('../utils/whatsappNotifications');
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

        let paramIndex = 1;

        if (commande_id) {
            query += ` AND bl.commande_id = $${paramIndex}`;
            params.push(commande_id);
            paramIndex++;
        }

        if (statut) {
            query += ` AND bl.statut = $${paramIndex}`;
            params.push(statut);
            paramIndex++;
        }

        query += ' ORDER BY bl.date_emission DESC';

        const [bls] = await pool.execute(query, params);
        res.json(bls);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Détails d'un bon de livraison
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [bls] = await pool.execute(
            `SELECT bl.*, 
                    c.numero as commande_numero, c.total_ht as commande_total_ht,
                    c.total_tva as commande_total_tva, c.total_ttc as commande_total_ttc,
                    e.nom as transporteur_nom
             FROM bons_livraison bl
             LEFT JOIN commandes c ON bl.commande_id = c.id
             LEFT JOIN entreprises e ON bl.transporteur_id = e.id
             WHERE bl.id = $1`,
            [id]
        );

        if (bls.length === 0) {
            return res.status(404).json({ error: 'Bon de livraison non trouvé' });
        }

        const bl = bls[0];

        // Récupérer les lignes du BL
        const [lignes] = await pool.execute(
            `SELECT bl_l.*, cl.reference, cl.description, cl.quantite as quantite_commandee,
                    cl.unite, cl.prix_unitaire_ht, cl.total_ht
             FROM bl_lignes bl_l
             LEFT JOIN commande_lignes cl ON bl_l.commande_ligne_id = cl.id
             WHERE bl_l.bl_id = $1 ORDER BY bl_l.id`,
            [id]
        );
        bl.lignes = lignes;

        res.json(bl);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

