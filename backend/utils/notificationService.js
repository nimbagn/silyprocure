const { sendDevisRequestConfirmation } = require('./emailService');
const crypto = require('crypto');

/**
 * Génère une référence unique pour une demande de devis
 */
function generateReference() {
    const prefix = 'DEV';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
}

/**
 * Génère un token de suivi sécurisé
 */
function generateTrackingToken() {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Envoie une notification selon le mode choisi
 */
async function sendNotification(demande, reference, trackingToken) {
    const mode = demande.mode_notification || 'email';
    const trackingUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/suivi?ref=${reference}&token=${trackingToken}`;

    switch (mode) {
        case 'email':
            return await sendEmailNotification(demande, reference, trackingUrl);
        
        case 'sms':
            return await sendSMSNotification(demande, reference, trackingUrl);
        
        case 'whatsapp':
            return await sendWhatsAppNotification(demande, reference, trackingUrl);
        
        default:
            // Par défaut, envoyer par email
            return await sendEmailNotification(demande, reference, trackingUrl);
    }
}

/**
 * Envoie une notification par email avec la référence et le lien de suivi
 */
async function sendEmailNotification(demande, reference, trackingUrl) {
    try {
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.warn('⚠️  Configuration SMTP non définie. Email non envoyé.');
            return false;
        }

        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        const mailOptions = {
            from: `"SilyProcure" <${process.env.SMTP_USER}>`,
            to: demande.email,
            subject: `Votre demande de devis ${reference} - SilyProcure`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: #00387A; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
                        .reference-box { background: white; border: 2px solid #00387A; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center; }
                        .reference-code { font-size: 24px; font-weight: bold; color: #00387A; letter-spacing: 2px; }
                        .tracking-button { display: inline-block; background: #FF6600; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
                        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h2>Votre demande de devis a été reçue</h2>
                        </div>
                        <div class="content">
                            <p>Bonjour ${demande.nom},</p>
                            <p>Nous avons bien reçu votre demande de devis. Vous pouvez suivre l'avancement de votre demande en utilisant les informations ci-dessous.</p>
                            
                            <div class="reference-box">
                                <div style="font-size: 14px; color: #666; margin-bottom: 5px;">Référence de votre demande</div>
                                <div class="reference-code">${reference}</div>
                            </div>

                            <div style="text-align: center;">
                                <a href="${trackingUrl}" class="tracking-button">Suivre ma demande</a>
                            </div>

                            <p style="margin-top: 20px; font-size: 14px; color: #666;">
                                Vous pouvez également suivre votre demande en visitant notre site et en utilisant votre référence : <strong>${reference}</strong>
                            </p>

                            <p>Cordialement,<br>L'équipe SilyProcure</p>
                        </div>
                        <div class="footer">
                            <p>Cet email a été envoyé automatiquement. Merci de ne pas y répondre.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            text: `
Votre demande de devis a été reçue

Bonjour ${demande.nom},

Nous avons bien reçu votre demande de devis.

Référence de votre demande: ${reference}

Suivez votre demande: ${trackingUrl}

Cordialement,
L'équipe SilyProcure
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('✅ Email de notification avec référence envoyé à:', demande.email);
        return true;

    } catch (error) {
        console.error('❌ Erreur envoi email notification:', error);
        return false;
    }
}

/**
 * Envoie une notification par SMS
 * Note: Nécessite un service SMS comme Twilio, Vonage, etc.
 */
async function sendSMSNotification(demande, reference, trackingUrl) {
    try {
        // TODO: Intégrer un service SMS (Twilio, Vonage, etc.)
        // Pour l'instant, on log juste
        console.log(`📱 SMS à envoyer à ${demande.telephone}:`);
        console.log(`Référence: ${reference}`);
        console.log(`Lien de suivi: ${trackingUrl}`);
        
        // Exemple avec Twilio (à configurer):
        /*
        const twilio = require('twilio');
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        
        await client.messages.create({
            body: `SilyProcure - Votre demande de devis ${reference}. Suivez: ${trackingUrl}`,
            to: demande.telephone,
            from: process.env.TWILIO_PHONE_NUMBER
        });
        */
        
        return true;
    } catch (error) {
        console.error('❌ Erreur envoi SMS:', error);
        return false;
    }
}

/**
 * Envoie une notification par WhatsApp
 * Note: Nécessite un service WhatsApp Business API (Twilio, etc.)
 */
async function sendWhatsAppNotification(demande, reference, trackingUrl) {
    try {
        // TODO: Intégrer WhatsApp Business API (Twilio, etc.)
        // Pour l'instant, on log juste
        console.log(`💬 WhatsApp à envoyer à ${demande.telephone}:`);
        console.log(`Référence: ${reference}`);
        console.log(`Lien de suivi: ${trackingUrl}`);
        
        // Exemple avec Twilio WhatsApp (à configurer):
        /*
        const twilio = require('twilio');
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        
        await client.messages.create({
            body: `SilyProcure - Votre demande de devis ${reference}. Suivez: ${trackingUrl}`,
            to: `whatsapp:${demande.telephone}`,
            from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`
        });
        */
        
        return true;
    } catch (error) {
        console.error('❌ Erreur envoi WhatsApp:', error);
        return false;
    }
}

module.exports = {
    generateReference,
    generateTrackingToken,
    sendNotification,
    sendEmailNotification,
    sendSMSNotification,
    sendWhatsAppNotification
};

