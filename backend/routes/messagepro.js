/**
 * Routes API pour Message Pro
 * Permet de gérer les comptes WhatsApp, devices, crédits, etc.
 */

const express = require('express');
const messageProService = require('../services/messagepro');
const { authenticate, requireRole } = require('../middleware/auth');
const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// Route pour vérifier les crédits
router.get('/credits', requireRole('admin', 'superviseur'), async (req, res) => {
    try {
        const credits = await messageProService.getCredits();
        res.json(credits);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route pour récupérer les comptes WhatsApp
router.get('/whatsapp/accounts', requireRole('admin', 'superviseur'), async (req, res) => {
    try {
        const { limit = 10, page = 1 } = req.query;
        const accounts = await messageProService.getWhatsAppAccounts(parseInt(limit), parseInt(page));
        res.json(accounts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route pour récupérer les devices Android
router.get('/devices', requireRole('admin', 'superviseur'), async (req, res) => {
    try {
        const { limit = 10, page = 1 } = req.query;
        const devices = await messageProService.getDevices(parseInt(limit), parseInt(page));
        res.json(devices);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route pour récupérer les taux des gateways
router.get('/rates', requireRole('admin', 'superviseur'), async (req, res) => {
    try {
        const rates = await messageProService.getRates();
        res.json(rates);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route pour envoyer un SMS de test
router.post('/test/sms', requireRole('admin'), async (req, res) => {
    try {
        const { phone, message, mode = 'credits', device, gateway, sim } = req.body;
        
        if (!phone || !message) {
            return res.status(400).json({ error: 'phone et message sont requis' });
        }

        const options = {};
        if (device) options.device = device;
        if (gateway) options.gateway = gateway;
        if (sim) options.sim = parseInt(sim);

        const result = await messageProService.sendSMS(phone, message, mode, options);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route pour envoyer un WhatsApp de test
router.post('/test/whatsapp', requireRole('admin'), async (req, res) => {
    try {
        const { account, recipient, message, priority = 1 } = req.body;
        
        if (!account || !recipient || !message) {
            return res.status(400).json({ error: 'account, recipient et message sont requis' });
        }

        const options = {
            type: 'text',
            priority: priority
        };

        const result = await messageProService.sendWhatsApp(account, recipient, message, options);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

