const express = require('express');
const pool = require('../config/database');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Fonction helper pour logger
function debugLog(location, message, data) {
    const logEntry = {
        location,
        message,
        data,
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'A'
    };
    const logPath = path.join(__dirname, '../../.cursor/debug.log');
    try {
        fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n');
    } catch (e) {
        console.log(`[DEBUG] ${location}: ${message}`, data);
    }
}

/**
 * Endpoint public: liste d'entreprises actives (pour page publique / home).
 * GET /api/public/entreprises?type=client&limit=16
 *
 * NOTE: volontairement sans auth (pas de données sensibles).
 */
router.get('/entreprises', async (req, res) => {
  try {
    // #region agent log
    debugLog('public.js:12', 'Endpoint /entreprises appelé', { type: req.query.type, types: req.query.types, limit: req.query.limit });
    // #endregion
    
    const { type = 'client', types } = req.query;
    const limitRaw = req.query.limit;
    const limit = Math.max(1, Math.min(parseInt(limitRaw || '16', 10) || 16, 50));

    const typesList = (types ? String(types) : String(type))
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    // #region agent log
    debugLog('public.js:22', 'Types list construite', { typesList, limit });
    // #endregion

    if (typesList.length === 0) {
      return res.status(400).json({ error: 'Paramètre type/types invalide' });
    }

    // Champs minimaux pour affichage (logos/noms)
    // Construire la requête avec des placeholders ? (sera converti automatiquement par le wrapper)
    // Le wrapper convertira ? en $1, $2, etc. pour PostgreSQL dans l'ordre d'apparition
    const inPlaceholders = typesList.map(() => '?').join(', ');
    // Note: logo_url peut ne pas exister dans toutes les bases de données
    // On le retire de la requête pour éviter l'erreur "Unknown column"
    // Le code frontend gérera l'absence de logo_url en affichant les initiales
    
    // Valider et convertir limit en nombre (MySQL ne supporte pas les placeholders pour LIMIT)
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 30));
    
    const sql = `
      SELECT id, nom, raison_sociale, type_entreprise, site_web, actif
      FROM entreprises
      WHERE actif = ? AND type_entreprise IN (${inPlaceholders})
      ORDER BY type_entreprise, nom
      LIMIT ${limitNum}
    `;
    // Ordre des paramètres : actif (1 pour MySQL, true pour PostgreSQL - le wrapper gère la conversion)
    // Puis chaque type dans typesList
    // Total: 1 (actif) + typesList.length (types) = typesList.length + 1
    // LIMIT est maintenant directement interpolé (pas de placeholder)
    const params = [1, ...typesList];
    
    // #region agent log
    const questionMarksCount = (sql.match(/\?/g) || []).length;
    debugLog('public.js:65', 'Requête SQL construite', { 
      sql: sql.replace(/\s+/g, ' ').trim(), 
      paramsCount: params.length, 
      params: params,
      typesListLength: typesList.length,
      inPlaceholdersCount: (inPlaceholders.match(/\?/g) || []).length,
      questionMarksInSql: questionMarksCount,
      limitNum: limitNum,
      expectedParams: typesList.length + 1,
      match: questionMarksCount === params.length ? 'OK' : 'MISMATCH'
    });
    // #endregion
    
    const [rows] = await pool.execute(sql, params);
    
    // #region agent log
    debugLog('public.js:40', 'SQL exécuté avec succès', { rowsCount: rows?.length || 0 });
    // #endregion

    res.json(rows);
  } catch (error) {
    // #region agent log
    debugLog('public.js:45', 'Erreur dans endpoint /entreprises', { errorMessage: error.message, errorStack: error.stack?.substring(0, 500) });
    // #endregion
    console.error('❌ Erreur /api/public/entreprises:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;


