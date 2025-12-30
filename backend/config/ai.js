require('dotenv').config();

/**
 * Configuration pour les services IA
 * Supporte plusieurs providers : OpenAI, Claude, ou local (Ollama)
 */
const aiConfig = {
    // Provider à utiliser : 'openai', 'claude', 'ollama', ou 'hybrid'
    provider: process.env.AI_PROVIDER || 'hybrid',
    
    // OpenAI Configuration
    openai: {
        apiKey: process.env.OPENAI_API_KEY || '',
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
        temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.3'),
        maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '2000')
    },
    
    // Claude Configuration
    claude: {
        apiKey: process.env.CLAUDE_API_KEY || '',
        model: process.env.CLAUDE_MODEL || 'claude-3-haiku-20240307',
        baseURL: process.env.CLAUDE_BASE_URL || 'https://api.anthropic.com/v1',
        maxTokens: parseInt(process.env.CLAUDE_MAX_TOKENS || '2000')
    },
    
    // Ollama Configuration (local)
    ollama: {
        baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
        model: process.env.OLLAMA_MODEL || 'llama3',
        temperature: parseFloat(process.env.OLLAMA_TEMPERATURE || '0.3')
    },
    
    // Cache configuration
    cache: {
        enabled: process.env.AI_CACHE_ENABLED !== 'false',
        ttl: parseInt(process.env.AI_CACHE_TTL || '3600') // 1 heure par défaut
    },
    
    // Feature flags
    features: {
        quoteAnalysis: process.env.AI_QUOTE_ANALYSIS !== 'false',
        supplierRecommendation: process.env.AI_SUPPLIER_RECOMMENDATION !== 'false',
        anomalyDetection: process.env.AI_ANOMALY_DETECTION !== 'false',
        forecasting: process.env.AI_FORECASTING !== 'false',
        chatbot: process.env.AI_CHATBOT !== 'false'
    }
};

module.exports = aiConfig;

