// Script pour tester le hash bcrypt donné et trouver le mot de passe
const bcrypt = require('bcryptjs');

const hashFromDB = '$2a$10$zkgRA1HipAB5m8zmQkyGEu3ZpuoGE.sYH/75hH5J/WK5056UkOQSe';

// Liste des mots de passe à tester (par ordre de probabilité)
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
    'Satina2025',
    'satina2025',
    'Satina',
    'satina',
    'SilyProcure',
    'silyprocure123',
    'admin2023',
    'Admin2023',
    'root',
    'Root123',
    'test',
    'Test123',
    '1234',
    '12345678',
    'qwerty',
    'password1'
];

console.log('🔍 Test du hash bcrypt pour trouver le mot de passe...\n');
console.log('Hash:', hashFromDB);
console.log('\n🔐 Test des mots de passe...\n');

let foundPassword = null;
let tested = 0;

// Tester de manière synchrone pour afficher les résultats dans l'ordre
async function testPasswords() {
    for (let i = 0; i < passwordsToTest.length; i++) {
        const pwd = passwordsToTest[i];
        try {
            const isValid = await bcrypt.compare(pwd, hashFromDB);
            const status = isValid ? '✅ VALIDE' : '❌';
            console.log(`   ${(i + 1).toString().padStart(2, ' ')}. "${pwd.padEnd(25, ' ')}" → ${status}`);
            
            if (isValid) {
                foundPassword = pwd;
                tested = i + 1;
                break; // Arrêter dès qu'on trouve
            }
            tested++;
        } catch (error) {
            console.log(`   ${(i + 1).toString().padStart(2, ' ')}. "${pwd.padEnd(25, ' ')}" → ❌ Erreur: ${error.message}`);
        }
    }
    
    console.log('');
    console.log(`📊 ${tested} mot(s) de passe testé(s)\n`);
    
    if (foundPassword) {
        console.log('🎉 MOT DE PASSE TROUVÉ !\n');
        console.log('═══════════════════════════════════════');
        console.log('📋 IDENTIFIANTS DE CONNEXION:');
        console.log('═══════════════════════════════════════');
        console.log('   📧 Email:        admin@silyprocure.com');
        console.log('   🔑 Mot de passe: ' + foundPassword);
        console.log('═══════════════════════════════════════\n');
    } else {
        console.log('⚠️  Aucun mot de passe standard ne correspond à ce hash.');
        console.log('💡 Le mot de passe a été personnalisé et n\'est pas dans la liste testée.\n');
        console.log('🔧 Options:');
        console.log('   1. Réinitialiser avec "12345":');
        console.log('      node database/fix_admin_password.js\n');
        console.log('   2. Créer un nouveau mot de passe:');
        console.log('      node backend/utils/hashPassword.js "VotreMotDePasse"');
    }
}

testPasswords();

