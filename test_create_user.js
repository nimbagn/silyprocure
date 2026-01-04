/**
 * Script de test pour la création d'utilisateur
 * Usage: node test_create_user.js [URL] [email] [password]
 * Exemple: node test_create_user.js https://silyprocure.onrender.com admin@silyprocure.com admin123
 */

const https = require('https');
const http = require('http');

const args = process.argv.slice(2);
const baseUrl = args[0] || 'https://silyprocure.onrender.com';
const adminEmail = args[1] || 'admin@silyprocure.com';
const adminPassword = args[2] || 'admin123';

const testUser = {
    email: `test-${Date.now()}@example.com`,
    mot_de_passe: 'Test123!',
    nom: 'Test',
    prenom: 'User',
    telephone: '+224 622 69 24 33',
    fonction: 'Testeur',
    departement: 'IT',
    role: 'viewer'
};

function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const isHttps = urlObj.protocol === 'https:';
        const client = isHttps ? https : http;

        const req = client.request(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve({ status: res.statusCode, headers: res.headers, data: json });
                } catch (e) {
                    resolve({ status: res.statusCode, headers: res.headers, data: data });
                }
            });
        });

        req.on('error', reject);
        if (options.body) {
            req.write(options.body);
        }
        req.end();
    });
}

async function testCreateUser() {
    console.log('🧪 Test de création d\'utilisateur\n');
    console.log(`📍 URL: ${baseUrl}`);
    console.log(`👤 Admin: ${adminEmail}\n`);

    try {
        // 1. Connexion en tant qu'admin
        console.log('1️⃣  Connexion en tant qu\'admin...');
        const loginResponse = await makeRequest(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: adminEmail,
                mot_de_passe: adminPassword
            })
        });

        if (loginResponse.status !== 200) {
            console.error('❌ Erreur de connexion:', loginResponse.data);
            return;
        }

        const token = loginResponse.data.token;
        console.log('✅ Connexion réussie\n');

        // 2. Créer un utilisateur
        console.log('2️⃣  Création d\'un utilisateur...');
        console.log(`   Email: ${testUser.email}`);
        console.log(`   Nom: ${testUser.nom} ${testUser.prenom}`);
        console.log(`   Rôle: ${testUser.role}\n`);

        const createResponse = await makeRequest(`${baseUrl}/api/utilisateurs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(testUser)
        });

        if (createResponse.status === 201) {
            console.log('✅ Utilisateur créé avec succès!');
            console.log(`   ID: ${createResponse.data.id}`);
            console.log(`   Message: ${createResponse.data.message}\n`);
        } else {
            console.error('❌ Erreur lors de la création:', createResponse.data);
            return;
        }

        // 3. Vérifier que l'utilisateur existe
        console.log('3️⃣  Vérification de l\'utilisateur créé...');
        const listResponse = await makeRequest(`${baseUrl}/api/utilisateurs`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (listResponse.status === 200) {
            const users = listResponse.data;
            const createdUser = users.find(u => u.email === testUser.email);
            if (createdUser) {
                console.log('✅ Utilisateur trouvé dans la liste!');
                console.log(`   ID: ${createdUser.id}`);
                console.log(`   Nom: ${createdUser.nom} ${createdUser.prenom}`);
                console.log(`   Email: ${createdUser.email}`);
                console.log(`   Rôle: ${createdUser.role}`);
                console.log(`   Actif: ${createdUser.actif ? 'Oui' : 'Non'}\n`);
            } else {
                console.error('❌ Utilisateur non trouvé dans la liste');
            }
        } else {
            console.error('❌ Erreur lors de la récupération de la liste:', listResponse.data);
        }

        console.log('✅ Test terminé avec succès!');

    } catch (error) {
        console.error('❌ Erreur:', error.message);
        process.exit(1);
    }
}

testCreateUser();

