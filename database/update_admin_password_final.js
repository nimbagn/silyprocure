// Script pour mettre à jour le mot de passe admin avec un mot de passe valide (6+ caractères)
const pool = require('../backend/config/database');
const bcrypt = require('bcryptjs');

async function updateAdminPassword() {
    try {
        console.log('🔧 Mise à jour du mot de passe admin...\n');
        
        // Nouveau mot de passe : admin123 (8 caractères)
        const password = 'admin123';
        const hash = await bcrypt.hash(password, 10);
        
        console.log('📝 Hash généré:', hash);
        
        const [result] = await pool.execute(
            'UPDATE utilisateurs SET mot_de_passe = ? WHERE email = ?',
            [hash, 'admin@silyprocure.com']
        );
        
        if (result.affectedRows > 0) {
            console.log('✅ Mot de passe admin mis à jour avec succès !');
            console.log('\n📧 Identifiants de connexion :');
            console.log('   Email: admin@silyprocure.com');
            console.log('   Mot de passe: admin123');
            console.log('\n⚠️  Note: Le mot de passe doit contenir au moins 6 caractères');
        } else {
            console.log('⚠️  Aucun utilisateur admin trouvé');
        }
        
        // Vérification
        const [users] = await pool.execute(
            'SELECT email, nom, prenom, role, actif FROM utilisateurs WHERE email = ?',
            ['admin@silyprocure.com']
        );
        
        if (users.length > 0) {
            console.log('\n📋 Informations utilisateur:');
            console.log(users[0]);
        }
        
        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur:', error.message);
        process.exit(1);
    }
}

updateAdminPassword();

