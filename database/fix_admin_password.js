// Script pour corriger le mot de passe admin avec le hash bcrypt correct
const pool = require('../backend/config/database');
const bcrypt = require('bcryptjs');

async function fixAdminPassword() {
    try {
        console.log('🔧 Correction du mot de passe admin...');
        
        const password = '12345';
        const hash = await bcrypt.hash(password, 10);
        
        console.log('📝 Hash généré:', hash);
        
        const [result] = await pool.execute(
            'UPDATE utilisateurs SET mot_de_passe = ? WHERE email = ?',
            [hash, 'admin@silyprocure.com']
        );
        
        if (result.affectedRows > 0) {
            console.log('✅ Mot de passe admin corrigé avec succès !');
            console.log('📧 Email: admin@silyprocure.com');
            console.log('🔑 Mot de passe: 12345');
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

fixAdminPassword();

