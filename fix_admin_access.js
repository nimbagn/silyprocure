// Script pour vérifier et créer/réinitialiser le compte admin
// Compatible MySQL et PostgreSQL

const bcrypt = require('bcryptjs');
require('dotenv').config();

// Détecter si on utilise PostgreSQL ou MySQL
let pool;
try {
    // Essayer PostgreSQL d'abord
    const { Pool: PgPool } = require('pg');
    pool = new PgPool({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'silypro',
        user: process.env.DB_USER || 'soul',
        password: process.env.DB_PASSWORD || 'Satina2025',
    });
    console.log('📊 Utilisation de PostgreSQL');
} catch (e) {
    // Sinon utiliser MySQL
    const mysql = require('mysql2/promise');
    pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        database: process.env.DB_NAME || 'silypro',
        user: process.env.DB_USER || 'soul',
        password: process.env.DB_PASSWORD || 'Satina2025',
    });
    console.log('📊 Utilisation de MySQL');
}

async function fixAdminAccess() {
    let connection;
    try {
        console.log('🔍 Vérification du compte admin...\n');
        
        // Tester la connexion
        if (pool.query) {
            await pool.query('SELECT 1');
        } else {
            connection = await pool.getConnection();
        }
        
        const isPostgres = pool.constructor.name === 'Pool' && pool.query;
        
        // Vérifier si l'admin existe
        let users;
        if (isPostgres) {
            const result = await pool.query(
                'SELECT id, email, nom, prenom, role, actif, mot_de_passe FROM utilisateurs WHERE email = $1',
                ['admin@silyprocure.com']
            );
            users = result.rows;
        } else {
            const [rows] = await pool.execute(
                'SELECT id, email, nom, prenom, role, actif, mot_de_passe FROM utilisateurs WHERE email = ?',
                ['admin@silyprocure.com']
            );
            users = rows;
        }
        
        if (users.length === 0) {
            console.log('❌ Aucun utilisateur admin trouvé !');
            console.log('📝 Création de l\'utilisateur admin...\n');
            
            const password = 'admin123';
            const hash = await bcrypt.hash(password, 10);
            
            if (isPostgres) {
                await pool.query(
                    'INSERT INTO utilisateurs (email, mot_de_passe, nom, prenom, fonction, role, actif) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                    ['admin@silyprocure.com', hash, 'Admin', 'SilyProcure', 'Administrateur', 'admin', true]
                );
            } else {
                await pool.execute(
                    'INSERT INTO utilisateurs (email, mot_de_passe, nom, prenom, fonction, role, actif) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    ['admin@silyprocure.com', hash, 'Admin', 'SilyProcure', 'Administrateur', 'admin', true]
                );
            }
            
            console.log('✅ Utilisateur admin créé avec succès !\n');
            console.log('📋 Identifiants de connexion:');
            console.log('   📧 Email: admin@silyprocure.com');
            console.log('   🔑 Mot de passe: admin123');
            console.log('\n⚠️  IMPORTANT: Changez ce mot de passe après la première connexion !');
        } else {
            const user = users[0];
            console.log('✅ Utilisateur admin trouvé:');
            console.log('   📧 Email:', user.email);
            console.log('   👤 Nom:', user.nom, user.prenom);
            console.log('   🎭 Rôle:', user.role);
            console.log('   ✅ Actif:', user.actif ? 'Oui' : 'Non');
            
            if (!user.actif) {
                console.log('\n⚠️  Le compte admin est désactivé !');
                console.log('📝 Réactivation du compte...');
                
                if (isPostgres) {
                    await pool.query(
                        'UPDATE utilisateurs SET actif = $1 WHERE email = $2',
                        [true, 'admin@silyprocure.com']
                    );
                } else {
                    await pool.execute(
                        'UPDATE utilisateurs SET actif = ? WHERE email = ?',
                        [true, 'admin@silyprocure.com']
                    );
                }
                console.log('✅ Compte réactivé !');
            }
            
            // Proposer de réinitialiser le mot de passe
            console.log('\n💡 Pour réinitialiser le mot de passe admin, utilisez:');
            console.log('   node fix_admin_access.js --reset-password');
            
            // Tester les mots de passe courants
            console.log('\n🔍 Test des mots de passe courants...');
            const commonPasswords = ['password', 'admin123', '12345', 'admin', 'password123'];
            
            for (const testPassword of commonPasswords) {
                const isValid = await bcrypt.compare(testPassword, user.mot_de_passe);
                if (isValid) {
                    console.log(`\n✅ Mot de passe trouvé: "${testPassword}"`);
                    console.log('\n📋 Identifiants de connexion:');
                    console.log('   📧 Email: admin@silyprocure.com');
                    console.log('   🔑 Mot de passe: ' + testPassword);
                    return;
                }
            }
            
            console.log('❌ Aucun mot de passe courant ne correspond.');
            console.log('\n💡 Pour réinitialiser le mot de passe:');
            console.log('   node fix_admin_access.js --reset-password');
        }
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
        console.error('\n💡 Vérifiez:');
        console.error('   1. Que la base de données est démarrée');
        console.error('   2. Que les variables d\'environnement sont correctes (.env)');
        console.error('   3. Que le schéma de base de données a été créé');
        process.exit(1);
    } finally {
        if (connection) {
            connection.release();
        }
        if (pool.end) {
            await pool.end();
        }
        process.exit(0);
    }
}

// Gérer l'option --reset-password
if (process.argv.includes('--reset-password')) {
    async function resetPassword() {
        try {
            const readline = require('readline').createInterface({
                input: process.stdin,
                output: process.stdout
            });
            
            const question = (query) => new Promise(resolve => readline.question(query, resolve));
            
            console.log('🔐 Réinitialisation du mot de passe admin\n');
            const newPassword = await question('Entrez le nouveau mot de passe: ');
            
            if (!newPassword || newPassword.length < 6) {
                console.log('❌ Le mot de passe doit contenir au moins 6 caractères');
                readline.close();
                process.exit(1);
            }
            
            const hash = await bcrypt.hash(newPassword, 10);
            const isPostgres = pool.constructor.name === 'Pool' && pool.query;
            
            if (isPostgres) {
                await pool.query(
                    'UPDATE utilisateurs SET mot_de_passe = $1 WHERE email = $2',
                    [hash, 'admin@silyprocure.com']
                );
            } else {
                await pool.execute(
                    'UPDATE utilisateurs SET mot_de_passe = ? WHERE email = ?',
                    [hash, 'admin@silyprocure.com']
                );
            }
            
            console.log('\n✅ Mot de passe admin mis à jour avec succès !');
            console.log('📧 Email: admin@silyprocure.com');
            console.log('🔑 Nouveau mot de passe: ' + newPassword);
            
            readline.close();
            await pool.end();
            process.exit(0);
        } catch (error) {
            console.error('❌ Erreur:', error.message);
            process.exit(1);
        }
    }
    
    resetPassword();
} else {
    fixAdminAccess();
}

