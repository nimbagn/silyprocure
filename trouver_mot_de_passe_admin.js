// Script pour trouver le mot de passe admin en testant les possibilités
const pool = require('./backend/config/database');
const bcrypt = require('bcryptjs');

async function trouverMotDePasseAdmin() {
    let connection;
    try {
        console.log('🔍 Recherche du mot de passe admin...\n');
        
        connection = await pool.getConnection();
        
        const [users] = await connection.execute(
            'SELECT id, email, nom, prenom, role, actif, mot_de_passe FROM utilisateurs WHERE email = ?',
            ['admin@silyprocure.com']
        );
        
        if (users.length === 0) {
            console.log('❌ Aucun utilisateur admin trouvé avec cet email !');
            console.log('\n💡 Création de l\'utilisateur admin avec mot de passe "12345"...');
            
            const password = '12345';
            const hash = await bcrypt.hash(password, 10);
            
            await connection.execute(
                'INSERT INTO utilisateurs (email, mot_de_passe, nom, prenom, fonction, role, actif) VALUES (?, ?, ?, ?, ?, ?, ?)',
                ['admin@silyprocure.com', hash, 'Admin', 'SilyProcure', 'Administrateur', 'admin', true]
            );
            
            console.log('✅ Utilisateur admin créé !');
            console.log('\n📋 Identifiants:');
            console.log('   📧 Email: admin@silyprocure.com');
            console.log('   🔑 Mot de passe: 12345');
            return;
        }
        
        const user = users[0];
        console.log('✅ Utilisateur trouvé:');
        console.log('   📧 Email:', user.email);
        console.log('   👤 Nom:', user.nom, user.prenom);
        console.log('   🎭 Rôle:', user.role);
        console.log('   ✅ Actif:', user.actif ? 'Oui' : 'Non');
        console.log('   🔐 Hash:', user.mot_de_passe.substring(0, 30) + '...');
        
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
            'Admin@123'
        ];
        
        console.log('\n🔐 Test des mots de passe possibles...\n');
        
        let foundPassword = null;
        for (let i = 0; i < passwordsToTest.length; i++) {
            const pwd = passwordsToTest[i];
            try {
                const isValid = await bcrypt.compare(pwd, user.mot_de_passe);
                const status = isValid ? '✅ VALIDE' : '❌';
                console.log(`   ${(i + 1).toString().padStart(2, ' ')}. "${pwd.padEnd(20, ' ')}" → ${status}`);
                
                if (isValid) {
                    foundPassword = pwd;
                    break; // Arrêter dès qu'on trouve
                }
            } catch (error) {
                console.log(`   ${(i + 1).toString().padStart(2, ' ')}. "${pwd.padEnd(20, ' ')}" → ❌ Erreur: ${error.message}`);
            }
        }
        
        console.log('');
        
        if (foundPassword) {
            console.log('🎉 MOT DE PASSE TROUVÉ !\n');
            console.log('═══════════════════════════════════════');
            console.log('📋 IDENTIFIANTS DE CONNEXION:');
            console.log('═══════════════════════════════════════');
            console.log('   📧 Email:    admin@silyprocure.com');
            console.log('   🔑 Mot de passe: ' + foundPassword);
            console.log('═══════════════════════════════════════\n');
        } else {
            console.log('⚠️  Aucun mot de passe standard ne fonctionne.');
            console.log('💡 Le mot de passe a probablement été personnalisé.\n');
            console.log('🔧 Options pour réinitialiser:');
            console.log('\n   1️⃣  Réinitialiser avec "12345":');
            console.log('      node database/fix_admin_password.js\n');
            console.log('   2️⃣  Créer un nouveau mot de passe:');
            console.log('      node backend/utils/hashPassword.js "VotreMotDePasse"');
            console.log('      Puis mettre à jour dans MySQL:\n');
            console.log('      UPDATE utilisateurs');
            console.log('      SET mot_de_passe = \'HASH_GENERE\'');
            console.log('      WHERE email = \'admin@silyprocure.com\';\n');
        }
        
        // Vérifier si l'utilisateur est actif
        if (!user.actif) {
            console.log('⚠️  L\'utilisateur est inactif. Activation...');
            await connection.execute(
                'UPDATE utilisateurs SET actif = TRUE WHERE email = ?',
                ['admin@silyprocure.com']
            );
            console.log('✅ Utilisateur activé !\n');
        }
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
        if (error.code) {
            console.error('   Code:', error.code);
        }
        console.error('\n💡 Vérifiez que:');
        console.error('   - MySQL est en cours d\'exécution');
        console.error('   - Les identifiants dans .env sont corrects');
        console.error('   - La base de données "silypro" existe');
    } finally {
        if (connection) {
            connection.release();
        }
        await pool.end();
    }
}

trouverMotDePasseAdmin();

