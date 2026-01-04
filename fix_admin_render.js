// Script pour vérifier et réparer le compte admin sur Render
// Utilise PostgreSQL avec DATABASE_URL

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function fixAdmin() {
    console.log('🔧 Vérification et réparation du compte admin...\n');
    
    // Configuration de connexion
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
        // Vérifier si la table existe
        const tableCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'utilisateurs'
            );
        `);
        
        if (!tableCheck.rows[0].exists) {
            console.error('❌ La table utilisateurs n\'existe pas !');
            console.error('💡 Exécutez d\'abord: npm run render:init-db');
            process.exit(1);
        }
        
        // Vérifier si le compte admin existe
        const adminCheck = await pool.query(`
            SELECT id, email, nom, prenom, role, actif, 
                   LEFT(mot_de_passe, 30) as hash_preview
            FROM utilisateurs 
            WHERE email = $1
        `, ['admin@silyprocure.com']);
        
        if (adminCheck.rows.length === 0) {
            console.log('⚠️  Le compte admin n\'existe pas. Création...');
            
            // Créer le compte admin
            const password = 'admin123';
            const hash = await bcrypt.hash(password, 10);
            
            const result = await pool.query(`
                INSERT INTO utilisateurs (email, mot_de_passe, nom, prenom, fonction, role, actif) 
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id, email, nom, prenom, role, actif
            `, ['admin@silyprocure.com', hash, 'Admin', 'SilyProcure', 'Administrateur', 'admin', true]);
            
            console.log('✅ Compte admin créé avec succès !');
            console.log('   📧 Email:', result.rows[0].email);
            console.log('   👤 Nom:', result.rows[0].nom, result.rows[0].prenom);
            console.log('   🔑 Mot de passe: admin123');
            console.log('   ✅ Statut: Actif');
            
        } else {
            const admin = adminCheck.rows[0];
            console.log('📋 Compte admin trouvé:');
            console.log('   📧 Email:', admin.email);
            console.log('   👤 Nom:', admin.nom, admin.prenom);
            console.log('   🎭 Rôle:', admin.role);
            console.log('   ✅ Actif:', admin.actif ? 'Oui' : 'Non');
            console.log('   🔐 Hash:', admin.hash_preview + '...');
            
            // Vérifier si le compte est actif
            if (!admin.actif) {
                console.log('\n⚠️  Le compte est désactivé. Réactivation...');
                await pool.query(`
                    UPDATE utilisateurs 
                    SET actif = TRUE 
                    WHERE email = $1
                `, ['admin@silyprocure.com']);
                console.log('✅ Compte réactivé !');
            }
            
            // Réinitialiser le mot de passe
            console.log('\n🔄 Réinitialisation du mot de passe...');
            const password = 'admin123';
            const hash = await bcrypt.hash(password, 10);
            
            await pool.query(`
                UPDATE utilisateurs 
                SET mot_de_passe = $1, actif = TRUE
                WHERE email = $2
            `, [hash, 'admin@silyprocure.com']);
            
            console.log('✅ Mot de passe réinitialisé !');
            console.log('\n📝 Identifiants de connexion:');
            console.log('   📧 Email: admin@silyprocure.com');
            console.log('   🔑 Mot de passe: admin123');
        }
        
        // Vérifier la connexion
        console.log('\n🧪 Test de connexion...');
        const testAdmin = await pool.query(`
            SELECT email, nom, prenom, role, actif
            FROM utilisateurs 
            WHERE email = $1
        `, ['admin@silyprocure.com']);
        
        if (testAdmin.rows.length > 0) {
            const admin = testAdmin.rows[0];
            console.log('✅ Compte admin vérifié:');
            console.log('   📧 Email:', admin.email);
            console.log('   👤 Nom:', admin.nom, admin.prenom);
            console.log('   🎭 Rôle:', admin.role);
            console.log('   ✅ Actif:', admin.actif ? 'Oui' : 'Non');
            
            // Tester le mot de passe
            const passwordTest = await pool.query(`
                SELECT mot_de_passe 
                FROM utilisateurs 
                WHERE email = $1
            `, ['admin@silyprocure.com']);
            
            const isValid = await bcrypt.compare('admin123', passwordTest.rows[0].mot_de_passe);
            if (isValid) {
                console.log('   🔐 Mot de passe: Valide ✅');
            } else {
                console.log('   🔐 Mot de passe: Invalide ❌');
            }
        }
        
        console.log('\n✅ Opération terminée avec succès !');
        console.log('\n📝 Pour vous connecter:');
        console.log('   URL: https://silyprocure.onrender.com (ou votre domaine)');
        console.log('   Email: admin@silyprocure.com');
        console.log('   Mot de passe: admin123');
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
        console.error('\n💡 Vérifiez:');
        console.error('   1. Que la base de données est initialisée');
        console.error('   2. Que les variables d\'environnement sont correctes');
        console.error('   3. Que vous êtes connecté à la bonne base de données');
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Exécuter
if (require.main === module) {
    fixAdmin()
        .then(() => process.exit(0))
        .catch(error => {
            console.error('❌ Erreur fatale:', error);
            process.exit(1);
        });
}

module.exports = fixAdmin;

