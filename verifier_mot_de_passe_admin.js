// Script pour vérifier et afficher le mot de passe admin actuel
const pool = require('./backend/config/database');
const bcrypt = require('bcryptjs');

async function verifierMotDePasseAdmin() {
    try {
        console.log('🔍 Vérification du mot de passe admin...\n');
        
        const [users] = await pool.execute(
            'SELECT id, email, nom, prenom, role, actif, mot_de_passe FROM utilisateurs WHERE email = ?',
            ['admin@silyprocure.com']
        );
        
        if (users.length === 0) {
            console.log('❌ Aucun utilisateur admin trouvé !');
            console.log('📝 Création de l\'utilisateur admin...');
            
            const password = '12345';
            const hash = await bcrypt.hash(password, 10);
            
            await pool.execute(
                'INSERT INTO utilisateurs (email, mot_de_passe, nom, prenom, fonction, role, actif) VALUES (?, ?, ?, ?, ?, ?, ?)',
                ['admin@silyprocure.com', hash, 'Admin', 'SilyProcure', 'Administrateur', 'admin', true]
            );
            
            console.log('✅ Utilisateur admin créé avec succès !');
            console.log('\n📋 Identifiants:');
            console.log('   📧 Email: admin@silyprocure.com');
            console.log('   🔑 Mot de passe: 12345');
        } else {
            const user = users[0];
            console.log('✅ Utilisateur admin trouvé:');
            console.log('   📧 Email:', user.email);
            console.log('   👤 Nom:', user.nom, user.prenom);
            console.log('   🎭 Rôle:', user.role);
            console.log('   ✅ Actif:', user.actif ? 'Oui' : 'Non');
            
            // Tester les mots de passe possibles
            const passwordsToTest = ['12345', 'password', 'admin123', 'admin'];
            console.log('\n🔐 Test des mots de passe possibles:');
            
            let foundPassword = null;
            for (const pwd of passwordsToTest) {
                const isValid = await bcrypt.compare(pwd, user.mot_de_passe);
                console.log(`   - "${pwd}": ${isValid ? '✅ VALIDE' : '❌ Invalide'}`);
                if (isValid) {
                    foundPassword = pwd;
                }
            }
            
            if (foundPassword) {
                console.log('\n✅ Mot de passe trouvé !');
                console.log('\n📋 Identifiants de connexion:');
                console.log('   📧 Email: admin@silyprocure.com');
                console.log('   🔑 Mot de passe: ' + foundPassword);
            } else {
                console.log('\n⚠️  Aucun mot de passe standard ne fonctionne.');
                console.log('💡 Le mot de passe a probablement été changé.');
                console.log('\n🔧 Options:');
                console.log('   1. Réinitialiser avec "12345":');
                console.log('      node database/fix_admin_password.js');
                console.log('   2. Créer un nouveau hash:');
                console.log('      node backend/utils/hashPassword.js "VotreMotDePasse"');
            }
            
            if (!user.actif) {
                console.log('\n⚠️  L\'utilisateur est inactif. Activation...');
                await pool.execute(
                    'UPDATE utilisateurs SET actif = TRUE WHERE email = ?',
                    ['admin@silyprocure.com']
                );
                console.log('✅ Utilisateur activé !');
            }
        }
        
        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur:', error.message);
        process.exit(1);
    }
}

verifierMotDePasseAdmin();

