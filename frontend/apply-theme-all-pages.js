/**
 * Script pour appliquer le thème Dashboard à toutes les pages restantes
 * Usage: node apply-theme-all-pages.js
 * 
 * Ce script applique automatiquement le thème Dashboard aux pages qui n'ont pas encore été mises à jour
 */

const fs = require('fs');
const path = require('path');

// Liste de toutes les pages à mettre à jour
const pagesToUpdate = [
    'rfq-create.html',
    'devis-create.html',
    'rfq-detail.html',
    'commandes-detail.html',
    'devis-detail.html',
    'entreprises-detail.html',
    'factures-detail.html',
    'bons-livraison-detail.html',
    'demandes-devis.html',
    'clients.html',
    'produits.html',
    'carte.html',
    'catalogue-fournisseur.html',
    'produits-fournisseur.html',
    'fournisseur-rfq.html',
    'devis-compare.html',
    'devis-externe.html',
    'parametres-messagepro.html',
    'notifications.html',
    'utilisateurs.html',
    'suivi.html'
];

// Template du head avec thème Dashboard
const headTemplate = `
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{TITLE}} - SilyProcure</title>
    
    <!-- CSS Charte Graphique Pro Confiance -->
    <link rel="stylesheet" href="css/style.css">
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
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
    
    <!-- Font Awesome & Google Fonts -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    <!-- Dashboard Theme CSS -->
    <link rel="stylesheet" href="css/dashboard-theme.css">
`;

// Template de la navbar (sans page active spécifique - sera adapté manuellement)
const navbarTemplate = `
    <!-- Navbar Moderne selon charte Pro Confiance -->
    <nav class="bg-white border-b-2 border-blue-100 sticky top-0 z-50 shadow-sm" role="navigation" aria-label="Navigation principale">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
                <!-- Logo & Nav Links -->
                <div class="flex items-center">
                    <div class="flex-shrink-0 flex items-center cursor-pointer" onclick="window.location.href='dashboard.html'">
                        <span class="text-2xl font-bold logo-primary">Sily<span class="text-gray-900">Procure</span></span>
                    </div>
                    <nav class="hidden sm:ml-6 sm:flex sm:space-x-1 md:ml-8" aria-label="Menu de navigation">
                        <a href="dashboard.html" class="border-transparent text-neutral-500 hover:border-primary-300 hover:text-primary-700 inline-flex items-center px-3 sm:px-4 py-2 border-b-2 text-sm font-medium transition-colors min-h-[44px] whitespace-nowrap">
                            <i class="fas fa-chart-line mr-1.5 sm:mr-2 text-xs sm:text-sm" aria-hidden="true"></i>
                            <span>Dashboard</span>
                        </a>
                        <a href="rfq.html" class="border-transparent text-neutral-500 hover:border-primary-300 hover:text-primary-700 inline-flex items-center px-3 sm:px-4 py-2 border-b-2 text-sm font-medium transition-colors min-h-[44px] whitespace-nowrap">
                            <i class="fas fa-file-contract mr-1.5 sm:mr-2 text-xs sm:text-sm" aria-hidden="true"></i>
                            <span>RFQ</span>
                        </a>
                        <a href="devis.html" class="border-transparent text-neutral-500 hover:border-primary-300 hover:text-primary-700 inline-flex items-center px-3 sm:px-4 py-2 border-b-2 text-sm font-medium transition-colors min-h-[44px] whitespace-nowrap">
                            <i class="fas fa-file-invoice-dollar mr-1.5 sm:mr-2 text-xs sm:text-sm" aria-hidden="true"></i>
                            <span>Devis</span>
                        </a>
                        <a href="commandes.html" class="border-transparent text-neutral-500 hover:border-primary-300 hover:text-primary-700 inline-flex items-center px-3 sm:px-4 py-2 border-b-2 text-sm font-medium transition-colors min-h-[44px] whitespace-nowrap">
                            <i class="fas fa-shopping-cart mr-1.5 sm:mr-2 text-xs sm:text-sm" aria-hidden="true"></i>
                            <span>Commandes</span>
                        </a>
                        <a href="entreprises.html" class="border-transparent text-neutral-500 hover:border-primary-300 hover:text-primary-700 inline-flex items-center px-3 sm:px-4 py-2 border-b-2 text-sm font-medium transition-colors min-h-[44px] whitespace-nowrap">
                            <i class="fas fa-building mr-1.5 sm:mr-2 text-xs sm:text-sm" aria-hidden="true"></i>
                            <span>Entreprises</span>
                        </a>
                    </nav>
                </div>

                <!-- Search Bar & Profile -->
                <div class="flex items-center gap-4">
                    <!-- Global Search -->
                    <div class="hidden lg:block relative text-neutral-500 focus-within:text-primary-600" role="search">
                        <label for="global-search" class="sr-only">Rechercher dans l'application</label>
                        <div class="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                            <i class="fas fa-search" aria-hidden="true"></i>
                        </div>
                        <input id="global-search" class="block w-64 bg-blue-50 py-2.5 pl-10 pr-4 border border-blue-200 rounded-full leading-5 text-neutral-700 placeholder-neutral-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition duration-150 ease-in-out min-h-[44px]" placeholder="Rechercher..." type="search" aria-label="Rechercher">
                    </div>

                    <!-- Notifications -->
                    <button class="relative p-2.5 text-neutral-500 hover:text-primary-600 transition-colors rounded-lg hover:bg-blue-50 min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label="Notifications" title="Notifications">
                        <i class="far fa-bell text-xl" aria-hidden="true"></i>
                        <span class="absolute top-2 right-2 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" aria-hidden="true"></span>
                    </button>

                    <!-- Profile Dropdown -->
                    <div class="relative flex items-center gap-3">
                        <div class="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold border-2 border-primary-200 shadow-sm" aria-label="Profil utilisateur">
                            <span id="user-initials">U</span>
                        </div>
                        <span id="user-name" class="hidden md:block text-sm font-semibold text-neutral-700 min-w-[120px]">Chargement...</span>
                        <button onclick="logout()" class="ml-1 text-xs text-red-600 hover:text-red-700 border border-red-200 rounded-lg px-3 py-2 hover:bg-red-50 transition min-h-[44px] flex items-center gap-1.5" aria-label="Déconnexion" title="Déconnexion">
                            <i class="fas fa-sign-out-alt" aria-hidden="true"></i>
                            <span class="hidden lg:inline">Déconnexion</span>
                        </button>
                    </div>
                    
                    <!-- Menu mobile -->
                    <div class="sm:hidden ml-2">
                        <button id="mobile-menu-button" onclick="toggleMobileMenu()" class="inline-flex items-center justify-center p-2.5 rounded-lg text-neutral-500 hover:text-primary-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 min-w-[44px] min-h-[44px]" aria-expanded="false" aria-label="Menu principal" aria-controls="mobile-menu">
                            <i class="fas fa-bars text-xl"></i>
                        </button>
                    </div>
                </div>
            </div>
            <!-- Menu mobile déroulant -->
            <div id="mobile-menu" class="hidden sm:hidden border-t-2 border-blue-100 bg-white shadow-lg">
                <div class="px-4 pt-3 pb-4 space-y-1">
                    <a href="dashboard.html" class="border-transparent text-neutral-700 hover:bg-blue-50 hover:text-primary-700 hover:border-l-4 hover:border-primary-300 block px-4 py-3 rounded-lg text-base font-medium transition-all min-h-[44px] flex items-center gap-3">
                        <i class="fas fa-chart-line text-neutral-500" aria-hidden="true"></i>
                        <span>Dashboard</span>
                    </a>
                    <a href="rfq.html" class="border-transparent text-neutral-700 hover:bg-blue-50 hover:text-primary-700 hover:border-l-4 hover:border-primary-300 block px-4 py-3 rounded-lg text-base font-medium transition-all min-h-[44px] flex items-center gap-3">
                        <i class="fas fa-file-contract text-neutral-500" aria-hidden="true"></i>
                        <span>RFQ</span>
                    </a>
                    <a href="devis.html" class="border-transparent text-neutral-700 hover:bg-blue-50 hover:text-primary-700 hover:border-l-4 hover:border-primary-300 block px-4 py-3 rounded-lg text-base font-medium transition-all min-h-[44px] flex items-center gap-3">
                        <i class="fas fa-file-invoice-dollar text-neutral-500" aria-hidden="true"></i>
                        <span>Devis</span>
                    </a>
                    <a href="commandes.html" class="border-transparent text-neutral-700 hover:bg-blue-50 hover:text-primary-700 hover:border-l-4 hover:border-primary-300 block px-4 py-3 rounded-lg text-base font-medium transition-all min-h-[44px] flex items-center gap-3">
                        <i class="fas fa-shopping-cart text-neutral-500" aria-hidden="true"></i>
                        <span>Commandes</span>
                    </a>
                    <a href="entreprises.html" class="border-transparent text-neutral-700 hover:bg-blue-50 hover:text-primary-700 hover:border-l-4 hover:border-primary-300 block px-4 py-3 rounded-lg text-base font-medium transition-all min-h-[44px] flex items-center gap-3">
                        <i class="fas fa-building text-neutral-500" aria-hidden="true"></i>
                        <span>Entreprises</span>
                    </a>
                </div>
            </div>
        </div>
    </nav>
`;

// Fonction toggleMobileMenu à ajouter
const toggleMobileMenuScript = `
        // Menu mobile
        function toggleMobileMenu() {
            const menu = document.getElementById('mobile-menu');
            const button = document.getElementById('mobile-menu-button');
            if (menu && button) {
                const isHidden = menu.classList.contains('hidden');
                menu.classList.toggle('hidden');
                button.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
                const icon = button.querySelector('i');
                if (icon) {
                    if (isHidden) {
                        icon.classList.remove('fa-bars');
                        icon.classList.add('fa-times');
                    } else {
                        icon.classList.remove('fa-times');
                        icon.classList.add('fa-bars');
                    }
                }
            }
        }
        window.toggleMobileMenu = toggleMobileMenu;
`;

console.log('🚀 Application du thème Dashboard à toutes les pages...\n');

pagesToUpdate.forEach(page => {
    const filePath = path.join(__dirname, page);
    
    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  ${page} non trouvé, ignoré`);
        return;
    }
    
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Extraire le titre
        const titleMatch = content.match(/<title>(.*?)<\/title>/);
        const currentTitle = titleMatch ? titleMatch[1].replace(' - SilyProcure', '') : 'Page';
        
        // Vérifier si la page a déjà le thème (présence de dashboard-theme.css)
        if (content.includes('dashboard-theme.css')) {
            console.log(`✅ ${page} a déjà le thème appliqué`);
            return;
        }
        
        // Remplacer le head
        const headRegex = /<head>[\s\S]*?<\/head>/i;
        const newHead = `<head>${headTemplate.replace('{{TITLE}}', currentTitle)}</head>`;
        if (headRegex.test(content)) {
            content = content.replace(headRegex, newHead);
        }
        
        // Ajouter body class si nécessaire
        if (!content.includes('class="h-full flex flex-col"')) {
            content = content.replace(/<body([^>]*)>/, '<body class="h-full flex flex-col"$1>');
        }
        
        // Ajouter la fonction toggleMobileMenu avant </script> ou </body>
        if (!content.includes('toggleMobileMenu')) {
            // Chercher le dernier </script> avant </body>
            const lastScriptMatch = content.match(/(.*<\/script>)([\s\S]*<\/body>)/);
            if (lastScriptMatch) {
                content = content.replace(
                    /(.*<\/script>)([\s\S]*<\/body>)/,
                    `$1${toggleMobileMenuScript}$2`
                );
            } else {
                // Si pas de script, ajouter avant </body>
                content = content.replace('</body>', `${toggleMobileMenuScript}\n    </script>\n</body>`);
            }
        }
        
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ ${page} mis à jour`);
    } catch (error) {
        console.error(`❌ Erreur sur ${page}:`, error.message);
    }
});

console.log('\n✅ Application du thème terminée !');
console.log('📝 Note: Vous devrez peut-être ajuster manuellement la navbar et la structure de certaines pages.');

