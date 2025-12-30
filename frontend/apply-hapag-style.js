// Script pour appliquer le style Hapag-Lloyd à tous les fichiers HTML
// À exécuter avec Node.js : node apply-hapag-style.js

const fs = require('fs');
const path = require('path');

const htmlFiles = [
    'rfq.html',
    'devis.html',
    'commandes.html',
    'factures.html',
    'entreprises.html',
    'produits.html',
    'rfq-create.html',
    'devis-create.html',
    'entreprises-detail.html',
    'produits-fournisseur.html',
    'catalogue-fournisseur.html',
    'carte.html',
    'rfq-detail.html',
    'devis-detail.html',
    'devis-compare.html',
    'fournisseur-rfq.html'
];

htmlFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Ajouter la police Inter si pas déjà présente
        if (!content.includes('fonts.googleapis.com/css2?family=Inter')) {
            content = content.replace(
                /(<link rel="stylesheet" href="css\/style\.css">)/,
                '$1\n    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">'
            );
        }
        
        // Ajouter sidebar.js si pas déjà présent
        if (!content.includes('js/sidebar.js')) {
            // Chercher où insérer (après les autres scripts JS)
            const scriptPattern = /(<script src="js\/(auth|app|components)\.js"><\/script>)/;
            if (scriptPattern.test(content)) {
                content = content.replace(
                    /(<script src="js\/(auth|app|components)\.js"><\/script>\s*)+/,
                    (match) => match + '    <script src="js/sidebar.js"></script>\n'
                );
            } else {
                // Si pas de scripts, ajouter au début du body
                content = content.replace(
                    /(<body[^>]*>)/,
                    '$1\n    <script src="js/sidebar.js"></script>'
                );
            }
        }
        
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ ${file} mis à jour`);
    } else {
        console.log(`⚠️  ${file} non trouvé`);
    }
});

console.log('\n✅ Tous les fichiers ont été mis à jour !');

