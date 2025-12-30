const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function insertTestData() {
    let connection;
    
    try {
        // Configuration de la base de données
        const dbConfig = {
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            database: process.env.DB_NAME || 'silypro',
            user: process.env.DB_USER || 'soul',
            password: process.env.DB_PASSWORD || 'Satina2025',
            multipleStatements: true
        };

        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connexion à la base de données réussie');

        // Lire le fichier SQL
        const sqlFile = path.join(__dirname, 'insert_test_data_ai.sql');
        const sql = fs.readFileSync(sqlFile, 'utf8');

        // Exécuter le script
        console.log('📝 Insertion des données de test...');
        const [results] = await connection.query(sql);
        
        console.log('✅ Données de test insérées avec succès !');
        console.log('\n📋 Résumé:');
        console.log('   - RFQ créée: RFQ-TEST-IA-001');
        console.log('   - 4 devis créés avec des prix variés');
        console.log('   - Devis 1: Prix moyen, bon délai (15 jours)');
        console.log('   - Devis 2: Prix élevé, meilleures garanties (20 jours)');
        console.log('   - Devis 3: Prix bas, délai long (30 jours)');
        console.log('   - Devis 4: Prix anormalement bas (anomalie à détecter)');
        
        // Récupérer les IDs pour l'URL de test
        const [devis] = await connection.execute(
            `SELECT d.id FROM devis d 
             WHERE d.numero LIKE 'DEV-TEST-IA-%' 
             ORDER BY d.id`
        );
        
        if (devis.length > 0) {
            const devisIds = devis.map(d => d.id).join(',');
            console.log('\n🚀 URL de test:');
            console.log(`   http://localhost:3000/devis-compare.html?ids=${devisIds}`);
        }
        
        console.log('\n💡 Prochaines étapes:');
        console.log('   1. Ouvrez l\'URL ci-dessus dans votre navigateur');
        console.log('   2. Vérifiez que la section "Analyse IA" s\'affiche');
        console.log('   3. Observez les scores, recommandations et anomalies');
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'insertion:', error.message);
        if (error.sql) {
            console.error('SQL:', error.sql.substring(0, 200));
        }
        if (error.code) {
            console.error('Code erreur:', error.code);
        }
        console.error('\n💡 Alternative: Exécutez manuellement via MySQL:');
        console.error('   mysql -u soul -pSatina2025 silypro < database/insert_test_data_ai.sql');
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

insertTestData();

