const express = require('express');
const pool = require('../config/database');

const router = express.Router();

/**
 * Endpoint public: liste d'entreprises actives (pour page publique / home).
 * GET /api/public/entreprises?type=client&limit=16
 *
 * NOTE: volontairement sans auth (pas de données sensibles).
 */
router.get('/entreprises', async (req, res) => {
  try {
    const { type = 'client' } = req.query;
    const limitRaw = req.query.limit;
    const limit = Math.max(1, Math.min(parseInt(limitRaw || '16', 10) || 16, 50));

    // Champs minimaux pour affichage (logos/noms)
    const [rows] = await pool.execute(
      `SELECT id, nom, raison_sociale, type_entreprise, site_web, actif
       FROM entreprises
       WHERE actif = ? AND type_entreprise = ?
       ORDER BY nom
       LIMIT ?`,
      [1, type, limit]
    );

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;


