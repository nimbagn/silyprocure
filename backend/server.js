const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configurer trust proxy pour Render (nécessaire pour express-rate-limit derrière un proxy)
// Utiliser 1 au lieu de true pour plus de sécurité (ne fait confiance qu'au premier proxy)
app.set('trust proxy', 1);

// Vérifier les variables d'environnement critiques
if (!process.env.JWT_SECRET) {
    console.error('❌ ERREUR: JWT_SECRET doit être défini dans le fichier .env');
    console.error('💡 Créez un fichier .env à la racine du projet avec: JWT_SECRET=votre-secret-tres-securise');
    process.exit(1);
}

// Initialisation automatique de la base de données sur Render (premier démarrage)
// Migration des tables manquantes si nécessaire
if (process.env.RENDER || process.env.NODE_ENV === 'production') {
    // Mise à jour complète (non bloquant) - crée toutes les tables manquantes
    const runUpdate = require('./scripts/run-update-render');
    runUpdate().catch(err => {
        console.warn('⚠️  Mise à jour DB (non bloquant):', err.message);
    });
    
    // Migration demandes_devis (non bloquant) - fallback
    const migrateDemandesDevis = require('./scripts/migrate-demandes-devis');
    migrateDemandesDevis().catch(err => {
        console.warn('⚠️  Migration demandes_devis (non bloquant):', err.message);
    });
    
    // Initialisation complète de la DB (non bloquant) - fallback
    const initDb = require('./scripts/init-db-render');
    initDb().catch(err => {
        console.warn('⚠️  Initialisation DB (non bloquant):', err.message);
    });
}

// Middleware de sécurité
const { helmetConfig, apiLimiter, readLimiter } = require('./middleware/security');
app.use(helmetConfig);
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting sur toutes les routes API (sauf GET qui utilise readLimiter)
// Les routes GET sont gérées par readLimiter dans les routes individuelles si nécessaire
app.use('/api/', (req, res, next) => {
    // Pour les requêtes GET, utiliser readLimiter (plus permissif)
    if (req.method === 'GET') {
        return readLimiter(req, res, next);
    }
    // Pour les autres méthodes, utiliser apiLimiter
    return apiLimiter(req, res, next);
});

// Route principale - servir la page d'accueil publique (AVANT express.static pour éviter index.html)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/home.html'));
});

// Route pour la page de suivi publique
app.get('/suivi', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/suivi.html'));
});

// Servir les fichiers statiques (sans index par défaut)
app.use(express.static(path.join(__dirname, '../frontend'), { index: false }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes API
const authRoutes = require('./routes/auth');
const utilisateursRoutes = require('./routes/utilisateurs');
const entreprisesRoutes = require('./routes/entreprises');
const produitsRoutes = require('./routes/produits');
const rfqRoutes = require('./routes/rfq');
const devisRoutes = require('./routes/devis');
const commandesRoutes = require('./routes/commandes');
const blRoutes = require('./routes/bons_livraison');
const facturesRoutes = require('./routes/factures');
const slaRoutes = require('./routes/sla');
const projetsRoutes = require('./routes/projets');
const dashboardRoutes = require('./routes/dashboard');
const adressesRoutes = require('./routes/adresses');
const pdfRoutes = require('./routes/pdf');
const excelRoutes = require('./routes/excel');
const produitsFournisseurRoutes = require('./routes/produits_fournisseur');
const uploadExcelRoutes = require('./routes/upload_excel');
const catalogueFournisseurRoutes = require('./routes/catalogue_fournisseur');
const liensExternesRoutes = require('./routes/liens_externes');
const margesRoutes = require('./routes/marges');
const { router: notificationsRoutes } = require('./routes/notifications');
const fichiersRoutes = require('./routes/fichiers');
const paiementsRoutes = require('./routes/paiements');
const contactRoutes = require('./routes/contact');
const clientsRoutes = require('./routes/clients');
const aiRoutes = require('./routes/ai');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/utilisateurs', utilisateursRoutes);
app.use('/api/entreprises', entreprisesRoutes);
app.use('/api/produits', produitsRoutes);
app.use('/api/rfq', rfqRoutes);
app.use('/api/devis', devisRoutes);
app.use('/api/commandes', commandesRoutes);
app.use('/api/bl', blRoutes);
app.use('/api/factures', facturesRoutes);
app.use('/api/sla', slaRoutes);
app.use('/api/projets', projetsRoutes);
app.use('/api/liens-externes', liensExternesRoutes);
app.use('/api/excel', excelRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/adresses', adressesRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/produits', produitsFournisseurRoutes);
app.use('/api/upload', uploadExcelRoutes);
app.use('/api/catalogue', catalogueFournisseurRoutes);
app.use('/api/marges', margesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/fichiers', fichiersRoutes);
app.use('/api/paiements', paiementsRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/ai', aiRoutes);

// Routes pour les pages HTML (doivent être APRÈS les routes API pour éviter les conflits)
// Ne pas intercepter les requêtes qui commencent par /api
app.get('*.html', (req, res, next) => {
    // Ignorer si c'est une requête API
    if (req.path.startsWith('/api/')) {
        return next();
    }
    const filePath = path.join(__dirname, '../frontend', req.path);
    res.sendFile(filePath, (err) => {
        if (err) {
            res.status(404).send('Page non trouvée');
        }
    });
});

// Route 404 pour les routes API uniquement
app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'Route API non trouvée' });
});

// Gestion des erreurs
app.use((err, req, res, next) => {
    console.error('Erreur:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Erreur serveur interne'
    });
});

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`🚀 Serveur SilyProcure démarré sur le port ${PORT}`);
    console.log(`📱 Application disponible sur http://localhost:${PORT}`);
});

module.exports = app;

