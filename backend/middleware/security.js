const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// Rate limiting pour l'authentification (plus strict)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 tentatives par IP
    message: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.',
    standardHeaders: true,
    legacyHeaders: false,
    // Désactiver la validation trust proxy pour éviter les warnings (géré dans server.js)
    validate: {
        trustProxy: false
    }
});

// Rate limiting général pour les routes API (POST, PUT, DELETE, etc.)
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // 500 requêtes par IP (augmenté pour le développement)
    message: 'Trop de requêtes. Veuillez réessayer plus tard.',
    standardHeaders: true,
    legacyHeaders: false,
    // Désactiver la validation trust proxy pour éviter les warnings (géré dans server.js)
    validate: {
        trustProxy: false
    }
});

// Rate limiting pour les routes GET uniquement (plus permissif)
const readLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // 1000 requêtes GET par IP
    message: 'Trop de requêtes de lecture. Veuillez réessayer plus tard.',
    standardHeaders: true,
    legacyHeaders: false,
    // Désactiver la validation trust proxy pour éviter les warnings (géré dans server.js)
    validate: {
        trustProxy: false
    }
});

// Rate limiting strict pour les routes sensibles (création, modification, suppression)
const strictLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 requêtes par IP
    message: 'Trop de requêtes sur cette ressource. Veuillez réessayer plus tard.',
    standardHeaders: true,
    legacyHeaders: false,
    // Désactiver la validation trust proxy pour éviter les warnings (géré dans server.js)
    validate: {
        trustProxy: false
    }
});

// Configuration Helmet pour la sécurité
const helmetConfig = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: [
                "'self'", 
                "'unsafe-inline'",
                "https://fonts.googleapis.com",
                "https://cdnjs.cloudflare.com",
                "https://cdn.jsdelivr.net"
            ],
            styleSrcElem: [
                "'self'",
                "'unsafe-inline'",
                "https://fonts.googleapis.com",
                "https://cdnjs.cloudflare.com",
                "https://cdn.jsdelivr.net"
            ],
            scriptSrc: [
                "'self'", 
                "'unsafe-inline'",
                "'unsafe-hashes'",
                "https://cdn.jsdelivr.net",
                "'wasm-unsafe-eval'" // Pour WebAssembly (nécessaire pour certaines bibliothèques)
            ],
            scriptSrcElem: [
                "'self'",
                "'unsafe-inline'",
                "https://cdn.jsdelivr.net"
            ],
            scriptSrcAttr: ["'unsafe-inline'"], // Permet les event handlers inline (onclick, etc.)
            imgSrc: ["'self'", "data:", "https:"],
            fontSrc: [
                "'self'",
                "data:",
                "https://fonts.gstatic.com",
                "https://cdnjs.cloudflare.com"
            ],
            connectSrc: ["'self'", "https://cdn.jsdelivr.net"], // Pour les requêtes API et source maps
        },
    },
    crossOriginEmbedderPolicy: false, // Désactivé pour compatibilité
});

module.exports = {
    authLimiter,
    apiLimiter,
    readLimiter,
    strictLimiter,
    helmetConfig
};

