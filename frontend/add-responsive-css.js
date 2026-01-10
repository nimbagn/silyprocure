/**
 * Script pour ajouter responsive.css à tous les fichiers HTML qui ne l'ont pas
 */

const fs = require('fs');
const path = require('path');

const frontendDir = __dirname;
const htmlFiles = [];

// Fonction récursive pour trouver tous les fichiers HTML
function findHtmlFiles(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
            findHtmlFiles(filePath);
        } else if (file.endsWith('.html')) {
            htmlFiles.push(filePath);
        }
    });
}

// Trouver tous les fichiers HTML
findHtmlFiles(frontendDir);

let updated = 0;
let skipped = 0;

htmlFiles.forEach(filePath => {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Vérifier si responsive.css est déjà inclus
        if (content.includes('responsive.css')) {
            skipped++;
            return;
        }
        
        // Vérifier si style.css est inclus
        if (content.includes('css/style.css')) {
            // Ajouter responsive.css après style.css
            content = content.replace(
                /(<link[^>]*href=["']css\/style\.css["'][^>]*>)/i,
                '$1\n    <link rel="stylesheet" href="css/responsive.css">'
            );
            
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ Ajouté responsive.css à ${path.basename(filePath)}`);
            updated++;
        } else {
            console.log(`⚠️  ${path.basename(filePath)} n'a pas style.css, ignoré`);
        }
    } catch (error) {
        console.error(`❌ Erreur sur ${path.basename(filePath)}:`, error.message);
    }
});

console.log(`\n📊 Résumé:`);
console.log(`   - Fichiers mis à jour: ${updated}`);
console.log(`   - Fichiers déjà à jour: ${skipped}`);
console.log(`   - Total: ${htmlFiles.length}`);

