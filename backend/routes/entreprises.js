const express = require('express');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { validateEntreprise, validateId } = require('../middleware/validation');
const messageProService = require('../services/messagepro');
const router = express.Router();

router.use(authenticate);

// Liste des entreprises
router.get('/', async (req, res) => {
    try {
        const { type, search } = req.query;
        let query = 'SELECT * FROM entreprises WHERE 1=1';
        const params = [];

        let paramIndex = 1;
        if (type) {
            query += ` AND type_entreprise = $${paramIndex}`;
            params.push(type);
            paramIndex++;
        }

        if (search) {
            const searchTerm = `%${search}%`;
            query += ` AND (nom LIKE $${paramIndex} OR raison_sociale LIKE $${paramIndex + 1} OR rccm LIKE $${paramIndex + 2} OR siret LIKE $${paramIndex + 3})`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
            paramIndex += 4;
        }

        query += ' ORDER BY nom';

        const [entreprises] = await pool.execute(query, params);
        res.json(entreprises);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Détails d'une entreprise avec relations
router.get('/:id', validateId, async (req, res) => {
    try {
        const { id } = req.params;

        const [entreprises] = await pool.execute('SELECT * FROM entreprises WHERE id = $1', [id]);
        if (entreprises.length === 0) {
            return res.status(404).json({ error: 'Entreprise non trouvée' });
        }

        const entreprise = entreprises[0];

        // Récupérer les adresses
        const [adresses] = await pool.execute('SELECT * FROM adresses WHERE entreprise_id = $1', [id]);
        entreprise.adresses = adresses;

        // Récupérer les contacts
        const [contacts] = await pool.execute('SELECT * FROM contacts WHERE entreprise_id = $1', [id]);
        entreprise.contacts = contacts;

        // Récupérer les coordonnées bancaires
        const [coordonnees] = await pool.execute('SELECT * FROM coordonnees_bancaires WHERE entreprise_id = $1', [id]);
        entreprise.coordonnees_bancaires = coordonnees;

        res.json(entreprise);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Créer une entreprise
router.post('/', validateEntreprise, async (req, res) => {
    try {
        const { 
            nom, raison_sociale, rccm, numero_contribuable, capital_social, forme_juridique, secteur_activite,
            siret, tva_intracommunautaire, type_entreprise, email, telephone, site_web, notes 
        } = req.body;

        const [result] = await pool.execute(
            `INSERT INTO entreprises (nom, raison_sociale, rccm, numero_contribuable, capital_social, forme_juridique, secteur_activite,
             siret, tva_intracommunautaire, type_entreprise, email, telephone, site_web, notes) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING id`,
            [
                nom, 
                raison_sociale || null, 
                rccm || null,
                numero_contribuable || null,
                capital_social || null,
                forme_juridique || null,
                secteur_activite || null,
                siret || null, 
                tva_intracommunautaire || null, 
                type_entreprise, 
                email || null, 
                telephone || null, 
                site_web || null, 
                notes || null
            ]
        );

        const entrepriseId = result.rows && result.rows[0] ? result.rows[0].id : (result.insertId || result[0]?.id);

        // Envoyer une notification WhatsApp si c'est un fournisseur avec un numéro de téléphone
        if (type_entreprise === 'fournisseur' && telephone) {
            try {
                await sendWelcomeWhatsAppToSupplier(nom, telephone);
            } catch (error) {
                // Ne pas faire échouer la création si l'envoi WhatsApp échoue
                console.error('⚠️  Erreur envoi WhatsApp de bienvenue au fournisseur:', error.message);
            }
        }

        res.status(201).json({ id: entrepriseId, message: 'Entreprise créée avec succès' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Mettre à jour une entreprise
router.put('/:id', validateId, validateEntreprise, async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            nom, raison_sociale, rccm, numero_contribuable, capital_social, forme_juridique, secteur_activite,
            siret, tva_intracommunautaire, email, telephone, site_web, actif, notes 
        } = req.body;

        await pool.execute(
            `UPDATE entreprises SET nom = $1, raison_sociale = $2, rccm = $3, numero_contribuable = $4, capital_social = $5, 
             forme_juridique = $6, secteur_activite = $7, siret = $8, tva_intracommunautaire = $9, email = $10, 
             telephone = $11, site_web = $12, actif = $13, notes = $14 WHERE id = $15`,
            [
                nom, raison_sociale, rccm || null, numero_contribuable || null, capital_social || null,
                forme_juridique || null, secteur_activite || null, siret, tva_intracommunautaire, 
                email, telephone, site_web, actif !== undefined ? actif : 1, notes, id
            ]
        );

        res.json({ message: 'Entreprise mise à jour avec succès' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Supprimer une entreprise
router.delete('/:id', validateId, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Vérifier si l'entreprise est utilisée
        const [rfqs] = await pool.execute('SELECT COUNT(*) as count FROM rfq WHERE destinataire_id = $1', [id]);
        const [commandes] = await pool.execute('SELECT COUNT(*) as count FROM commandes WHERE fournisseur_id = $1', [id]);
        
        if (rfqs[0].count > 0 || commandes[0].count > 0) {
            return res.status(400).json({ 
                error: 'Impossible de supprimer cette entreprise car elle est utilisée dans des documents' 
            });
        }
        
        // Supprimer les relations
        await pool.execute('DELETE FROM adresses WHERE entreprise_id = $1', [id]);
        await pool.execute('DELETE FROM contacts WHERE entreprise_id = $1', [id]);
        await pool.execute('DELETE FROM coordonnees_bancaires WHERE entreprise_id = $1', [id]);
        
        // Supprimer l'entreprise
        await pool.execute('DELETE FROM entreprises WHERE id = $1', [id]);
        
        res.json({ message: 'Entreprise supprimée avec succès' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Envoie un message WhatsApp de bienvenue à un nouveau fournisseur
 */
async function sendWelcomeWhatsAppToSupplier(nomEntreprise, telephone) {
    try {
        // Assurer que le secret est chargé
        await messageProService.loadSecret();

        if (!messageProService.secret) {
            console.warn('⚠️  MESSAGEPRO_SECRET non configuré. WhatsApp de bienvenue non envoyé.');
            return false;
        }

        // Récupérer le compte WhatsApp à utiliser
        let whatsappAccount = process.env.MESSAGEPRO_WHATSAPP_ACCOUNT;
        
        // Si aucun compte configuré, essayer de récupérer le premier compte disponible
        if (!whatsappAccount) {
            try {
                const accounts = await messageProService.getWhatsAppAccounts(1, 1);
                if (accounts && accounts.length > 0) {
                    whatsappAccount = accounts[0].unique || accounts[0].id;
                    console.log(`📱 Utilisation du compte WhatsApp: ${whatsappAccount}`);
                } else {
                    console.warn('⚠️  Aucun compte WhatsApp disponible pour envoyer le message de bienvenue');
                    return false;
                }
            } catch (error) {
                console.error('❌ Erreur récupération comptes WhatsApp:', error);
                return false;
            }
        }

        // Préparer le message de bienvenue
        const message = `🚢 *SilyProcure*\n\nBonjour ${nomEntreprise},\n\nNous sommes ravis de vous informer que votre entreprise a été répertoriée dans notre base de données de fournisseurs.\n\n📋 *Prochaines étapes:*\nVous recevrez très bientôt des notifications ou des demandes de devis pour des opportunités d'affaires correspondant à votre secteur d'activité.\n\n💼 *SilyProcure* est une plateforme de gestion des achats qui connecte les entreprises avec des fournisseurs de qualité.\n\nNous vous remercions de votre confiance et restons à votre disposition pour toute question.\n\nCordialement,\nL'équipe SilyProcure`;

        // Options pour Message Pro
        const options = {
            type: 'text',
            priority: 1 // Priorité normale
        };

        // Envoyer le WhatsApp via Message Pro
        const result = await messageProService.sendWhatsApp(whatsappAccount, telephone, message, options);
        
        console.log('✅ WhatsApp de bienvenue envoyé au fournisseur:', nomEntreprise, 'via', telephone);
        return true;
    } catch (error) {
        console.error('❌ Erreur envoi WhatsApp de bienvenue:', error);
        return false;
    }
}

module.exports = router;

