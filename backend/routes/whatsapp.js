/**
 * Routes pour gérer les webhooks WhatsApp entrants
 * Permet de recevoir des messages WhatsApp et de créer des demandes de devis
 */

const express = require('express');
const whatsappParser = require('../services/whatsappParser');
const pool = require('../config/database');
const { authenticate, requireRole } = require('../middleware/auth');
const router = express.Router();

// Webhook pour recevoir les messages WhatsApp entrants (SANS authentification)
// MessagePro enverra les messages ici
router.post('/webhook', async (req, res) => {
    try {
        console.log('📱 Webhook WhatsApp reçu:', JSON.stringify(req.body, null, 2));

        // Format attendu de MessagePro (à adapter selon leur documentation)
        const { 
            account,      // ID du compte WhatsApp
            sender,       // Numéro de l'expéditeur
            message,      // Message texte
            type,         // Type de message (text, image, document, etc.)
            timestamp,    // Timestamp
            media_url,    // URL du média si présent
            document_url  // URL du document si présent
        } = req.body;

        // Validation basique
        if (!sender || !message) {
            return res.status(400).json({ 
                error: 'sender et message sont requis',
                received: Object.keys(req.body)
            });
        }

        // Ignorer les messages système ou de statut
        if (type === 'status' || type === 'system') {
            return res.status(200).json({ message: 'Message système ignoré' });
        }

        // Parser le message avec l'IA
        const parsedData = await whatsappParser.parseDevisRequest(message, sender);

        // Sauvegarder la demande en attente de validation
        const demandeId = await savePendingDemande(parsedData, {
            account,
            sender,
            raw_message: message,
            type,
            timestamp,
            media_url,
            document_url
        });

        // Notifier les admins (en arrière-plan)
        notifyAdminsNewWhatsAppDemande(demandeId, parsedData).catch(err => {
            console.error('Erreur notification admins:', err);
        });

        // Répondre au client par WhatsApp (en arrière-plan)
        sendAcknowledgmentWhatsApp(sender, demandeId).catch(err => {
            console.error('Erreur envoi accusé réception WhatsApp:', err);
        });

        // Répondre au webhook
        res.status(200).json({
            success: true,
            message: 'Message reçu et traité',
            demande_id: demandeId,
            confiance: parsedData.confiance
        });

    } catch (error) {
        console.error('❌ Erreur webhook WhatsApp:', error);
        res.status(500).json({ 
            error: 'Erreur traitement webhook',
            message: error.message 
        });
    }
});

/**
 * Sauvegarde une demande en attente de validation
 */
async function savePendingDemande(parsedData, metadata) {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
        // Insérer dans la table demandes_devis avec statut 'nouvelle' et source WhatsApp
        const [result] = await connection.execute(
            `INSERT INTO demandes_devis (
                nom, email, telephone, entreprise, message,
                adresse_livraison, ville_livraison, pays_livraison,
                statut, date_creation, mode_notification
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), $10) RETURNING id`,
            [
                parsedData.nom,
                parsedData.email,
                parsedData.telephone,
                parsedData.entreprise,
                parsedData.message || parsedData.raw_message,
                parsedData.adresse_livraison,
                parsedData.ville_livraison,
                parsedData.pays_livraison || 'Guinée',
                'nouvelle',
                'whatsapp'
            ]
        );

        const demandeId = result.rows && result.rows[0] ? result.rows[0].id : (result.insertId || result[0]?.id);

        // Insérer les lignes d'articles
        for (let i = 0; i < parsedData.articles.length; i++) {
            const article = parsedData.articles[i];
            await connection.execute(
                `INSERT INTO demandes_devis_lignes (
                    demande_devis_id, description, quantite, unite, secteur, ordre
                ) VALUES ($1, $2, $3, $4, $5, $6)`,
                [
                    demandeId,
                    article.description,
                    article.quantite,
                    article.unite,
                    article.secteur,
                    i
                ]
            );
        }

        // Sauvegarder les métadonnées WhatsApp dans notes_internes
        const notesInternes = JSON.stringify({
            source: 'whatsapp',
            account: metadata.account,
            confiance: parsedData.confiance,
            timestamp: metadata.timestamp || new Date().toISOString(),
            media_url: metadata.media_url,
            document_url: metadata.document_url,
            raw_message: metadata.raw_message
        });

        await connection.execute(
            'UPDATE demandes_devis SET notes_internes = $1 WHERE id = $2',
            [notesInternes, demandeId]
        );

        await connection.commit();
        return demandeId;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

/**
 * Notifie les admins d'une nouvelle demande WhatsApp
 */
async function notifyAdminsNewWhatsAppDemande(demandeId, parsedData) {
    try {
        const { notifyAdminsAndSupervisors } = require('../utils/notificationService');
        
        await notifyAdminsAndSupervisors(
            'demande_devis',
            `📱 Nouvelle demande WhatsApp - Confiance: ${(parsedData.confiance * 100).toFixed(0)}%`,
            `Une nouvelle demande de devis a été reçue par WhatsApp de ${parsedData.nom}${parsedData.entreprise ? ` (${parsedData.entreprise})` : ''}.\n\n${parsedData.articles.length} article(s) détecté(s).\n\nConfiance d'extraction: ${(parsedData.confiance * 100).toFixed(0)}%\n\nVeuillez valider et compléter les informations si nécessaire.`,
            'demande_devis',
            demandeId
        );
    } catch (error) {
        console.error('Erreur notification admins:', error);
    }
}

/**
 * Envoie un accusé de réception au client par WhatsApp
 */
async function sendAcknowledgmentWhatsApp(sender, demandeId) {
    try {
        const messageProService = require('../services/messagepro');
        const { getWhatsAppAccount } = require('../utils/whatsappNotifications');

        const account = await getWhatsAppAccount();
        if (!account) {
            console.warn('⚠️  Aucun compte WhatsApp configuré pour répondre');
            return false;
        }

        const message = `🚢 *SilyProcure*\n\n✅ Votre demande de devis a été reçue !\n\nNous avons bien reçu votre message et notre équipe va l'analyser dans les plus brefs délais.\n\n📋 *Référence:* DEM-${demandeId}\n\nNous vous contacterons prochainement pour finaliser votre demande.\n\nMerci de votre confiance !\n\n📞 Contact: +224 622 69 24 33`;

        await messageProService.sendWhatsApp(account, sender, message, {
            type: 'text',
            priority: 1
        });

        console.log('✅ Accusé réception WhatsApp envoyé à', sender);
        return true;
    } catch (error) {
        console.error('❌ Erreur envoi accusé réception WhatsApp:', error);
        return false;
    }
}

// Route pour lister les demandes WhatsApp en attente (nécessite authentification)
router.get('/pending', authenticate, requireRole('admin', 'superviseur'), async (req, res) => {
    try {
        const [demandes] = await pool.execute(
            `SELECT d.*, 
                    STRING_AGG(
                        l.description || ' (' || l.quantite || ' ' || l.unite || ')',
                        '; '
                    ) as articles_resume
             FROM demandes_devis d
             LEFT JOIN demandes_devis_lignes l ON d.id = l.demande_devis_id
             WHERE d.mode_notification = 'whatsapp' 
               AND d.statut = 'nouvelle'
             GROUP BY d.id
             ORDER BY d.date_creation DESC
             LIMIT 50`
        );

        res.json(demandes);
    } catch (error) {
        console.error('Erreur récupération demandes WhatsApp:', error);
        res.status(500).json({ error: error.message });
    }
});

// Route pour valider et convertir une demande WhatsApp en demande complète
router.post('/pending/:id/validate', authenticate, requireRole('admin', 'superviseur'), async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            nom, email, telephone, entreprise, 
            adresse_livraison, ville_livraison, pays_livraison,
            articles // Array d'articles à mettre à jour
        } = req.body;

        // Récupérer la demande
        const [demandes] = await pool.execute(
            'SELECT * FROM demandes_devis WHERE id = $1',
            [id]
        );

        if (demandes.length === 0) {
            return res.status(404).json({ error: 'Demande non trouvée' });
        }

        const demande = demandes[0];

        // Mettre à jour la demande avec les informations validées
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            await connection.execute(
                `UPDATE demandes_devis 
                 SET nom = COALESCE($1, nom),
                     email = COALESCE($2, email),
                     telephone = COALESCE($3, telephone),
                     entreprise = COALESCE($4, entreprise),
                     adresse_livraison = COALESCE($5, adresse_livraison),
                     ville_livraison = COALESCE($6, ville_livraison),
                     pays_livraison = COALESCE($7, pays_livraison),
                     statut = 'en_cours',
                     traite_par = $8,
                     date_modification = NOW()
                 WHERE id = $9`,
                [
                    nom || demande.nom,
                    email || demande.email,
                    telephone || demande.telephone,
                    entreprise || demande.entreprise,
                    adresse_livraison || demande.adresse_livraison,
                    ville_livraison || demande.ville_livraison,
                    pays_livraison || demande.pays_livraison,
                    req.user.id,
                    id
                ]
            );

            // Mettre à jour les articles si fournis
            if (articles && Array.isArray(articles)) {
                // Supprimer les anciens articles
                await connection.execute(
                    'DELETE FROM demandes_devis_lignes WHERE demande_devis_id = $1',
                    [id]
                );

                // Insérer les nouveaux articles
                for (let i = 0; i < articles.length; i++) {
                    const article = articles[i];
                    await connection.execute(
                        `INSERT INTO demandes_devis_lignes (
                            demande_devis_id, description, quantite, unite, secteur, ordre
                        ) VALUES ($1, $2, $3, $4, $5, $6)`,
                        [
                            id,
                            article.description,
                            article.quantite || 1,
                            article.unite || 'unité',
                            article.secteur || null,
                            i
                        ]
                    );
                }
            }

            await connection.commit();

            res.json({
                success: true,
                message: 'Demande validée avec succès',
                demande_id: id
            });

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Erreur validation demande WhatsApp:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

