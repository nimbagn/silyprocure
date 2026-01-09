/**
 * Helper pour appliquer le thème Dashboard à une page HTML
 * Usage: node apply-theme-helper.js <page.html> <currentPage>
 * 
 * currentPage peut être: 'dashboard', 'rfq', 'devis', 'commandes', 'entreprises'
 */

const fs = require('fs');
const path = require('path');

function applyThemeToPage(filePath, currentPage = null) {
    if (!fs.existsSync(filePath)) {
        console.error(`❌ Fichier non trouvé: ${filePath}`);
        return false;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Vérifier si déjà mis à jour
    if (content.includes('dashboard-theme.css')) {
        console.log(`✅ ${path.basename(filePath)} a déjà le thème`);
        return true;
    }
    
    // Extraire le titre
    const titleMatch = content.match(/<title>(.*?)<\/title>/);
    const currentTitle = titleMatch ? titleMatch[1].replace(' - SilyProcure', '') : 'Page';
    
    // Template head
    const headTemplate = `
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${currentTitle} - SilyProcure</title>
    
    <!-- CSS Charte Graphique Pro Confiance -->
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="css/responsive.css">
    <link rel="stylesheet" href="css/animations.css">
    
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
    <link rel="stylesheet" href="css/dashboard-theme.css">`;
    
    // Remplacer le head
    const headRegex = /<head>[\s\S]*?<\/head>/i;
    if (headRegex.test(content)) {
        content = content.replace(headRegex, `<head>${headTemplate}</head>`);
    }
    
    // Ajouter body class
    if (!content.includes('class="h-full flex flex-col"')) {
        content = content.replace(/<body([^>]*)>/, '<body class="h-full flex flex-col"$1>');
    }
    
    // Remplacer l'ancienne navbar (pattern commun)
    const oldNavPattern = /<div class="header">[\s\S]*?<\/nav>/i;
    if (oldNavPattern.test(content)) {
        // Générer la navbar avec la page active
        const navbar = generateNavbar(currentPage);
        content = content.replace(oldNavPattern, navbar);
    }
    
    // Ajouter toggleMobileMenu si absent
    if (!content.includes('toggleMobileMenu')) {
        const toggleScript = `
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
        window.toggleMobileMenu = toggleMobileMenu;`;
        
        // Ajouter avant </script> ou </body>
        if (content.includes('</script>')) {
            content = content.replace(/(<\/script>)([\s\S]*<\/body>)/, `$1${toggleScript}$2`);
        } else {
            content = content.replace('</body>', `${toggleScript}\n    </script>\n</body>`);
        }
    }
    
    // Corriger l'initialisation de l'utilisateur
    content = content.replace(
        /const user = JSON\.parse\(localStorage\.getItem\('user'\) \|\| '\{\}'\);\s*document\.getElementById\('user-name'\)\.textContent/,
        `const user = JSON.parse(localStorage.getItem('user') || '{}');
        // Initialisation du nom d'utilisateur et des initiales
        const userNameEl = document.getElementById('user-name');
        const userInitialsEl = document.getElementById('user-initials');
        if (userNameEl) {
            userNameEl.textContent`
    );
    
    // Ajouter l'initialisation des initiales si manquante
    if (!content.includes('userInitialsEl')) {
        content = content.replace(
            /(if \(userNameEl\) \{[\s\S]*?userNameEl\.textContent = .*?\n\s*\}\n)/,
            `$1        if (userInitialsEl && user.prenom) {
            userInitialsEl.textContent = (user.prenom.charAt(0) + (user.nom ? user.nom.charAt(0) : '')).toUpperCase();
        }
`
        );
    }
    
    // Envelopper le contenu dans <main> si nécessaire
    if (!content.includes('<main')) {
        // Trouver le conteneur principal
        content = content.replace(
            /(<div class="container">)/,
            `    <!-- Main Content -->
    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
$1`
        );
        // Fermer le main avant les scripts
        content = content.replace(
            /(\s*<\/div>\s*<\/div>)\s*(<script src="js\/auth\.js">)/,
            `$1
    </main>

    $2`
        );
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ ${path.basename(filePath)} mis à jour`);
    return true;
}

function generateNavbar(currentPage) {
    const pages = [
        { id: 'dashboard', href: 'dashboard.html', label: 'Dashboard', icon: 'fa-chart-line' },
        { id: 'rfq', href: 'rfq.html', label: 'RFQ', icon: 'fa-file-contract' },
        { id: 'devis', href: 'devis.html', label: 'Devis', icon: 'fa-file-invoice-dollar' },
        { id: 'commandes', href: 'commandes.html', label: 'Commandes', icon: 'fa-shopping-cart' },
        { id: 'entreprises', href: 'entreprises.html', label: 'Entreprises', icon: 'fa-building' }
    ];
    
    const navLinks = pages.map(page => {
        const isActive = page.id === currentPage;
        return `<a href="${page.href}" class="${isActive ? 'border-primary-500 text-primary-900 font-semibold' : 'border-transparent text-neutral-500 hover:border-primary-300 hover:text-primary-700 font-medium'} inline-flex items-center px-3 sm:px-4 py-2 border-b-2 text-sm transition-colors min-h-[44px] whitespace-nowrap" ${isActive ? 'aria-current="page"' : ''}>
                            <i class="fas ${page.icon} mr-1.5 sm:mr-2 text-xs sm:text-sm" aria-hidden="true"></i>
                            <span>${page.label}</span>
                        </a>`;
    }).join('\n                        ');
    
    const mobileLinks = pages.map(page => {
        const isActive = page.id === currentPage;
        return `<a href="${page.href}" class="${isActive ? 'bg-gradient-to-r from-blue-50 to-primary-50 border-l-4 border-primary-500 text-primary-700 font-semibold' : 'border-transparent text-neutral-700 hover:bg-blue-50 hover:text-primary-700 hover:border-l-4 hover:border-primary-300 font-medium'} block px-4 py-3 rounded-lg text-base transition-all min-h-[44px] flex items-center gap-3">
                            <i class="fas ${page.icon} ${isActive ? 'text-primary-600' : 'text-neutral-500'}" aria-hidden="true"></i>
                            <span>${page.label}</span>
                        </a>`;
    }).join('\n                    ');
    
    return `
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
                        ${navLinks}
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
                    ${mobileLinks}
                </div>
            </div>
        </div>
    </nav>

    <!-- Main Content -->
    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">`;
}

// Export pour utilisation
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { applyThemeToPage, generateNavbar };
}

// Si exécuté directement
if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.length < 1) {
        console.error('Usage: node apply-theme-helper.js <page.html> [currentPage]');
        process.exit(1);
    }
    
    const filePath = path.join(__dirname, args[0]);
    const currentPage = args[1] || null;
    
    applyThemeToPage(filePath, currentPage);
}

