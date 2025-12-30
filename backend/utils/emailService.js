const nodemailer = require('nodemailer');
require('dotenv').config();

// Configuration du transporteur email
// Vous pouvez configurer Gmail, Outlook, ou un serveur SMTP personnalisé
const createTransporter = () => {
    // Configuration par défaut (Gmail)
    // Pour utiliser Gmail, vous devez créer un "App Password" dans votre compte Google
    // https://support.google.com/accounts/answer/185833
    
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true', // true pour 465, false pour les autres ports
        auth: {
            user: process.env.SMTP_USER || '',
            pass: process.env.SMTP_PASS || ''
        }
    });

    return transporter;
};

/**
 * Envoie un email de notification pour une nouvelle demande de devis
 */
async function sendDevisRequestNotification(demande) {
    try {
        // Vérifier que la configuration email est présente
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.warn('⚠️  Configuration SMTP non définie. Email non envoyé.');
            console.warn('💡 Ajoutez SMTP_USER et SMTP_PASS dans votre fichier .env');
            return false;
        }

        const transporter = createTransporter();

        // Email destinataire (admin)
        const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;

        const mailOptions = {
            from: `"SilyProcure" <${process.env.SMTP_USER}>`,
            to: adminEmail,
            subject: `Nouvelle demande de devis - ${demande.nom}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: #00387A; color: white; padding: 20px; text-align: center; }
                        .content { background: #f9f9f9; padding: 20px; margin-top: 20px; }
                        .info-row { margin: 10px 0; }
                        .label { font-weight: bold; color: #00387A; }
                        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h2>Nouvelle demande de devis</h2>
                        </div>
                        <div class="content">
                            <p>Une nouvelle demande de devis a été reçue depuis la page d'accueil de SilyProcure.</p>
                            
                            <div class="info-row">
                                <span class="label">Nom :</span> ${demande.nom}
                            </div>
                            <div class="info-row">
                                <span class="label">Email :</span> <a href="mailto:${demande.email}">${demande.email}</a>
                            </div>
                            ${demande.telephone ? `<div class="info-row"><span class="label">Téléphone :</span> ${demande.telephone}</div>` : ''}
                            ${demande.entreprise ? `<div class="info-row"><span class="label">Entreprise :</span> ${demande.entreprise}</div>` : ''}
                            ${demande.service ? `<div class="info-row"><span class="label">Service demandé :</span> ${demande.service}</div>` : ''}
                            ${demande.message ? `<div class="info-row"><span class="label">Message :</span><br><p style="margin-top: 5px;">${demande.message.replace(/\n/g, '<br>')}</p></div>` : ''}
                            
                            <div class="info-row" style="margin-top: 20px;">
                                <span class="label">Date de la demande :</span> ${new Date(demande.date_creation).toLocaleString('fr-FR')}
                            </div>
                        </div>
                        <div class="footer">
                            <p>Cet email a été envoyé automatiquement par SilyProcure.</p>
                            <p>Connectez-vous à votre espace admin pour gérer cette demande.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            text: `
Nouvelle demande de devis

Nom: ${demande.nom}
Email: ${demande.email}
${demande.telephone ? `Téléphone: ${demande.telephone}` : ''}
${demande.entreprise ? `Entreprise: ${demande.entreprise}` : ''}
${demande.service ? `Service: ${demande.service}` : ''}
${demande.message ? `Message:\n${demande.message}` : ''}

Date: ${new Date(demande.date_creation).toLocaleString('fr-FR')}
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email de notification envoyé:', info.messageId);
        return true;

    } catch (error) {
        console.error('❌ Erreur lors de l\'envoi de l\'email:', error);
        return false;
    }
}

/**
 * Envoie un email de confirmation au demandeur
 */
async function sendDevisRequestConfirmation(demande) {
    try {
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            return false;
        }

        const transporter = createTransporter();

        const mailOptions = {
            from: `"SilyProcure" <${process.env.SMTP_USER}>`,
            to: demande.email,
            subject: 'Confirmation de votre demande de devis - SilyProcure',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: #00387A; color: white; padding: 20px; text-align: center; }
                        .content { background: #f9f9f9; padding: 20px; margin-top: 20px; }
                        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h2>Merci pour votre demande</h2>
                        </div>
                        <div class="content">
                            <p>Bonjour ${demande.nom},</p>
                            <p>Nous avons bien reçu votre demande de devis. Notre équipe va l'examiner et vous contactera dans les plus brefs délais.</p>
                            <p>Résumé de votre demande :</p>
                            <ul>
                                ${demande.service ? `<li>Service : ${demande.service}</li>` : ''}
                                <li>Date de la demande : ${new Date(demande.date_creation).toLocaleString('fr-FR')}</li>
                            </ul>
                            <p>Nous vous remercions de votre confiance.</p>
                            <p>Cordialement,<br>L'équipe SilyProcure</p>
                        </div>
                        <div class="footer">
                            <p>Cet email a été envoyé automatiquement. Merci de ne pas y répondre.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('✅ Email de confirmation envoyé à:', demande.email);
        return true;

    } catch (error) {
        console.error('❌ Erreur lors de l\'envoi de l\'email de confirmation:', error);
        return false;
    }
}

module.exports = {
    sendDevisRequestNotification,
    sendDevisRequestConfirmation
};

