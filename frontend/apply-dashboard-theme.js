/**
 * Script pour appliquer le thème Dashboard à toutes les pages
 * Usage: node apply-dashboard-theme.js
 */

const fs = require('fs');
const path = require('path');

const pages = [
    'rfq.html',
    'commandes.html',
    'devis.html',
    'entreprises.html',
    'factures.html',
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

// Configuration Tailwind Pro Confiance
const tailwindConfig = `
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        primary: {
                            50: '#E0E7FF',
                            100: '#DBEAFE',
                            400: '#60A5FA',
                            500: '#3B82F6',
                            600: '#2563EB',
                            700: '#1D4ED8',
                            900: '#1E3A8A',
                        },
                        success: {
                            500: '#10B981',
                        },
                        neutral: {
                            500: '#64748B',
                            600: '#475569',
                        }
                    },
                    fontFamily: {
                        sans: ['Inter', 'Arial', 'sans-serif'],
                    }
                }
            }
        }
    </script>
`;

// Head standard avec thème Dashboard
const headTemplate = `
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{TITLE}} - SilyProcure</title>
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    ${tailwindConfig}
    
    <!-- Chart.js (si nécessaire) -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    
    <!-- Font Awesome & Google Fonts -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    <!-- Dashboard Theme CSS -->
    <link rel="stylesheet" href="css/dashboard-theme.css">
    
    <!-- Custom styles -->
    <style>
        body { 
            font-family: 'Inter', sans-serif;
            background-color: var(--color-background-light);
        }
        
        main {
            max-width: 1400px;
            margin: 0 auto;
            padding: 2rem 1rem;
        }
        
        .page-header {
            margin-bottom: 2rem;
        }
        
        .page-header h1 {
            font-size: 2rem;
            font-weight: 700;
            color: var(--color-primary-dark);
            margin-bottom: 0.5rem;
        }
        
        .page-header p {
            color: var(--color-neutral);
            font-size: 1rem;
        }
    </style>
`;

function applyThemeToPage(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Extraire le titre actuel
        const titleMatch = content.match(/<title>(.*?)<\/title>/);
        const currentTitle = titleMatch ? titleMatch[1].replace(' - SilyProcure', '') : 'Page';
        
        // Remplacer le head
        const headRegex = /<head>[\s\S]*?<\/head>/i;
        const newHead = headTemplate.replace('{{TITLE}}', currentTitle);
        
        if (headRegex.test(content)) {
            content = content.replace(headRegex, `<head>${newHead}</head>`);
        }
        
        // Ajouter le body avec classe h-full si nécessaire
        if (!content.includes('class="h-full')) {
            content = content.replace(/<body([^>]*)>/, '<body class="h-full flex flex-col"$1>');
        }
        
        // Remplacer l'ancienne navbar par la nouvelle (si présente)
        // Cette partie sera gérée manuellement pour chaque page
        
        // Envelopper le contenu principal dans <main> si nécessaire
        if (!content.includes('<main')) {
            // Trouver le contenu après la navbar
            const bodyContent = content.match(/<body[^>]*>([\s\S]*)<\/body>/);
            if (bodyContent) {
                // Ajouter la navbar et wrapper le contenu
                // Cette partie sera gérée manuellement
            }
        }
        
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ ${path.basename(filePath)} mis à jour`);
    } catch (error) {
        console.error(`❌ Erreur sur ${filePath}:`, error.message);
    }
}

// Appliquer à toutes les pages
pages.forEach(page => {
    const filePath = path.join(__dirname, page);
    if (fs.existsSync(filePath)) {
        applyThemeToPage(filePath);
    } else {
        console.log(`⚠️  ${page} non trouvé`);
    }
});

console.log('\n✅ Application du thème terminée !');
console.log('📝 Note: Vous devrez peut-être ajuster manuellement la navbar et la structure de certaines pages.');

