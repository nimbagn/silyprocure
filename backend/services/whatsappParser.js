/**
 * Service de parsing de messages WhatsApp pour extraire les informations de demande de devis
 * Utilise l'IA pour analyser le message et extraire les données structurées
 */

const aiClient = require('./ai/aiClient');
const pool = require('../config/database');

class WhatsAppParser {
    /**
     * Parse un message WhatsApp pour extraire les informations de demande de devis
     * @param {string} message - Le message WhatsApp reçu
     * @param {string} senderPhone - Le numéro de téléphone de l'expéditeur
     * @returns {Promise<object>} Les informations extraites structurées
     */
    async parseDevisRequest(message, senderPhone) {
        try {
            // Construire le prompt pour l'IA
            const prompt = this._buildPrompt(message, senderPhone);
            
            // Appeler l'IA pour extraire les informations
            const aiResponse = await aiClient.call(prompt, {
                temperature: 0.3, // Plus déterministe pour l'extraction
                maxTokens: 2000
            });
            
            // Parser la réponse JSON de l'IA
            const extractedData = this._parseAIResponse(aiResponse);
            
            // Valider et nettoyer les données
            const cleanedData = this._cleanAndValidate(extractedData, senderPhone);
            
            return cleanedData;
        } catch (error) {
            console.error('Erreur parsing WhatsApp:', error);
            // Fallback: extraction basique sans IA
            return this._fallbackParse(message, senderPhone);
        }
    }

    /**
     * Construit le prompt pour l'IA
     */
    _buildPrompt(message, senderPhone) {
        return `Tu es un assistant expert en analyse de demandes de devis. Analyse le message WhatsApp suivant et extrais toutes les informations pertinentes pour créer une demande de devis structurée.

Message reçu:
"${message}"

Numéro de téléphone expéditeur: ${senderPhone}

Extrais les informations suivantes et retourne UNIQUEMENT un JSON valide (sans markdown, sans code blocks):
{
  "nom": "nom complet du client",
  "email": "email si mentionné, sinon null",
  "telephone": "${senderPhone}",
  "entreprise": "nom de l'entreprise si mentionné, sinon null",
  "message": "message original ou résumé",
  "articles": [
    {
      "description": "description de l'article",
      "quantite": nombre (défaut: 1),
      "unite": "unité, kg, m², etc. (défaut: 'unité')",
      "secteur": "secteur d'activité si mentionné"
    }
  ],
  "adresse_livraison": "adresse complète si mentionnée",
  "ville_livraison": "ville si mentionnée",
  "pays_livraison": "pays si mentionné (défaut: 'Guinée')",
  "confiance": nombre entre 0 et 1 (confiance dans l'extraction)
}

Règles importantes:
- Si le nom n'est pas mentionné, utilise "Client WhatsApp" comme nom
- Si aucun article n'est clairement identifié, crée un article avec description="Demande générale" et quantite=1
- Si l'email n'est pas mentionné, mets null
- Le pays par défaut est "Guinée"
- La confiance doit refléter la qualité de l'extraction (1 = très sûr, 0.5 = incertain)
- Retourne UNIQUEMENT le JSON, sans texte avant ou après`;
    }

    /**
     * Parse la réponse de l'IA (peut être du JSON brut ou dans un bloc markdown)
     */
    _parseAIResponse(aiResponse) {
        try {
            // Nettoyer la réponse (enlever markdown code blocks si présent)
            let cleaned = aiResponse.trim();
            
            // Enlever les blocs markdown ```json ... ```
            cleaned = cleaned.replace(/```json\s*/g, '').replace(/```\s*/g, '');
            
            // Chercher le JSON dans la réponse
            const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            
            // Si pas de JSON trouvé, essayer de parser directement
            return JSON.parse(cleaned);
        } catch (error) {
            console.error('Erreur parsing réponse IA:', error);
            throw new Error('Impossible de parser la réponse de l\'IA');
        }
    }

    /**
     * Nettoie et valide les données extraites
     */
    _cleanAndValidate(data, senderPhone) {
        // Validation et valeurs par défaut
        const cleaned = {
            nom: data.nom || 'Client WhatsApp',
            email: data.email || null,
            telephone: senderPhone || data.telephone || null,
            entreprise: data.entreprise || null,
            message: data.message || 'Demande reçue par WhatsApp',
            articles: Array.isArray(data.articles) && data.articles.length > 0 
                ? data.articles.map(art => ({
                    description: art.description || 'Article non spécifié',
                    quantite: parseFloat(art.quantite) || 1,
                    unite: art.unite || 'unité',
                    secteur: art.secteur || null
                }))
                : [{ description: 'Demande générale', quantite: 1, unite: 'unité', secteur: null }],
            adresse_livraison: data.adresse_livraison || null,
            ville_livraison: data.ville_livraison || null,
            pays_livraison: data.pays_livraison || 'Guinée',
            confiance: typeof data.confiance === 'number' ? data.confiance : 0.5,
            source: 'whatsapp',
            raw_message: data.message || ''
        };

        // Validation email si présent
        if (cleaned.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(cleaned.email)) {
                cleaned.email = null;
            }
        }

        return cleaned;
    }

    /**
     * Fallback: extraction basique sans IA (règles simples)
     */
    _fallbackParse(message, senderPhone) {
        // Extraction basique avec regex
        const emailMatch = message.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
        const email = emailMatch ? emailMatch[0] : null;

        // Chercher des quantités
        const quantiteMatch = message.match(/(\d+)\s*(kg|tonnes?|m²|m³|unités?|pièces?|boîtes?)/i);
        const quantite = quantiteMatch ? parseFloat(quantiteMatch[1]) : 1;
        const unite = quantiteMatch ? quantiteMatch[2] : 'unité';

        return {
            nom: 'Client WhatsApp',
            email: email,
            telephone: senderPhone,
            entreprise: null,
            message: message,
            articles: [{
                description: message.substring(0, 200) || 'Demande générale',
                quantite: quantite,
                unite: unite,
                secteur: null
            }],
            adresse_livraison: null,
            ville_livraison: null,
            pays_livraison: 'Guinée',
            confiance: 0.3, // Faible confiance pour le fallback
            source: 'whatsapp',
            raw_message: message
        };
    }
}

module.exports = new WhatsAppParser();

