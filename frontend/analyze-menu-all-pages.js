/**
 * Script Node.js pour analyser toutes les pages HTML et détecter les problèmes de menu
 * Usage: node analyze-menu-all-pages.js
 */

const fs = require('fs');
const path = require('path');

const HTML_PAGES = [
    'dashboard.html',
    'home.html',
    'rfq.html',
    'devis.html',
    'commandes.html',
    'entreprises.html',
    'factures.html',
    'carte.html',
    'clients.html',
    'demandes-devis.html',
    'produits.html',
    'catalogue-fournisseur.html',
    'notifications.html',
    'utilisateurs.html',
    'parametres-messagepro.html',
    'rfq-create.html',
    'rfq-detail.html',
    'devis-create.html',
    'devis-detail.html',
    'devis-compare.html',
    'commandes-detail.html',
    'entreprises-detail.html',
    'factures-detail.html',
    'produits-fournisseur.html',
    'fournisseur-rfq.html',
    'bons-livraison-detail.html'
];

const results = {
    pages: [],
    issues: [],
    summary: {
        totalPages: 0,
        pagesWithNavbar: 0,
        pagesWithSidebar: 0,
        pagesWithBoth: 0,
        pagesWithNone: 0,
        pagesWithMobileMenu: 0,
        pagesWithActivePage: 0,
        pagesWithBrokenLinks: 0,
        pagesWithToggleFunction: 0
    }
};

function analyzePage(filePath) {
    const fileName = path.basename(filePath);
    const content = fs.readFileSync(filePath, 'utf8');
    
    const result = {
        page: fileName,
        hasNavbar: false,
        hasSidebar: false,
        sidebarDisabled: false,
        hasMobileMenu: false,
        hasToggleFunction: false,
        hasActivePage: false,
        brokenLinks: [],
        issues: [],
        navbarType: null
    };

    // Vérifier la présence de navbar
    const hasNavbarTag = /<nav[^>]*role=["']navigation["'][^>]*>/i.test(content) ||
                         /<nav[^>]*class=["'][^"']*bg-white[^"']*["'][^>]*>/i.test(content) ||
                         /<nav[^>]*class=["'][^"']*fixed[^"']*["'][^>]*>/i.test(content);
    
    const hasNavbarScript = /createNavbar/i.test(content);
    const hasNavbarInline = /<!-- Navbar Moderne/i.test(content);
    
    result.hasNavbar = hasNavbarTag || hasNavbarScript || hasNavbarInline;
    
    if (hasNavbarScript) {
        result.navbarType = 'script';
    } else if (hasNavbarInline) {
        result.navbarType = 'inline';
    }

    // Vérifier la sidebar
    const hasSidebarScript = /sidebar\.js/i.test(content);
    const sidebarDisabled = /DISABLE_SIDEBAR\s*=\s*true/i.test(content);
    const hasSidebarClass = /class=["'][^"']*sidebar[^"']*["']/i.test(content);
    
    result.hasSidebar = hasSidebarScript && !sidebarDisabled;
    result.sidebarDisabled = sidebarDisabled;

    // Vérifier le menu mobile
    const hasMobileMenuButton = /mobile-menu-button|mobile-menu-toggle/i.test(content);
    const hasMobileMenu = /id=["']mobile-menu["']/i.test(content);
    result.hasMobileMenu = hasMobileMenuButton || hasMobileMenu;

    // Vérifier la fonction toggle (dans le HTML ou via script externe)
    const hasToggleMobileMenu = /function\s+toggleMobileMenu|toggleMobileMenu\s*=/i.test(content);
    const hasToggleSidebar = /function\s+toggleSidebar|toggleSidebar\s*=/i.test(content);
    const hasMobileMenuScript = /mobile-menu\.js/i.test(content);
    result.hasToggleFunction = hasToggleMobileMenu || hasToggleSidebar || hasMobileMenuScript;

    // Vérifier la page active
    const hasActivePage = /aria-current=["']page["']|border-primary-500|\.active/i.test(content);
    result.hasActivePage = hasActivePage;

    // Vérifier les liens dans le menu
    const linkMatches = content.match(/href=["']([^"']+)["']/g) || [];
    linkMatches.forEach(match => {
        const href = match.match(/href=["']([^"']+)["']/)[1];
        if (href && !href.startsWith('#') && !href.startsWith('http') && !href.startsWith('javascript:')) {
            const linkPage = href.split('/').pop().split('#')[0];
            if (linkPage && !HTML_PAGES.includes(linkPage) && linkPage.endsWith('.html')) {
                result.brokenLinks.push(href);
            }
        }
    });

    // Détecter les problèmes
    if (!result.hasNavbar && !result.hasSidebar) {
        result.issues.push('Aucun menu détecté');
    }
    
    if (result.hasNavbar && result.hasSidebar) {
        result.issues.push('Navbar et Sidebar présentes simultanément (conflit possible)');
    }
    
    if (!result.hasMobileMenu && result.hasNavbar) {
        result.issues.push('Menu mobile non détecté alors qu\'une navbar est présente');
    }
    
    if (!result.hasToggleFunction && result.hasMobileMenu) {
        result.issues.push('Menu mobile présent mais fonction toggle non trouvée');
    }
    
    if (!result.hasActivePage && result.hasNavbar) {
        result.issues.push('Page active non mise en évidence dans la navbar');
    }
    
    if (result.brokenLinks.length > 0) {
        result.issues.push(`${result.brokenLinks.length} lien(s) potentiellement cassé(s)`);
    }

    return result;
}

// Analyser toutes les pages
const frontendDir = __dirname;

HTML_PAGES.forEach(page => {
    const filePath = path.join(frontendDir, page);
    if (fs.existsSync(filePath)) {
        const result = analyzePage(filePath);
        results.pages.push(result);
        results.summary.totalPages++;
        
        if (result.hasNavbar) results.summary.pagesWithNavbar++;
        if (result.hasSidebar) results.summary.pagesWithSidebar++;
        if (result.hasNavbar && result.hasSidebar) results.summary.pagesWithBoth++;
        if (!result.hasNavbar && !result.hasSidebar) results.summary.pagesWithNone++;
        if (result.hasMobileMenu) results.summary.pagesWithMobileMenu++;
        if (result.hasActivePage) results.summary.pagesWithActivePage++;
        if (result.brokenLinks.length > 0) results.summary.pagesWithBrokenLinks++;
        if (result.hasToggleFunction) results.summary.pagesWithToggleFunction++;

        if (result.issues.length > 0) {
            results.issues.push({
                page: page,
                issues: result.issues
            });
        }
    } else {
        console.warn(`⚠️  Page non trouvée: ${page}`);
    }
});

// Afficher les résultats
console.log('\n📊 RÉSUMÉ DES TESTS DE MENU\n');
console.log('='.repeat(60));
console.log(`Total de pages analysées: ${results.summary.totalPages}`);
console.log(`Pages avec Navbar: ${results.summary.pagesWithNavbar}`);
console.log(`Pages avec Sidebar: ${results.summary.pagesWithSidebar}`);
console.log(`Pages avec les deux: ${results.summary.pagesWithBoth}`);
console.log(`Pages sans menu: ${results.summary.pagesWithNone}`);
console.log(`Pages avec menu mobile: ${results.summary.pagesWithMobileMenu}`);
console.log(`Pages avec fonction toggle: ${results.summary.pagesWithToggleFunction}`);
console.log(`Pages avec page active marquée: ${results.summary.pagesWithActivePage}`);
console.log(`Pages avec liens cassés: ${results.summary.pagesWithBrokenLinks}`);
console.log('='.repeat(60));

if (results.issues.length > 0) {
    console.log('\n⚠️  PROBLÈMES DÉTECTÉS:\n');
    results.issues.forEach(issue => {
        console.log(`📄 ${issue.page}:`);
        issue.issues.forEach(i => {
            console.log(`   - ${i}`);
        });
        console.log('');
    });
} else {
    console.log('\n✅ Aucun problème détecté!\n');
}

// Détails par page
console.log('\n📋 DÉTAILS PAR PAGE:\n');
results.pages.forEach(page => {
    console.log(`📄 ${page.page}:`);
    console.log(`   Navbar: ${page.hasNavbar ? '✓' : '✗'} ${page.navbarType ? `(${page.navbarType})` : ''}`);
    console.log(`   Sidebar: ${page.hasSidebar ? '✓' : '✗'} ${page.sidebarDisabled ? '(désactivée)' : ''}`);
    console.log(`   Menu mobile: ${page.hasMobileMenu ? '✓' : '✗'}`);
    console.log(`   Fonction toggle: ${page.hasToggleFunction ? '✓' : '✗'}`);
    console.log(`   Page active: ${page.hasActivePage ? '✓' : '✗'}`);
    if (page.brokenLinks.length > 0) {
        console.log(`   Liens cassés: ${page.brokenLinks.length}`);
        page.brokenLinks.forEach(link => {
            console.log(`     - ${link}`);
        });
    }
    console.log('');
});

// Écrire les résultats dans un fichier JSON
const outputPath = path.join(__dirname, 'menu-test-results.json');
fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
console.log(`\n💾 Résultats sauvegardés dans: ${outputPath}\n`);

