/**
 * Script pour appliquer le thème moderne (inspiré de home.html) à toutes les pages
 * Usage: node apply-modern-theme.js
 */

const fs = require('fs');
const path = require('path');

const pages = [
    'rfq.html',
    'commandes.html',
    'devis.html',
    'entreprises.html',
    'rfq-create.html',
    'rfq-detail.html',
    'commandes-detail.html',
    'devis-detail.html',
    'devis-create.html',
    'entreprises-detail.html',
    'factures-detail.html',
    'produits.html',
    'clients.html',
    'notifications.html',
    'utilisateurs.html',
    'suivi.html',
    'carte.html',
    'catalogue-fournisseur.html',
    'produits-fournisseur.html',
    'fournisseur-rfq.html',
    'demandes-devis.html',
    'devis-compare.html',
    'devis-externe.html',
    'bons-livraison-detail.html',
    'parametres-messagepro.html'
];

const modernThemeLink = '    <!-- Modern Theme (inspiré de home.html) -->\n    <link rel="stylesheet" href="css/modern-theme.css">\n';
const modernStyle = `    <style>
        /* Override pour utiliser le style moderne de home.html */
        body {
            font-family: "Plus Jakarta Sans", sans-serif !important;
            background: #f8fafc !important;
        }
        
        /* Utiliser brand-600 au lieu de primary-500 */
        .text-primary-600, .text-primary-500 { color: #2563eb !important; }
        .bg-primary-600, .bg-primary-500 { background-color: #2563eb !important; }
        .border-primary-500 { border-color: #2563eb !important; }
        
        /* Améliorer les cartes */
        .card, .stat-card, .facture-card, .filters-card, .kpi-card {
            border-radius: 1.5rem !important;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1) !important;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        
        .card:hover, .facture-card:hover {
            transform: translateY(-4px) !important;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
        }
    </style>
`;

function applyModernTheme(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Vérifier si le thème moderne est déjà appliqué
        if (content.includes('modern-theme.css')) {
            console.log(`✓ ${path.basename(filePath)} - Déjà mis à jour`);
            return;
        }
        
        // Ajouter le lien vers modern-theme.css après dashboard-theme.css
        if (content.includes('dashboard-theme.css')) {
            content = content.replace(
                /(<link rel="stylesheet" href="css\/dashboard-theme\.css">)/,
                `$1\n${modernThemeLink}`
            );
        } else if (content.includes('tailwind.css')) {
            // Si pas de dashboard-theme.css, ajouter après tailwind.css
            content = content.replace(
                /(<link rel="stylesheet" href="css\/tailwind\.css">)/,
                `$1\n${modernThemeLink}`
            );
        }
        
        // Ajouter Plus Jakarta Sans si pas présent
        if (!content.includes('Plus Jakarta Sans')) {
            const fontLink = '    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">\n';
            if (content.includes('</head>')) {
                content = content.replace('</head>', `${fontLink}</head>`);
            }
        }
        
        // Ajouter le style moderne avant </head>
        if (content.includes('</head>') && !content.includes('/* Override pour utiliser le style moderne')) {
            content = content.replace('</head>', `${modernStyle}</head>`);
        }
        
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✓ ${path.basename(filePath)} - Mis à jour avec succès`);
    } catch (error) {
        console.error(`✗ Erreur lors de la mise à jour de ${filePath}:`, error.message);
    }
}

// Appliquer à toutes les pages
console.log('Application du thème moderne aux pages...\n');
pages.forEach(page => {
    const filePath = path.join(__dirname, page);
    if (fs.existsSync(filePath)) {
        applyModernTheme(filePath);
    } else {
        console.log(`⚠ ${page} - Fichier non trouvé`);
    }
});

console.log('\n✓ Application terminée !');

