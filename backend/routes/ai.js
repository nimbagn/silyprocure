const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const quoteAnalyzer = require('../services/ai/quoteAnalyzer');
const supplierRecommender = require('../services/ai/supplierRecommender');
const anomalyDetector = require('../services/ai/anomalyDetector');
const chatbot = require('../services/ai/chatbot');
const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

/**
 * POST /api/ai/analyze-quotes/:rfq_id
 * Analyse tous les devis d'une RFQ et génère des recommandations
 */
router.post('/analyze-quotes/:rfq_id', async (req, res) => {
    try {
        const { rfq_id } = req.params;
        const rfqId = parseInt(rfq_id);

        if (isNaN(rfqId)) {
            return res.status(400).json({ error: 'RFQ ID invalide' });
        }

        const analysis = await quoteAnalyzer.analyzeQuotes(rfqId);
        res.json(analysis);
    } catch (error) {
        console.error('Erreur analyse devis IA:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/ai/analyze-quotes/:rfq_id
 * Récupère l'analyse précédente (depuis le cache)
 */
router.get('/analyze-quotes/:rfq_id', async (req, res) => {
    try {
        const { rfq_id } = req.params;
        const rfqId = parseInt(rfq_id);

        if (isNaN(rfqId)) {
            return res.status(400).json({ error: 'RFQ ID invalide' });
        }

        const pool = require('../config/database');
        const [analyses] = await pool.execute(
            `SELECT resultat, date_creation, date_modification 
             FROM ai_analyses 
             WHERE rfq_id = ? AND type_analyse = 'quote_analysis'
             ORDER BY date_modification DESC LIMIT 1`,
            [rfqId]
        );

        if (analyses.length === 0) {
            return res.status(404).json({ error: 'Aucune analyse trouvée' });
        }

        const result = JSON.parse(analyses[0].resultat);
        res.json(result);
    } catch (error) {
        console.error('Erreur récupération analyse:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/ai/recommend-suppliers
 * Recommande des fournisseurs pour une demande de devis ou RFQ
 */
router.post('/recommend-suppliers', async (req, res) => {
    try {
        const { demande_devis_id, rfq_id } = req.body;

        if (!demande_devis_id && !rfq_id) {
            return res.status(400).json({ error: 'demande_devis_id ou rfq_id requis' });
        }

        let recommendations;
        if (demande_devis_id) {
            recommendations = await supplierRecommender.recommendForDemande(parseInt(demande_devis_id));
        } else {
            recommendations = await supplierRecommender.recommendForRFQ(parseInt(rfq_id));
        }

        res.json({ recommendations });
    } catch (error) {
        console.error('Erreur recommandation fournisseurs:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/ai/detect-anomalies/:devis_id
 * Détecte les anomalies dans un devis
 */
router.post('/detect-anomalies/:devis_id', async (req, res) => {
    try {
        const { devis_id } = req.params;
        const devisId = parseInt(devis_id);

        if (isNaN(devisId)) {
            return res.status(400).json({ error: 'Devis ID invalide' });
        }

        const anomalies = await anomalyDetector.detectDevisAnomalies(devisId);
        res.json({ anomalies });
    } catch (error) {
        console.error('Erreur détection anomalies:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/ai/anomalies
 * Récupère les anomalies non résolues
 */
router.get('/anomalies', async (req, res) => {
    try {
        const { entite_type, entite_id, resolue } = req.query;
        const pool = require('../config/database');

        let query = 'SELECT * FROM ai_anomalies WHERE 1=1';
        const params = [];

        if (entite_type) {
            query += ' AND entite_type = ?';
            params.push(entite_type);
        }

        if (entite_id) {
            query += ' AND entite_id = ?';
            params.push(parseInt(entite_id));
        }

        if (resolue !== undefined) {
            query += ' AND resolue = ?';
            params.push(resolue === 'true' ? 1 : 0);
        }

        query += ' ORDER BY date_creation DESC LIMIT 50';

        const [anomalies] = await pool.execute(query, params);
        res.json({ anomalies });
    } catch (error) {
        console.error('Erreur récupération anomalies:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/ai/chat
 * Chatbot d'assistance
 */
router.post('/chat', async (req, res) => {
    try {
        const { message, context } = req.body;

        if (!message || typeof message !== 'string') {
            return res.status(400).json({ error: 'Message requis' });
        }

        const userContext = {
            user_id: req.user ? req.user.id : null,
            ...context
        };

        const response = await chatbot.processMessage(message, userContext);
        res.json({ response });
    } catch (error) {
        console.error('Erreur chatbot:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

