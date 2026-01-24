/**
 * Service de notifications WhatsApp via Message Pro
 * Envoie des notifications automatiques à chaque étape du processus
 */

const messageProService = require('../services/messagepro');
const pool = require('../config/database');

/**
 * Récupère le compte WhatsApp à utiliser
 */
async function getWhatsAppAccount() {
    try {
        // Essayer de charger depuis la base de données
        const [params] = await pool.execute(
            'SELECT valeur FROM parametres WHERE cle = $1',
            ['MESSAGEPRO_WHATSAPP_ACCOUNT']
        );
        
        if (params && params.length > 0 && params[0].valeur) {
            return params[0].valeur;
        }
        
        // Sinon, utiliser la variable d'environnement
        if (process.env.MESSAGEPRO_WHATSAPP_ACCOUNT) {
            return process.env.MESSAGEPRO_WHATSAPP_ACCOUNT;
        }
        
        // En dernier recours, récupérer le premier compte disponible
        try {
            const accounts = await messageProService.getWhatsAppAccounts(1, 1);
            if (accounts && accounts.length > 0) {
                return accounts[0].unique || accounts[0].id;
            }
        } catch (error) {
            console.warn('⚠️  Impossible de récupérer les comptes WhatsApp:', error.message);
        }
        
        return null;
    } catch (error) {
        console.error('❌ Erreur récupération compte WhatsApp:', error);
        return null;
    }
}

/**
 * Envoie un message WhatsApp de manière sécurisée (ne bloque pas en cas d'erreur)
 */
async function sendWhatsAppSafe(recipient, message, options = {}) {
    try {
        if (!recipient) {
            console.warn('⚠️  Numéro de téléphone manquant pour WhatsApp');
            return false;
        }

        // Vérifier que le secret est configuré
        if (!process.env.MESSAGEPRO_SECRET) {
            // Essayer de charger depuis la DB
            await messageProService.loadSecretFromDB();
            if (!messageProService.secret) {
                console.warn('⚠️  MESSAGEPRO_SECRET non configuré. WhatsApp non envoyé.');
                return false;
            }
        }

        const account = await getWhatsAppAccount();
        if (!account) {
            console.warn('⚠️  Aucun compte WhatsApp configuré');
            return false;
        }

        const defaultOptions = {
            type: 'text',
            priority: 1
        };

        const finalOptions = { ...defaultOptions, ...options };

        const result = await messageProService.sendWhatsApp(account, recipient, message, finalOptions);
        console.log('✅ WhatsApp envoyé à', recipient);
        return true;
    } catch (error) {
        console.error('❌ Erreur envoi WhatsApp:', error.message);
        // Ne pas bloquer le processus en cas d'erreur
        return false;
    }
}

/**
 * Formate un numéro de téléphone pour WhatsApp (format international)
 */
function formatPhoneNumber(phone) {
    if (!phone) return null;
    
    // Nettoyer le numéro
    let cleaned = phone.replace(/\s+/g, '').replace(/[^\d+]/g, '');
    
    // Si le numéro commence par 0, le remplacer par +224 (Guinée)
    if (cleaned.startsWith('0')) {
        cleaned = '+224' + cleaned.substring(1);
    }
    
    // Si le numéro ne commence pas par +, ajouter +224
    if (!cleaned.startsWith('+')) {
        cleaned = '+224' + cleaned;
    }
    
    return cleaned;
}

/**
 * 1. Notification : Client fait une demande de devis
 */
async function notifyClientDemandeDevis(demande) {
    try {
        const phone = formatPhoneNumber(demande.telephone);
        if (!phone) return false;

        const message = `🚢 *SilyProcure*\n\nBonjour ${demande.nom},\n\n✅ Votre demande de devis a été reçue avec succès !\n\n📋 *Référence:* ${demande.reference || 'En cours'}\n\nNous allons traiter votre demande dans les plus brefs délais et vous contacterons très bientôt.\n\nMerci de votre confiance !\n\n📞 Contact: +224 622 69 24 33\n📧 Email: silycore@gmail.com`;

        return await sendWhatsAppSafe(phone, message);
    } catch (error) {
        console.error('❌ Erreur notification client demande devis:', error);
        return false;
    }
}

/**
 * 2. Notification : Envoi de demande de devis aux fournisseurs
 */
async function notifyFournisseurDemandeDevis(fournisseur, rfq) {
    try {
        // Récupérer le téléphone du fournisseur
        // Note: La table contacts a une colonne 'principal' (BOOLEAN), pas 'type_contact'
        const [contacts] = await pool.execute(
            'SELECT telephone FROM contacts WHERE entreprise_id = $1 AND principal = true LIMIT 1',
            [fournisseur.id]
        );
        
        let phone = fournisseur.telephone;
        if (contacts && contacts.length > 0 && contacts[0].telephone) {
            phone = contacts[0].telephone;
        }
        
        phone = formatPhoneNumber(phone);
        if (!phone) {
            console.warn(`⚠️  Pas de téléphone pour le fournisseur ${fournisseur.nom}`);
            return false;
        }

        const message = `🚢 *SilyProcure*\n\nBonjour ${fournisseur.nom},\n\n📋 *Nouvelle demande de devis*\n\nNous avons une nouvelle demande de devis (RFQ ${rfq.numero || rfq.id}) qui pourrait vous intéresser.\n\n🔗 Connectez-vous à votre espace fournisseur pour consulter les détails et soumettre votre devis.\n\nMerci de votre collaboration !\n\n📞 Contact: +224 622 69 24 33`;

        return await sendWhatsAppSafe(phone, message);
    } catch (error) {
        console.error('❌ Erreur notification fournisseur demande devis:', error);
        return false;
    }
}

/**
 * 3. Notification : Réception d'un devis fournisseur
 */
async function notifyReceptionDevis(devis, fournisseur) {
    try {
        // Notifier le client (via demande_devis)
        if (devis.demande_devis_id) {
            const [demande] = await pool.execute(
                'SELECT nom, telephone, reference FROM demandes_devis WHERE id = $1',
                [devis.demande_devis_id]
            );
            
            if (demande && demande.length > 0 && demande[0].telephone) {
                const phone = formatPhoneNumber(demande[0].telephone);
                if (phone) {
                    const message = `🚢 *SilyProcure*\n\nBonjour ${demande[0].nom},\n\n✅ Nous avons reçu un devis pour votre demande ${demande[0].reference || ''}.\n\nNous analysons actuellement les propositions et vous reviendrons très bientôt avec une réponse.\n\nMerci de votre patience !\n\n📞 Contact: +224 622 69 24 33`;
                    await sendWhatsAppSafe(phone, message);
                }
            }
        }

        // Notifier le fournisseur de la réception
        const [contacts] = await pool.execute(
            'SELECT telephone FROM contacts WHERE entreprise_id = $1 AND principal = true LIMIT 1',
            [fournisseur.id]
        );
        
        let phone = fournisseur.telephone;
        if (contacts && contacts.length > 0 && contacts[0].telephone) {
            phone = contacts[0].telephone;
        }
        
        phone = formatPhoneNumber(phone);
        if (phone) {
            const message = `🚢 *SilyProcure*\n\nBonjour ${fournisseur.nom},\n\n✅ Votre devis ${devis.numero || devis.id} a été reçu avec succès !\n\nNous l'analysons actuellement et vous contacterons prochainement.\n\nMerci pour votre proposition !\n\n📞 Contact: +224 622 69 24 33`;
            return await sendWhatsAppSafe(phone, message);
        }
        
        return false;
    } catch (error) {
        console.error('❌ Erreur notification réception devis:', error);
        return false;
    }
}

/**
 * 4. Notification : Envoi de facture proforma au client
 */
async function notifyClientFactureProforma(facture, client) {
    try {
        // Récupérer le téléphone du client
        let phone = client.telephone;
        
        // Si client est une entreprise, chercher dans contacts
        if (client.type_entreprise) {
            const [contacts] = await pool.execute(
                'SELECT telephone FROM contacts WHERE entreprise_id = $1 AND principal = true LIMIT 1',
                [client.id]
            );
            if (contacts && contacts.length > 0 && contacts[0].telephone) {
                phone = contacts[0].telephone;
            }
        }
        
        // Si client est dans la table clients
        if (!phone && client.email) {
            const [clients] = await pool.execute(
                'SELECT telephone FROM clients WHERE email = $1 LIMIT 1',
                [client.email]
            );
            if (clients && clients.length > 0 && clients[0].telephone) {
                phone = clients[0].telephone;
            }
        }
        
        phone = formatPhoneNumber(phone);
        if (!phone) {
            console.warn(`⚠️  Pas de téléphone pour le client ${client.nom || client.email}`);
            return false;
        }

        const totalTTC = parseFloat(facture.total_ttc || 0).toLocaleString('fr-FR', {
            style: 'currency',
            currency: 'GNF',
            minimumFractionDigits: 0
        });

        const message = `🚢 *SilyProcure*\n\nBonjour,\n\n📄 *Facture Proforma*\n\nVotre facture proforma ${facture.numero} a été générée.\n\n💰 *Montant TTC:* ${totalTTC}\n\n📅 Veuillez valider cette facture proforma pour que nous puissions procéder à la livraison.\n\nMerci de votre confiance !\n\n📞 Contact: +224 622 69 24 33\n📧 Email: silycore@gmail.com`;

        return await sendWhatsAppSafe(phone, message);
    } catch (error) {
        console.error('❌ Erreur notification client facture proforma:', error);
        return false;
    }
}

/**
 * 5. Notification : Livraison effectuée
 */
async function notifyClientLivraison(bl, commande, client) {
    try {
        // Récupérer le téléphone du client
        let phone = client.telephone;
        
        if (client.type_entreprise) {
            const [contacts] = await pool.execute(
                'SELECT telephone FROM contacts WHERE entreprise_id = $1 AND principal = true LIMIT 1',
                [client.id]
            );
            if (contacts && contacts.length > 0 && contacts[0].telephone) {
                phone = contacts[0].telephone;
            }
        }
        
        phone = formatPhoneNumber(phone);
        if (!phone) {
            console.warn(`⚠️  Pas de téléphone pour le client`);
            return false;
        }

        const message = `🚢 *SilyProcure*\n\nBonjour,\n\n🚚 *Livraison effectuée*\n\nVotre commande ${commande.numero || commande.id} a été livrée.\n\n📋 *Bon de livraison:* ${bl.numero || bl.id}\n\n✅ Veuillez vérifier votre livraison et nous contacter en cas de problème.\n\nMerci de votre confiance !\n\n📞 Contact: +224 622 69 24 33`;

        return await sendWhatsAppSafe(phone, message);
    } catch (error) {
        console.error('❌ Erreur notification client livraison:', error);
        return false;
    }
}

/**
 * 6. Notification : Facture définitive générée
 */
async function notifyClientFactureDefinitive(facture, client) {
    try {
        // Récupérer le téléphone du client
        let phone = client.telephone;
        
        if (client.type_entreprise) {
            const [contacts] = await pool.execute(
                'SELECT telephone FROM contacts WHERE entreprise_id = $1 AND principal = true LIMIT 1',
                [client.id]
            );
            if (contacts && contacts.length > 0 && contacts[0].telephone) {
                phone = contacts[0].telephone;
            }
        }
        
        phone = formatPhoneNumber(phone);
        if (!phone) {
            console.warn(`⚠️  Pas de téléphone pour le client`);
            return false;
        }

        const totalTTC = parseFloat(facture.total_ttc || 0).toLocaleString('fr-FR', {
            style: 'currency',
            currency: 'GNF',
            minimumFractionDigits: 0
        });

        const resteAPayer = parseFloat(facture.reste_a_payer || facture.total_ttc || 0).toLocaleString('fr-FR', {
            style: 'currency',
            currency: 'GNF',
            minimumFractionDigits: 0
        });

        const message = `🚢 *SilyProcure*\n\nBonjour,\n\n📄 *Facture définitive*\n\nVotre facture définitive ${facture.numero} a été générée.\n\n💰 *Montant TTC:* ${totalTTC}\n💳 *Reste à payer:* ${resteAPayer}\n\n📅 *Date d'échéance:* ${facture.date_echeance || 'À définir'}\n\nMerci de procéder au règlement dans les délais convenus.\n\n📞 Contact: +224 622 69 24 33\n📧 Email: silycore@gmail.com`;

        return await sendWhatsAppSafe(phone, message);
    } catch (error) {
        console.error('❌ Erreur notification client facture définitive:', error);
        return false;
    }
}

/**
 * 7. Notification : Inscription d'un fournisseur ou client
 */
async function notifyInscriptionEntreprise(entreprise, type) {
    try {
        // Récupérer le téléphone
        let phone = entreprise.telephone;
        
        const [contacts] = await pool.execute(
            'SELECT telephone FROM contacts WHERE entreprise_id = $1 AND principal = true LIMIT 1',
            [entreprise.id]
        );
        if (contacts && contacts.length > 0 && contacts[0].telephone) {
            phone = contacts[0].telephone;
        }
        
        phone = formatPhoneNumber(phone);
        if (!phone) {
            console.warn(`⚠️  Pas de téléphone pour ${entreprise.nom}`);
            return false;
        }

        const typeLabel = type === 'fournisseur' ? 'fournisseur' : 'client';
        const message = `🚢 *SilyProcure*\n\nBonjour ${entreprise.nom},\n\n✅ Bienvenue sur SilyProcure !\n\nVotre compte ${typeLabel} a été créé avec succès.\n\nVous êtes maintenant enregistré dans notre base de données et recevrez prochainement des notifications ou des demandes de devis.\n\nNous sommes ravis de vous compter parmi nos partenaires !\n\n📞 Contact: +224 622 69 24 33\n📧 Email: silycore@gmail.com`;

        return await sendWhatsAppSafe(phone, message);
    } catch (error) {
        console.error('❌ Erreur notification inscription entreprise:', error);
        return false;
    }
}

/**
 * Notifie les admins par WhatsApp lorsqu'un nouveau message de contact est reçu
 */
async function notifyAdminsMessageContact(nom, email, telephone, sujet, message) {
    try {
        // Récupérer le numéro WhatsApp de l'entreprise depuis les paramètres
        const [params] = await pool.execute(
            'SELECT valeur FROM parametres WHERE cle = $1',
            ['WHATSAPP_ENTREPRISE']
        );
        
        let whatsappEntreprise = null;
        if (params && params.length > 0 && params[0].valeur) {
            whatsappEntreprise = formatPhoneNumber(params[0].valeur);
        } else if (process.env.WHATSAPP_ENTREPRISE) {
            whatsappEntreprise = formatPhoneNumber(process.env.WHATSAPP_ENTREPRISE);
        } else {
            // Par défaut, utiliser le numéro de contact de l'entreprise
            whatsappEntreprise = formatPhoneNumber('+224622692433');
        }
        
        if (!whatsappEntreprise) {
            console.warn('⚠️  Numéro WhatsApp entreprise non configuré');
            return false;
        }
        
        const messageWhatsApp = `📧 *Nouveau message de contact - SilyProcure*\n\n` +
            `👤 *Nom:* ${nom}\n` +
            `📧 *Email:* ${email}\n` +
            (telephone ? `📱 *Téléphone:* ${telephone}\n` : '') +
            `🏷️ *Sujet:* ${sujet}\n\n` +
            `💬 *Message:*\n${message}\n\n` +
            `⏰ Reçu le ${new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Conakry' })}\n\n` +
            `🔗 Connectez-vous au dashboard pour répondre.`;
        
        const result = await sendWhatsAppSafe(whatsappEntreprise, messageWhatsApp);
        
        if (result) {
            console.log(`✅ Notification WhatsApp envoyée aux admins pour message de contact de ${nom}`);
        }
        
        return result;
    } catch (error) {
        console.error('❌ Erreur notification WhatsApp message contact:', error);
        return false;
    }
}

module.exports = {
    sendWhatsAppSafe,
    formatPhoneNumber,
    notifyClientDemandeDevis,
    notifyFournisseurDemandeDevis,
    notifyReceptionDevis,
    notifyClientFactureProforma,
    notifyClientLivraison,
    notifyClientFactureDefinitive,
    notifyInscriptionEntreprise,
    notifyAdminsMessageContact
};

