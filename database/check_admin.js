// Script pour vérifier l'utilisateur admin
const pool = require('../backend/config/database');
const bcrypt = require('bcryptjs');

async function checkAdmin() {
    try {
        console.log('🔍 Vérification de l\'utilisateur admin...\n');
        
        const [users] = await pool.execute(
            'SELECT id, email, nom, prenom, role, actif, mot_de_passe FROM utilisateurs WHERE email = ?',
            ['admin@silyprocure.com']
        );
        
        if (users.length === 0) {
            console.log('❌ Aucun utilisateur admin trouvé !');
            console.log('📝 Création de l\'utilisateur admin...');
            
            const password = '12345';
            const hash = await bcrypt.hash(password, 10);
            
            const [result] = await pool.execute(
                'INSERT INTO utilisateurs (email, mot_de_passe, nom, prenom, fonction, role, actif) VALUES (?, ?, ?, ?, ?, ?, ?)',
                ['admin@silyprocure.com', hash, 'Admin', 'SilyProcure', 'Administrateur', 'admin', true]
            );
            
            console.log('✅ Utilisateur admin créé avec succès !');
            console.log('📧 Email: admin@silyprocure.com');
            console.log('🔑 Mot de passe: 12345');
        } else {
            const user = users[0];
            console.log('✅ Utilisateur admin trouvé:');
            console.log('   ID:', user.id);
            console.log('   Email:', user.email);
            console.log('   Nom:', user.nom, user.prenom);
            console.log('   Rôle:', user.role);
            console.log('   Actif:', user.actif ? 'Oui' : 'Non');
            console.log('   Hash mot de passe:', user.mot_de_passe.substring(0, 20) + '...');
            
            // Tester le mot de passe
            const testPassword = '12345';
            const isValid = await bcrypt.compare(testPassword, user.mot_de_passe);
            
            console.log('\n🔐 Test du mot de passe "12345":', isValid ? '✅ Valide' : '❌ Invalide');
            
            if (!isValid) {
                console.log('\n🔧 Correction du mot de passe...');
                const newHash = await bcrypt.hash(testPassword, 10);
                await pool.execute(
                    'UPDATE utilisateurs SET mot_de_passe = ? WHERE email = ?',
                    [newHash, 'admin@silyprocure.com']
                );
                console.log('✅ Mot de passe corrigé !');
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

checkAdmin();

