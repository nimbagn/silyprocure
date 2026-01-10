/**
 * Script pour améliorer automatiquement la responsivité
 * - Ajoute table-container autour des tableaux
 * - Améliore les formulaires
 * - Améliore les modals
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
        
        if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules' && file !== 'templates') {
            findHtmlFiles(filePath);
        } else if (file.endsWith('.html') && !file.includes('template')) {
            htmlFiles.push(filePath);
        }
    });
}

findHtmlFiles(frontendDir);

let updated = 0;
let tablesFixed = 0;
let formsFixed = 0;

htmlFiles.forEach(filePath => {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;
        
        // 1. Améliorer les tableaux : ajouter table-container si pas déjà présent
        // Chercher les patterns: <table, <div.*overflow.*table, etc.
        const tablePatterns = [
            // Pattern 1: <table directement sans wrapper
            /(<table[^>]*class=["'][^"']*table[^"']*["'][^>]*>)/gi,
            // Pattern 2: <div><table sans table-container
            /(<div[^>]*>)\s*(<table[^>]*class=["'][^"']*table[^"']*["'][^>]*>)/gi,
        ];
        
        // Si on trouve un <table qui n'est pas dans un table-container
        if (content.includes('<table') && !content.includes('table-container')) {
            // Essayer de wrapper les tableaux simples
            content = content.replace(
                /(<table[^>]*class=["'][^"']*table[^"']*["'][^>]*>)/gi,
                '<div class="table-container">$1'
            );
            
            // Fermer les divs ouverts
            content = content.replace(
                /(<\/table>)/gi,
                '$1</div>'
            );
            
            tablesFixed++;
            modified = true;
        }
        
        // 2. Améliorer les formulaires : s'assurer qu'ils ont les bonnes classes
        if (content.includes('<form') && !content.includes('form-group')) {
            // Ajouter des classes form-group aux labels/inputs si manquantes
            // (Ceci est plus complexe, on le fera manuellement pour les cas critiques)
        }
        
        // 3. Améliorer les modals : s'assurer qu'ils ont modal-overlay
        if (content.includes('modal') && !content.includes('modal-overlay') && content.includes('class="modal"')) {
            // Wrapper les modals dans modal-overlay si nécessaire
            content = content.replace(
                /(<div[^>]*class=["'][^"']*modal["'][^>]*>)/gi,
                '<div class="modal-overlay">$1'
            );
            modified = true;
        }
        
        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ Amélioré ${path.basename(filePath)}`);
            updated++;
        }
    } catch (error) {
        console.error(`❌ Erreur sur ${path.basename(filePath)}:`, error.message);
    }
});

console.log(`\n📊 Résumé:`);
console.log(`   - Fichiers mis à jour: ${updated}`);
console.log(`   - Tableaux améliorés: ${tablesFixed}`);
console.log(`   - Total fichiers: ${htmlFiles.length}`);

