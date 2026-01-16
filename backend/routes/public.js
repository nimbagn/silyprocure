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
    const { type = 'client', types } = req.query;
    const limitRaw = req.query.limit;
    const limit = Math.max(1, Math.min(parseInt(limitRaw || '16', 10) || 16, 50));

    const typesList = (types ? String(types) : String(type))
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    if (typesList.length === 0) {
      return res.status(400).json({ error: 'Paramètre type/types invalide' });
    }

    // Champs minimaux pour affichage (logos/noms)
    const inPlaceholders = typesList.map(() => '?').join(', ');
    const sql = `
      SELECT id, nom, raison_sociale, type_entreprise, site_web, actif, logo_url
      FROM entreprises
      WHERE actif = ? AND type_entreprise IN (${inPlaceholders})
      ORDER BY type_entreprise, nom
      LIMIT ?
    `;
    const params = [1, ...typesList, limit];
    const [rows] = await pool.execute(sql, params);

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;


