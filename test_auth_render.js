// Script de test pour vérifier l'authentification sur Render
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function testAuth() {
    console.log('🧪 Test de l\'authentification...\n');
    
    const connectionConfig = process.env.DATABASE_URL ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    } : {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    };
    
    const pool = new Pool(connectionConfig);
    
    try {
        const email = 'admin@silyprocure.com';
        const password = 'admin123';
        
        console.log('1️⃣  Test de la requête SQL...');
        
        // Test avec pool.query (PostgreSQL direct)
        const result1 = await pool.query(
            'SELECT * FROM utilisateurs WHERE email = $1 AND actif = TRUE',
            [email]
        );
        
        console.log('   ✅ Requête pool.query réussie');
        console.log('   📊 Résultats:', result1.rows.length, 'utilisateur(s) trouvé(s)');
        
        if (result1.rows.length === 0) {
            console.log('   ❌ Aucun utilisateur trouvé avec pool.query');
        } else {
            const user = result1.rows[0];
            console.log('   📧 Email:', user.email);
            console.log('   ✅ Actif:', user.actif);
            console.log('   🔐 Hash:', user.mot_de_passe.substring(0, 30) + '...');
            
            // Test du mot de passe
            console.log('\n2️⃣  Test du mot de passe...');
            const isValid = await bcrypt.compare(password, user.mot_de_passe);
            console.log('   🔑 Mot de passe testé:', password);
            console.log('   ✅ Valide:', isValid ? 'OUI' : 'NON');
            
            if (!isValid) {
                console.log('\n   ⚠️  Le mot de passe ne correspond pas !');
                console.log('   💡 Réinitialisation...');
                const newHash = await bcrypt.hash(password, 10);
                await pool.query(
                    'UPDATE utilisateurs SET mot_de_passe = $1 WHERE email = $2',
                    [newHash, email]
                );
                console.log('   ✅ Mot de passe réinitialisé');
            }
        }
        
        // Test avec le wrapper (simulation)
        console.log('\n3️⃣  Test avec le wrapper pool.execute...');
        
        // Simuler le wrapper
        const wrapperQuery = 'SELECT * FROM utilisateurs WHERE email = ? AND actif = ?';
        const pgQuery = wrapperQuery.replace(/\?/g, (match, offset) => {
            const index = (wrapperQuery.substring(0, offset).match(/\?/g) || []).length + 1;
            return `$${index}`;
        });
        console.log('   📝 Requête originale:', wrapperQuery);
        console.log('   📝 Requête convertie:', pgQuery);
        
        const result2 = await pool.query(
            pgQuery,
            [email, true]
        );
        console.log('   ✅ Requête wrapper réussie');
        console.log('   📊 Résultats:', result2.rows.length, 'utilisateur(s) trouvé(s)');
        
        console.log('\n✅ Tous les tests terminés !');
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
        console.error('   Stack:', error.stack);
    } finally {
        await pool.end();
    }
}

if (require.main === module) {
    testAuth()
        .then(() => process.exit(0))
        .catch(error => {
            console.error('❌ Erreur fatale:', error);
            process.exit(1);
        });
}

module.exports = testAuth;

