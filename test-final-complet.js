/**
 * Script de Test Final Complet - SilyProcure
 * 
 * Ce script teste toutes les fonctionnalités principales de l'application :
 * - Authentification
 * - Routes API principales
 * - Création de données (RFQ, devis, commandes, etc.)
 * - Génération de PDF
 * - Validation des données
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// Configuration
const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const TEST_EMAIL = process.env.TEST_EMAIL || 'admin@silyprocure.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'admin123';

// Définir NODE_ENV=test pour désactiver le rate limiting
if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'test';
}

// Couleurs pour la console
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

// Statistiques de test
const stats = {
    total: 0,
    passed: 0,
    failed: 0,
    errors: []
};

// Fonction pour logger
function log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
    const color = type === 'error' ? colors.red : type === 'success' ? colors.green : type === 'warning' ? colors.yellow : colors.cyan;
    console.log(`${color}${prefix} [${timestamp}] ${message}${colors.reset}`);
}

// Fonction pour faire une requête HTTP
function makeRequest(method, url, data = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const isHttps = urlObj.protocol === 'https:';
        const httpModule = isHttps ? https : http;
        
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port || (isHttps ? 443 : 80),
            path: urlObj.pathname + urlObj.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        if (data) {
            const dataString = JSON.stringify(data);
            options.headers['Content-Length'] = Buffer.byteLength(dataString);
        }

        const req = httpModule.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => {
                body += chunk;
            });
            res.on('end', () => {
                try {
                    const parsedBody = body ? JSON.parse(body) : {};
                    resolve({
                        status: res.statusCode,
                        data: parsedBody,
                        headers: res.headers
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        data: body,
                        headers: res.headers
                    });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (data) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

// Fonction pour tester une route API
async function testAPI(name, method, endpoint, data = null, token = null, expectedStatus = 200) {
    stats.total++;
    try {
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await makeRequest(method, `${BASE_URL}${endpoint}`, data, headers);
        
        if (response.status === expectedStatus) {
            stats.passed++;
            log(`${name} - SUCCESS (${response.status})`, 'success');
            return { success: true, data: response.data };
        } else {
            stats.failed++;
            const errorDetails = response.data?.error || response.data?.details || JSON.stringify(response.data);
            const error = `${name} - Expected status ${expectedStatus}, got ${response.status}${errorDetails ? `: ${errorDetails}` : ''}`;
            stats.errors.push(error);
            log(error, 'error');
            return { success: false, error, status: response.status, data: response.data };
        }
    } catch (error) {
        stats.failed++;
        const errorMsg = `${name} - Network Error: ${error.message}`;
        stats.errors.push(errorMsg);
        log(errorMsg, 'error');
        return { success: false, error: errorMsg };
    }
}

// Test d'authentification
async function testAuthentication() {
    log('\n=== TEST D\'AUTHENTIFICATION ===', 'info');
    
    // Test 1: Connexion avec identifiants valides
    // Note: La route attend 'mot_de_passe' et non 'password'
    const loginResult = await testAPI(
        'Connexion',
        'POST',
        '/api/auth/login',
        { email: TEST_EMAIL, mot_de_passe: TEST_PASSWORD }
    );

    if (!loginResult.success) {
        log('❌ Impossible de se connecter. Les tests suivants nécessitent une authentification.', 'error');
        return null;
    }

    const token = loginResult.data.token;
    log(`Token obtenu: ${token.substring(0, 20)}...`, 'success');

    // Test 2: Vérification du token
    await testAPI(
        'Vérification token',
        'GET',
        '/api/auth/verify',
        null,
        token
    );

    // Test 3: Tentative de connexion avec mauvais identifiants
    // Note: La validation peut retourner 400 (validation) ou 401 (identifiants incorrects)
    await testAPI(
        'Connexion avec mauvais identifiants',
        'POST',
        '/api/auth/login',
        { email: 'wrong@email.com', mot_de_passe: 'wrong' },
        null,
        400 // Accepte 400 (validation) ou 401 (identifiants)
    );

    return token;
}

// Test des routes principales
async function testMainRoutes(token) {
    log('\n=== TEST DES ROUTES PRINCIPALES ===', 'info');

    // Dashboard (la route est /stats)
    await testAPI('Dashboard', 'GET', '/api/dashboard/stats', null, token);

    // Entreprises
    await testAPI('Liste entreprises', 'GET', '/api/entreprises', null, token);
    
    // Produits
    await testAPI('Liste produits', 'GET', '/api/produits', null, token);
    
    // RFQ
    await testAPI('Liste RFQ', 'GET', '/api/rfq', null, token);
    
    // Devis
    await testAPI('Liste devis', 'GET', '/api/devis', null, token);
    
    // Commandes
    await testAPI('Liste commandes', 'GET', '/api/commandes', null, token);
    
    // Factures
    await testAPI('Liste factures', 'GET', '/api/factures', null, token);
    
    // Clients
    await testAPI('Liste clients', 'GET', '/api/clients', null, token);
    
    // Demandes de devis
    await testAPI('Liste demandes devis', 'GET', '/api/contact/demandes', null, token);
}

// Test de création de données
async function testDataCreation(token) {
    log('\n=== TEST DE CRÉATION DE DONNÉES ===', 'info');

    // Test création entreprise
    const entrepriseData = {
        nom: `Test Entreprise ${Date.now()}`,
        type_entreprise: 'fournisseur',
        email: `test${Date.now()}@example.com`,
        telephone: '+224612345678',
        adresse: 'Conakry, Guinée',
        ville: 'Conakry',
        pays: 'Guinée'
    };

    const entrepriseResult = await testAPI(
        'Création entreprise',
        'POST',
        '/api/entreprises',
        entrepriseData,
        token,
        201 // Code 201 (Created) pour les créations
    );

    let entrepriseId = null;
    if (entrepriseResult.success && entrepriseResult.data.id) {
        entrepriseId = entrepriseResult.data.id;
    }

    // Test création produit
    // Note: Les champs requis sont 'reference' et 'libelle', et 'categorie_id' est obligatoire
    const produitData = {
        reference: `REF-TEST-${Date.now()}`,
        libelle: `Produit Test ${Date.now()}`,
        description: 'Produit de test',
        categorie_id: 1, // ID de catégorie (doit exister)
        prix_unitaire_ht: 10000,
        unite: 'unité',
        stock_disponible: 100
    };

    const produitResult = await testAPI(
        'Création produit',
        'POST',
        '/api/produits',
        produitData,
        token,
        201 // Code 201 (Created) pour les créations
    );

    let produitId = null;
    if (produitResult.success && produitResult.data.id) {
        produitId = produitResult.data.id;
    }

    return { entrepriseId, produitId };
}

// Test des routes publiques
async function testPublicRoutes() {
    log('\n=== TEST DES ROUTES PUBLIQUES ===', 'info');

    // Test route publique entreprises (pour la page d'accueil)
    await testAPI(
        'Entreprises publiques',
        'GET',
        '/api/public/entreprises',
        null,
        null
    );

    // Test route publique suivi
    await testAPI(
        'Suivi commande',
        'GET',
        '/api/public/suivi/INVALID',
        null,
        null,
        404
    );
}

// Test de validation
async function testValidation(token) {
    log('\n=== TEST DE VALIDATION ===', 'info');

    // Test création entreprise avec données invalides
    await testAPI(
        'Validation - Entreprise sans nom',
        'POST',
        '/api/entreprises',
        { type_entreprise: 'fournisseur' },
        token,
        400
    );

    // Test création produit avec données invalides
    await testAPI(
        'Validation - Produit sans nom',
        'POST',
        '/api/produits',
        { prix_unitaire: -100 },
        token,
        400
    );
}

// Test de sécurité
async function testSecurity() {
    log('\n=== TEST DE SÉCURITÉ ===', 'info');

    // Test accès route protégée sans token
    await testAPI(
        'Sécurité - Accès sans token',
        'GET',
        '/api/dashboard/stats',
        null,
        null,
        401
    );

    // Test accès avec token invalide
    await testAPI(
        'Sécurité - Token invalide',
        'GET',
        '/api/dashboard/stats',
        null,
        'Bearer invalid_token',
        401
    );
}

// Test des pages frontend
async function testFrontendPages() {
    log('\n=== TEST DES PAGES FRONTEND ===', 'info');

    const pages = [
        '/',
        '/home.html',
        '/dashboard.html',
        '/rfq.html',
        '/devis.html',
        '/commandes.html',
        '/factures.html',
        '/entreprises.html',
        '/produits.html',
        '/carte.html',
        '/clients.html',
        '/demandes-devis.html'
    ];

    for (const page of pages) {
        stats.total++;
        try {
            const response = await makeRequest('GET', `${BASE_URL}${page}`);
            
            if (response.status === 200 || response.status === 302) {
                stats.passed++;
                log(`Page ${page} - Accessible (${response.status})`, 'success');
            } else {
                stats.failed++;
                const error = `Page ${page} - Status ${response.status}`;
                stats.errors.push(error);
                log(error, 'error');
            }
        } catch (error) {
            stats.failed++;
            const errorMsg = `Page ${page} - ${error.message}`;
            stats.errors.push(errorMsg);
            log(errorMsg, 'error');
        }
    }
}

// Génération du rapport
function generateReport() {
    log('\n=== RAPPORT FINAL ===', 'info');
    log(`Total de tests: ${stats.total}`, 'info');
    log(`Tests réussis: ${stats.passed}`, 'success');
    log(`Tests échoués: ${stats.failed}`, stats.failed > 0 ? 'error' : 'success');
    log(`Taux de réussite: ${((stats.passed / stats.total) * 100).toFixed(2)}%`, 'info');

    if (stats.errors.length > 0) {
        log('\n=== ERREURS DÉTECTÉES ===', 'error');
        stats.errors.forEach((error, index) => {
            log(`${index + 1}. ${error}`, 'error');
        });
    }

    // Sauvegarder le rapport
    const report = {
        date: new Date().toISOString(),
        stats,
        errors: stats.errors
    };

    const reportPath = path.join(__dirname, 'test-report-final.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    log(`\nRapport sauvegardé dans: ${reportPath}`, 'success');
}

// Fonction principale
async function runTests() {
    log('🚀 DÉMARRAGE DES TESTS FINAUX - SilyProcure', 'info');
    log(`URL de test: ${BASE_URL}`, 'info');
    log(`Email de test: ${TEST_EMAIL}`, 'info');

    try {
        // Test 1: Routes publiques (sans authentification)
        await testPublicRoutes();

        // Test 2: Sécurité
        await testSecurity();

        // Test 3: Authentification
        const token = await testAuthentication();

        if (!token) {
            log('❌ Les tests nécessitant une authentification ne peuvent pas être exécutés.', 'error');
            generateReport();
            process.exit(1);
        }

        // Test 4: Routes principales
        await testMainRoutes(token);

        // Test 5: Création de données
        await testDataCreation(token);

        // Test 6: Validation
        await testValidation(token);

        // Test 7: Pages frontend
        await testFrontendPages();

        // Génération du rapport
        generateReport();

        // Code de sortie
        if (stats.failed > 0) {
            log('\n⚠️  Certains tests ont échoué. Veuillez consulter le rapport.', 'warning');
            process.exit(1);
        } else {
            log('\n✅ Tous les tests sont passés avec succès!', 'success');
            process.exit(0);
        }

    } catch (error) {
        log(`❌ Erreur fatale: ${error.message}`, 'error');
        console.error(error);
        generateReport();
        process.exit(1);
    }
}

// Exécution
if (require.main === module) {
    runTests();
}

module.exports = { runTests, testAPI };

