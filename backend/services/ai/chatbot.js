const aiClient = require('./aiClient');
const pool = require('../../config/database');

/**
 * Service de chatbot d'assistance
 * Répond aux questions des utilisateurs avec des réponses intelligentes
 */
class Chatbot {
    /**
     * Traite un message utilisateur et génère une réponse
     * @param {string} message - Message de l'utilisateur
     * @param {object} context - Contexte (utilisateur, page, etc.)
     * @returns {Promise<string>} Réponse du chatbot
     */
    async processMessage(message, context = {}) {
        try {
            // Détecter l'intention
            const intent = this._detectIntent(message);

            // Réponses simples sans API externe
            if (intent.type === 'greeting') {
                return this._handleGreeting();
            }

            if (intent.type === 'help') {
                return this._handleHelp(intent);
            }

            if (intent.type === 'status') {
                return await this._handleStatusQuery(intent, context);
            }

            if (intent.type === 'faq') {
                return this._handleFAQ(intent);
            }

            // Pour les questions complexes, utiliser l'IA (si configurée)
            if (aiClient.provider !== 'hybrid') {
                const prompt = this._buildPrompt(message, context, intent);
                return await aiClient.call(prompt);
            }

            // Fallback: réponse générique
            return this._handleGeneric(message);
        } catch (error) {
            console.error('Erreur chatbot:', error);
            return 'Désolé, une erreur est survenue. Veuillez réessayer ou contacter le support.';
        }
    }

    /**
     * Détecte l'intention du message
     */
    _detectIntent(message) {
        const msg = message.toLowerCase().trim();

        // Salutations
        if (msg.match(/^(bonjour|salut|bonsoir|hello|hi|bonjour|bonsoir)/i)) {
            return { type: 'greeting' };
        }

        // Aide
        if (msg.match(/(aide|help|assistance|comment|guide)/i)) {
            return { type: 'help' };
        }

        // Statut / Suivi
        if (msg.match(/(statut|suivi|suivre|où|état|avancement)/i)) {
            return { type: 'status' };
        }

        // FAQ
        if (msg.match(/(combien|prix|coût|tarif|délai|livraison|facture|devis|commande)/i)) {
            return { type: 'faq' };
        }

        return { type: 'generic' };
    }

    /**
     * Gère les salutations
     */
    _handleGreeting() {
        const greetings = [
            'Bonjour ! Comment puis-je vous aider aujourd\'hui ?',
            'Salut ! Je suis là pour vous assister. Que souhaitez-vous savoir ?',
            'Bonjour ! Bienvenue sur SilyProcure. Comment puis-je vous aider ?'
        ];
        return greetings[Math.floor(Math.random() * greetings.length)];
    }

    /**
     * Gère les demandes d'aide
     */
    _handleHelp(intent) {
        return `Je peux vous aider avec :
        
• **Suivi de vos demandes** : Demandez "Où en est ma demande de devis ?"
• **Statut des commandes** : "Quel est le statut de ma commande ?"
• **Création de devis** : Je peux vous guider dans la création d'une demande de devis
• **Questions générales** : Posez-moi vos questions sur la plateforme

Que souhaitez-vous savoir ?`;
    }

    /**
     * Gère les questions de statut
     */
    async _handleStatusQuery(intent, context) {
        if (!context.user_id && !context.reference && !context.token) {
            return 'Pour suivre une demande, veuillez me fournir votre référence de suivi ou vous connecter à votre compte.';
        }

        // Si on a une référence ou un token, chercher la demande
        if (context.reference || context.token) {
            try {
                const pool = require('../../config/database');
                let query = 'SELECT * FROM demandes_devis WHERE ';
                const params = [];

                if (context.reference) {
                    query += 'reference = ?';
                    params.push(context.reference);
                } else if (context.token) {
                    query += 'token_suivi = ?';
                    params.push(context.token);
                }

                const [demandes] = await pool.execute(query, params);

                if (demandes.length === 0) {
                    return 'Aucune demande trouvée avec cette référence. Vérifiez votre référence de suivi.';
                }

                const demande = demandes[0];
                const statutLabels = {
                    'nouvelle': 'Nouvelle',
                    'en_cours': 'En cours de traitement',
                    'traitee': 'Traitée',
                    'acceptee': 'Acceptée',
                    'refusee': 'Refusée'
                };

                return `**Statut de votre demande ${demande.reference}** :
                
• Statut : ${statutLabels[demande.statut] || demande.statut}
• Date de création : ${new Date(demande.date_creation).toLocaleDateString('fr-FR')}
• Mode de notification : ${demande.mode_notification || 'Email'}

${demande.statut === 'nouvelle' ? 'Votre demande est en attente de traitement par notre équipe.' : ''}
${demande.statut === 'en_cours' ? 'Votre demande est en cours de traitement. Nous contactons les fournisseurs.' : ''}
${demande.statut === 'traitee' ? 'Votre demande a été traitée. Un devis devrait vous être envoyé prochainement.' : ''}`;
            } catch (error) {
                console.error('Erreur recherche demande:', error);
                return 'Erreur lors de la recherche de votre demande. Veuillez réessayer.';
            }
        }

        return 'Pour suivre une demande, veuillez me fournir votre référence de suivi.';
    }

    /**
     * Gère les FAQ
     */
    _handleFAQ(intent) {
        return `Voici quelques réponses aux questions fréquentes :

**Délais** :
• Traitement d'une demande de devis : 30 minutes à 1 heure maximum
• Réception des offres fournisseurs : 24-48 heures
• Livraison : Selon les conditions négociées avec le fournisseur

**Prix** :
• Les prix sont négociés avec les meilleurs fournisseurs
• Une marge commerciale est appliquée pour nos services
• Les prix peuvent varier selon les quantités et conditions

**Processus** :
1. Vous soumettez une demande de devis
2. Nous contactons les fournisseurs pertinents
3. Nous comparons les offres
4. Nous vous proposons la meilleure offre consolidée
5. Vous validez et nous créons la commande

Avez-vous d'autres questions ?`;
    }

    /**
     * Réponse générique
     */
    _handleGeneric(message) {
        return `Je comprends votre question. Pour vous aider au mieux, pouvez-vous être plus précis ?

Je peux vous aider avec :
• Le suivi de vos demandes et commandes
• Des informations sur les délais et processus
• Des questions sur la plateforme

Ou contactez notre support directement via le formulaire de contact.`;
    }

    /**
     * Construit le prompt pour l'IA
     */
    _buildPrompt(message, context, intent) {
        return `Tu es un assistant expert de la plateforme SilyProcure, une plateforme de gestion d'achats et d'intermédiation.

Contexte :
- L'utilisateur pose une question sur la plateforme
- Tu dois répondre de manière professionnelle et utile
- Si tu ne connais pas la réponse, oriente l'utilisateur vers le support

Question de l'utilisateur : "${message}"

Réponds de manière concise et utile.`;
    }
}

module.exports = new Chatbot();

