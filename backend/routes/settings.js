/**
 * Routes pour la gestion des paramètres système
 * Permet de configurer Message Pro, SMTP, etc.
 */

const express = require('express');
const pool = require('../config/database');
const { authenticate, requireRole } = require('../middleware/auth');
const router = express.Router();

// Toutes les routes nécessitent une authentification admin
router.use(authenticate);
router.use(requireRole('admin'));

// Récupérer tous les paramètres Message Pro
router.get('/messagepro', async (req, res) => {
    try {
        const [params] = await pool.execute(`
            SELECT cle, valeur 
            FROM parametres 
            WHERE cle LIKE 'messagpro_%' OR cle LIKE 'MESSAGEPRO_%'
            ORDER BY cle
        `);

        // Convertir en objet
        const settings = {};
        params.forEach(p => {
            // Normaliser la clé (enlever le préfixe)
            const key = p.cle.replace(/^(messagpro_|MESSAGEPRO_)/i, '').toLowerCase();
            settings[key] = p.valeur;
        });

        res.json(settings);
    } catch (error) {
        console.error('Erreur récupération paramètres Message Pro:', error);
        res.status(500).json({ error: error.message });
    }
});

// Sauvegarder les paramètres Message Pro
router.put('/messagepro', async (req, res) => {
    try {
        const {
            secret,
            sms_mode,
            gateway,
            device,
            sim,
            whatsapp_account
        } = req.body;

        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Fonction helper pour insérer/mettre à jour un paramètre (PostgreSQL)
            const upsertParam = async (cle, valeur) => {
                if (valeur === null || valeur === undefined || valeur === '') {
                    // Supprimer le paramètre si vide
                    await connection.execute(
                        'DELETE FROM parametres WHERE cle = $1',
                        [cle]
                    );
                } else {
                    // Vérifier si le paramètre existe
                    const [existing] = await connection.execute(
                        'SELECT id FROM parametres WHERE cle = $1',
                        [cle]
                    );
                    
                    if (existing && existing.length > 0) {
                        // Mettre à jour
                        await connection.execute(
                            'UPDATE parametres SET valeur = $1, date_modification = CURRENT_TIMESTAMP WHERE cle = $2',
                            [valeur, cle]
                        );
                    } else {
                        // Insérer
                        await connection.execute(
                            'INSERT INTO parametres (cle, valeur, description, date_modification) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)',
                            [cle, valeur, `Paramètre Message Pro: ${cle}`]
                        );
                    }
                }
            };

            // Sauvegarder chaque paramètre
            if (secret !== undefined) await upsertParam('MESSAGEPRO_SECRET', secret);
            if (sms_mode !== undefined) await upsertParam('MESSAGEPRO_SMS_MODE', sms_mode);
            if (gateway !== undefined) await upsertParam('MESSAGEPRO_GATEWAY', gateway);
            if (device !== undefined) await upsertParam('MESSAGEPRO_DEVICE', device);
            if (sim !== undefined) await upsertParam('MESSAGEPRO_SIM', sim ? sim.toString() : null);
            if (whatsapp_account !== undefined) await upsertParam('MESSAGEPRO_WHATSAPP_ACCOUNT', whatsapp_account);

            await connection.commit();
            // commit() libère déjà le client, pas besoin de release()

            // Mettre à jour les variables d'environnement en mémoire (pour cette instance)
            if (secret !== undefined) {
                process.env.MESSAGEPRO_SECRET = secret || process.env.MESSAGEPRO_SECRET;
                // Mettre à jour aussi dans le service Message Pro
                const messageProService = require('../services/messagepro');
                messageProService.updateSecret(secret || process.env.MESSAGEPRO_SECRET);
            }
            if (sms_mode !== undefined) process.env.MESSAGEPRO_SMS_MODE = sms_mode || process.env.MESSAGEPRO_SMS_MODE;
            if (gateway !== undefined) process.env.MESSAGEPRO_GATEWAY = gateway || process.env.MESSAGEPRO_GATEWAY;
            if (device !== undefined) process.env.MESSAGEPRO_DEVICE = device || process.env.MESSAGEPRO_DEVICE;
            if (sim !== undefined) process.env.MESSAGEPRO_SIM = sim ? sim.toString() : process.env.MESSAGEPRO_SIM;
            if (whatsapp_account !== undefined) process.env.MESSAGEPRO_WHATSAPP_ACCOUNT = whatsapp_account || process.env.MESSAGEPRO_WHATSAPP_ACCOUNT;

            res.json({ 
                message: 'Paramètres Message Pro sauvegardés avec succès',
                success: true
            });
        } catch (error) {
            await connection.rollback();
            // rollback() libère déjà le client, pas besoin de release()
            throw error;
        }
    } catch (error) {
        console.error('Erreur sauvegarde paramètres Message Pro:', error);
        res.status(500).json({ error: error.message });
    }
});

// Tester la connexion Message Pro
router.post('/messagepro/test', async (req, res) => {
    try {
        const messageProService = require('../services/messagepro');
        
        // S'assurer que le secret est chargé depuis la DB si nécessaire
        if (!messageProService.secret) {
            await messageProService.loadSecretFromDB();
        }
        
        if (!messageProService.secret) {
            return res.status(400).json({
                success: false,
                error: 'MESSAGEPRO_SECRET non configuré. Veuillez configurer votre clé API d\'abord.'
            });
        }
        
        // Tester en récupérant les crédits
        const credits = await messageProService.getCredits();
        
        res.json({
            success: true,
            message: 'Connexion Message Pro réussie',
            data: credits
        });
    } catch (error) {
        console.error('Erreur test connexion Message Pro:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Erreur lors du test de connexion'
        });
    }
});

// Récupérer les comptes WhatsApp disponibles
router.get('/messagepro/whatsapp-accounts', async (req, res) => {
    try {
        const messageProService = require('../services/messagepro');
        
        // S'assurer que le secret est chargé depuis la DB si nécessaire
        if (!messageProService.secret) {
            await messageProService.loadSecretFromDB();
        }
        
        if (!messageProService.secret) {
            return res.status(400).json({ 
                error: 'MESSAGEPRO_SECRET non configuré. Veuillez configurer votre clé API d\'abord.' 
            });
        }
        
        const { limit = 10, page = 1 } = req.query;
        
        const accounts = await messageProService.getWhatsAppAccounts(parseInt(limit), parseInt(page));
        res.json(accounts);
    } catch (error) {
        console.error('Erreur récupération comptes WhatsApp:', error);
        res.status(500).json({ error: error.message || 'Erreur lors de la récupération des comptes WhatsApp' });
    }
});

// Récupérer les devices disponibles
router.get('/messagepro/devices', async (req, res) => {
    try {
        const messageProService = require('../services/messagepro');
        
        // S'assurer que le secret est chargé depuis la DB si nécessaire
        if (!messageProService.secret) {
            await messageProService.loadSecretFromDB();
        }
        
        if (!messageProService.secret) {
            return res.status(400).json({ 
                error: 'MESSAGEPRO_SECRET non configuré. Veuillez configurer votre clé API d\'abord.' 
            });
        }
        
        const { limit = 10, page = 1 } = req.query;
        
        const devices = await messageProService.getDevices(parseInt(limit), parseInt(page));
        res.json(devices);
    } catch (error) {
        console.error('Erreur récupération devices:', error);
        res.status(500).json({ error: error.message || 'Erreur lors de la récupération des devices' });
    }
});

// Récupérer les gateways disponibles
router.get('/messagepro/gateways', async (req, res) => {
    try {
        const messageProService = require('../services/messagepro');
        
        // S'assurer que le secret est chargé depuis la DB si nécessaire
        if (!messageProService.secret) {
            await messageProService.loadSecretFromDB();
        }
        
        if (!messageProService.secret) {
            return res.status(400).json({ 
                error: 'MESSAGEPRO_SECRET non configuré. Veuillez configurer votre clé API d\'abord.' 
            });
        }
        
        const rates = await messageProService.getRates();
        res.json(rates);
    } catch (error) {
        console.error('Erreur récupération gateways:', error);
        res.status(500).json({ error: error.message || 'Erreur lors de la récupération des gateways' });
    }
});

module.exports = router;

