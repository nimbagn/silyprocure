const aiConfig = require('../../config/ai');

/**
 * Client générique pour les APIs IA
 * Supporte OpenAI, Claude, et Ollama
 */
class AIClient {
    constructor() {
        this.provider = aiConfig.provider;
    }

    /**
     * Appelle l'API IA avec un prompt
     * @param {string} prompt - Le prompt à envoyer
     * @param {object} options - Options supplémentaires (temperature, maxTokens, etc.)
     * @returns {Promise<string>} La réponse de l'IA
     */
    async call(prompt, options = {}) {
        switch (this.provider) {
            case 'openai':
                return this._callOpenAI(prompt, options);
            case 'claude':
                return this._callClaude(prompt, options);
            case 'ollama':
                return this._callOllama(prompt, options);
            case 'hybrid':
                // Pour l'instant, utilise des règles métier simples
                // Peut être étendu pour utiliser l'API externe pour des cas complexes
                return this._callHybrid(prompt, options);
            default:
                throw new Error(`Provider IA non supporté: ${this.provider}`);
        }
    }

    /**
     * Appelle OpenAI API
     */
    async _callOpenAI(prompt, options) {
        if (!aiConfig.openai.apiKey) {
            console.warn('OpenAI API key non configurée, utilisation du mode hybride');
            return this._callHybrid(prompt, options);
        }

        try {
            const fetch = (await import('node-fetch')).default;
            const response = await fetch(`${aiConfig.openai.baseURL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${aiConfig.openai.apiKey}`
                },
                body: JSON.stringify({
                    model: options.model || aiConfig.openai.model,
                    messages: [
                        { role: 'system', content: 'Tu es un assistant expert en analyse de devis et gestion d\'achats.' },
                        { role: 'user', content: prompt }
                    ],
                    temperature: options.temperature || aiConfig.openai.temperature,
                    max_tokens: options.maxTokens || aiConfig.openai.maxTokens
                })
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`OpenAI API error: ${error}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('Erreur appel OpenAI:', error);
            // Fallback sur mode hybride
            return this._callHybrid(prompt, options);
        }
    }

    /**
     * Appelle Claude API
     */
    async _callClaude(prompt, options) {
        if (!aiConfig.claude.apiKey) {
            console.warn('Claude API key non configurée, utilisation du mode hybride');
            return this._callHybrid(prompt, options);
        }

        try {
            const fetch = (await import('node-fetch')).default;
            const response = await fetch(`${aiConfig.claude.baseURL}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': aiConfig.claude.apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: options.model || aiConfig.claude.model,
                    max_tokens: options.maxTokens || aiConfig.claude.maxTokens,
                    messages: [
                        { role: 'user', content: prompt }
                    ]
                })
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Claude API error: ${error}`);
            }

            const data = await response.json();
            return data.content[0].text;
        } catch (error) {
            console.error('Erreur appel Claude:', error);
            return this._callHybrid(prompt, options);
        }
    }

    /**
     * Appelle Ollama (local)
     */
    async _callOllama(prompt, options) {
        try {
            const fetch = (await import('node-fetch')).default;
            const response = await fetch(`${aiConfig.ollama.baseURL}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: options.model || aiConfig.ollama.model,
                    prompt: prompt,
                    stream: false,
                    options: {
                        temperature: options.temperature || aiConfig.ollama.temperature
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`Ollama API error: ${response.statusText}`);
            }

            const data = await response.json();
            return data.response;
        } catch (error) {
            console.error('Erreur appel Ollama:', error);
            return this._callHybrid(prompt, options);
        }
    }

    /**
     * Mode hybride : règles métier simples sans API externe
     * Utilisé par défaut ou en fallback
     */
    async _callHybrid(prompt, options) {
        // Pour l'instant, retourne une réponse basique
        // Les services spécifiques (quoteAnalyzer, etc.) implémenteront leur propre logique
        return 'Mode hybride activé - analyse basée sur les règles métier';
    }
}

module.exports = new AIClient();

