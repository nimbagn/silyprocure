// Script pour vérifier le mot de passe admin en utilisant la config du projet
const mysql = require('mysql2/promise');
require('dotenv').config();
const bcrypt = require('bcryptjs');

async function verifierAdmin() {
    let connection;
    try {
        console.log('🔍 Vérification du mot de passe admin...\n');
        
        // Essayer différentes configurations de connexion
        const configs = [
            {
                host: process.env.DB_HOST || 'localhost',
                port: process.env.DB_PORT || 3306,
                database: process.env.DB_NAME || 'silypro',
                user: process.env.DB_USER || 'soul',
                password: process.env.DB_PASSWORD || 'Satina2025'
            },
            {
                host: 'localhost',
                port: 3306,
                database: 'silypro',
                user: 'root',
                password: ''
            },
            {
                host: 'localhost',
                port: 3306,
                database: 'silypro',
                user: 'root',
                password: 'root'
            }
        ];
        
        let connected = false;
        for (const config of configs) {
            try {
                console.log(`Tentative de connexion avec ${config.user}@${config.host}...`);
                connection = await mysql.createConnection(config);
                console.log('✅ Connexion réussie !\n');
                connected = true;
                break;
            } catch (error) {
                console.log(`❌ Échec: ${error.message}\n`);
                continue;
            }
        }
        
        if (!connected) {
            console.log('❌ Impossible de se connecter à MySQL avec les configurations testées.');
            console.log('\n💡 Vérifiez manuellement avec:');
            console.log('   mysql -u soul -pSatina2025 silypro');
            console.log('\n   Puis exécutez:');
            console.log('   SELECT email, LEFT(mot_de_passe, 30) as hash FROM utilisateurs WHERE email = \'admin@silyprocure.com\';');
            return;
        }
        
        const [users] = await connection.execute(
            'SELECT id, email, nom, prenom, role, actif, mot_de_passe FROM utilisateurs WHERE email = ?',
            ['admin@silyprocure.com']
        );
        
        if (users.length === 0) {
            console.log('❌ Aucun utilisateur admin trouvé !');
            console.log('💡 Créez-le avec: node database/check_admin.js');
            return;
        }
        
        const user = users[0];
        console.log('✅ Utilisateur trouvé:');
        console.log('   📧 Email:', user.email);
        console.log('   👤 Nom:', user.nom, user.prenom);
        console.log('   🎭 Rôle:', user.role);
        console.log('   ✅ Actif:', user.actif ? 'Oui' : 'Non');
        console.log('   🔐 Hash:', user.mot_de_passe.substring(0, 30) + '...\n');
        
        // Liste des mots de passe à tester
        const passwordsToTest = [
            '12345',
            'password',
            'admin123',
            'admin',
            'Admin123',
            'Password123',
            'silyprocure',
            'SilyProcure123',
            'admin2024',
            'Admin2024',
            '123456',
            'password123',
            'admin@123',
            'Admin@123',
            'Satina2025'
        ];
        
        console.log('🔐 Test des mots de passe...\n');
        
        let foundPassword = null;
        for (let i = 0; i < passwordsToTest.length; i++) {
            const pwd = passwordsToTest[i];
            try {
                const isValid = await bcrypt.compare(pwd, user.mot_de_passe);
                const status = isValid ? '✅ VALIDE' : '❌';
                console.log(`   ${(i + 1).toString().padStart(2, ' ')}. "${pwd.padEnd(20, ' ')}" → ${status}`);
                
                if (isValid) {
                    foundPassword = pwd;
                    break;
                }
            } catch (error) {
                console.log(`   ${(i + 1).toString().padStart(2, ' ')}. "${pwd.padEnd(20, ' ')}" → ❌ Erreur`);
            }
        }
        
        console.log('');
        
        if (foundPassword) {
            console.log('🎉 MOT DE PASSE TROUVÉ !\n');
            console.log('═══════════════════════════════════════');
            console.log('📋 IDENTIFIANTS DE CONNEXION:');
            console.log('═══════════════════════════════════════');
            console.log('   📧 Email:        admin@silyprocure.com');
            console.log('   🔑 Mot de passe: ' + foundPassword);
            console.log('═══════════════════════════════════════\n');
        } else {
            console.log('⚠️  Aucun mot de passe standard ne fonctionne.');
            console.log('💡 Le mot de passe a été personnalisé.\n');
            console.log('🔧 Réinitialisez avec:');
            console.log('   node database/fix_admin_password.js\n');
        }
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
        if (error.code) {
            console.error('   Code:', error.code);
        }
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

verifierAdmin();

