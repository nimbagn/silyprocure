// Script pour réinitialiser le mot de passe admin
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

async function resetAdminPassword() {
    try {
        console.log('🔐 Réinitialisation du mot de passe admin\n');
        
        // Nouveau mot de passe par défaut
        const newPassword = 'admin123';
        const hash = await bcrypt.hash(newPassword, 10);
        
        const isPostgres = pool.constructor.name === 'Pool' && pool.query;
        
        // Vérifier que l'utilisateur existe
        let users;
        if (isPostgres) {
            const result = await pool.query(
                'SELECT id, email, nom, prenom, role, actif FROM utilisateurs WHERE email = $1',
                ['admin@silyprocure.com']
            );
            users = result.rows;
        } else {
            const [rows] = await pool.execute(
                'SELECT id, email, nom, prenom, role, actif FROM utilisateurs WHERE email = ?',
                ['admin@silyprocure.com']
            );
            users = rows;
        }
        
        if (users.length === 0) {
            console.log('❌ Aucun utilisateur admin trouvé !');
            console.log('📝 Création de l\'utilisateur admin...\n');
            
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
            
            console.log('✅ Utilisateur admin créé avec succès !');
        } else {
            // Mettre à jour le mot de passe
            if (isPostgres) {
                await pool.query(
                    'UPDATE utilisateurs SET mot_de_passe = $1, actif = $2 WHERE email = $3',
                    [hash, true, 'admin@silyprocure.com']
                );
            } else {
                await pool.execute(
                    'UPDATE utilisateurs SET mot_de_passe = ?, actif = ? WHERE email = ?',
                    [hash, true, 'admin@silyprocure.com']
                );
            }
            
            console.log('✅ Mot de passe admin mis à jour avec succès !');
        }
        
        console.log('\n📋 Identifiants de connexion:');
        console.log('   📧 Email: admin@silyprocure.com');
        console.log('   🔑 Nouveau mot de passe: ' + newPassword);
        console.log('\n⚠️  IMPORTANT: Changez ce mot de passe après la première connexion !');
        
        // Vérification
        if (isPostgres) {
            const result = await pool.query(
                'SELECT email, nom, prenom, role, actif FROM utilisateurs WHERE email = $1',
                ['admin@silyprocure.com']
            );
            if (result.rows.length > 0) {
                console.log('\n✅ Vérification:');
                console.log('   Email:', result.rows[0].email);
                console.log('   Nom:', result.rows[0].nom, result.rows[0].prenom);
                console.log('   Rôle:', result.rows[0].role);
                console.log('   Actif:', result.rows[0].actif ? 'Oui' : 'Non');
            }
        } else {
            const [users] = await pool.execute(
                'SELECT email, nom, prenom, role, actif FROM utilisateurs WHERE email = ?',
                ['admin@silyprocure.com']
            );
            if (users.length > 0) {
                console.log('\n✅ Vérification:');
                console.log('   Email:', users[0].email);
                console.log('   Nom:', users[0].nom, users[0].prenom);
                console.log('   Rôle:', users[0].role);
                console.log('   Actif:', users[0].actif ? 'Oui' : 'Non');
            }
        }
        
        if (pool.end) {
            await pool.end();
        }
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur:', error.message);
        console.error('\n💡 Vérifiez:');
        console.error('   1. Que la base de données est démarrée');
        console.error('   2. Que les variables d\'environnement sont correctes (.env)');
        console.error('   3. Que le schéma de base de données a été créé');
        process.exit(1);
    }
}

resetAdminPassword();

