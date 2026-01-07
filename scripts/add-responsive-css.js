#!/usr/bin/env node

/**
 * Script pour ajouter le lien vers responsive.css dans toutes les pages HTML
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const frontendDir = path.join(__dirname, '..', 'frontend');
const htmlFiles = glob.sync('**/*.html', { cwd: frontendDir });

let updatedCount = 0;

htmlFiles.forEach(file => {
    const filePath = path.join(frontendDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Vérifier si responsive.css est déjà présent
    if (content.includes('responsive.css')) {
        console.log(`✓ ${file} - responsive.css déjà présent`);
        return;
    }
    
    // Chercher le pattern link rel="stylesheet" href="css/style.css"
    const stylePattern = /(<link\s+rel=["']stylesheet["']\s+href=["']css\/style\.css["']\s*\/?>)/i;
    const match = content.match(stylePattern);
    
    if (match) {
        // Ajouter responsive.css après style.css
        const replacement = match[0] + '\n    <link rel="stylesheet" href="css/responsive.css">';
        content = content.replace(stylePattern, replacement);
        modified = true;
    } else {
        // Chercher n'importe quel link stylesheet pour insérer après
        const anyStylePattern = /(<link\s+rel=["']stylesheet["'][^>]*>)/i;
        const anyMatch = content.match(anyStylePattern);
        
        if (anyMatch) {
            // Trouver la dernière occurrence de link stylesheet dans le <head>
            const headMatch = content.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
            if (headMatch) {
                const headContent = headMatch[1];
                const lastStyleLink = headContent.match(/(<link\s+rel=["']stylesheet["'][^>]*>)/gi);
                
                if (lastStyleLink && lastStyleLink.length > 0) {
                    const lastLink = lastStyleLink[lastStyleLink.length - 1];
                    const replacement = lastLink + '\n    <link rel="stylesheet" href="css/responsive.css">';
                    content = content.replace(lastLink, replacement);
                    modified = true;
                }
            }
        }
    }
    
    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✓ ${file} - responsive.css ajouté`);
        updatedCount++;
    } else {
        console.log(`⚠ ${file} - Aucun pattern trouvé pour ajouter responsive.css`);
    }
});

console.log(`\n✅ ${updatedCount} fichier(s) mis à jour`);

