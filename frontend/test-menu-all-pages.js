/**
 * Script de test pour vérifier la disposition et le fonctionnement du menu
 * sur toutes les pages HTML
 */

// #region agent log
fetch('http://127.0.0.1:7244/ingest/4b4f730e-c02b-49d5-b562-4d5fc3dd49d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'test-menu-all-pages.js:1',message:'Script de test menu démarré',data:{timestamp:new Date().toISOString()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
// #endregion

const MENU_TEST_RESULTS = {
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
        pagesWithBrokenLinks: 0
    }
};

// Liste des pages HTML à tester
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

function testPageMenu(pageName) {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/4b4f730e-c02b-49d5-b562-4d5fc3dd49d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'test-menu-all-pages.js:testPageMenu',message:'Test menu page démarré',data:{pageName},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    const result = {
        page: pageName,
        hasNavbar: false,
        hasSidebar: false,
        hasMobileMenu: false,
        hasActivePage: false,
        brokenLinks: [],
        issues: []
    };

    // Vérifier la présence de navbar
    const navbar = document.querySelector('nav[role="navigation"], nav.bg-white, nav.fixed');
    result.hasNavbar = !!navbar;
    
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/4b4f730e-c02b-49d5-b562-4d5fc3dd49d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'test-menu-all-pages.js:testPageMenu',message:'Navbar détectée',data:{pageName,hasNavbar:result.hasNavbar},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    // Vérifier la présence de sidebar
    const sidebar = document.querySelector('.sidebar, aside.sidebar');
    result.hasSidebar = !!sidebar;
    
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/4b4f730e-c02b-49d5-b562-4d5fc3dd49d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'test-menu-all-pages.js:testPageMenu',message:'Sidebar détectée',data:{pageName,hasSidebar:result.hasSidebar},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    // Vérifier le menu mobile
    const mobileMenuButton = document.querySelector('#mobile-menu-button, .mobile-menu-toggle, button[onclick*="toggleMobileMenu"], button[onclick*="toggleSidebar"]');
    const mobileMenu = document.querySelector('#mobile-menu, .sidebar.open');
    result.hasMobileMenu = !!(mobileMenuButton || mobileMenu);
    
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/4b4f730e-c02b-49d5-b562-4d5fc3dd49d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'test-menu-all-pages.js:testPageMenu',message:'Menu mobile détecté',data:{pageName,hasMobileMenu:result.hasMobileMenu,hasButton:!!mobileMenuButton,hasMenu:!!mobileMenu},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    // Vérifier la page active
    const activeLink = document.querySelector('a[aria-current="page"], a.border-primary-500, .sidebar-nav-item.active');
    result.hasActivePage = !!activeLink;
    
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/4b4f730e-c02b-49d5-b562-4d5fc3dd49d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'test-menu-all-pages.js:testPageMenu',message:'Page active détectée',data:{pageName,hasActivePage:result.hasActivePage},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion

    // Vérifier les liens cassés dans le menu
    const menuLinks = document.querySelectorAll('nav a[href], .sidebar-nav a[href]');
    menuLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && !href.startsWith('#') && !href.startsWith('http')) {
            // Vérifier si le fichier existe (approximation)
            const linkPage = href.split('/').pop();
            if (linkPage && !HTML_PAGES.includes(linkPage) && !linkPage.includes('#')) {
                result.brokenLinks.push({href, text: link.textContent.trim()});
            }
        }
    });
    
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/4b4f730e-c02b-49d5-b562-4d5fc3dd49d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'test-menu-all-pages.js:testPageMenu',message:'Liens vérifiés',data:{pageName,brokenLinksCount:result.brokenLinks.length,brokenLinks:result.brokenLinks},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion

    // Détecter les problèmes
    if (!result.hasNavbar && !result.hasSidebar) {
        result.issues.push('Aucun menu détecté');
    }
    
    if (result.hasNavbar && result.hasSidebar) {
        result.issues.push('Navbar et Sidebar présentes simultanément (conflit possible)');
    }
    
    if (!result.hasMobileMenu) {
        result.issues.push('Menu mobile non détecté');
    }
    
    if (!result.hasActivePage) {
        result.issues.push('Page active non mise en évidence');
    }
    
    if (result.brokenLinks.length > 0) {
        result.issues.push(`${result.brokenLinks.length} lien(s) potentiellement cassé(s)`);
    }

    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/4b4f730e-c02b-49d5-b562-4d5fc3dd49d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'test-menu-all-pages.js:testPageMenu',message:'Résultats page complétés',data:{pageName,issues:result.issues,issuesCount:result.issues.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'ALL'})}).catch(()=>{});
    // #endregion

    return result;
}

function testMobileMenuFunctionality() {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/4b4f730e-c02b-49d5-b562-4d5fc3dd49d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'test-menu-all-pages.js:testMobileMenuFunctionality',message:'Test fonctionnalité menu mobile démarré',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    const results = {
        toggleMobileMenuExists: typeof toggleMobileMenu === 'function',
        toggleSidebarExists: typeof toggleSidebar === 'function',
        mobileMenuButton: null,
        mobileMenu: null,
        sidebar: null,
        canToggle: false
    };

    // Vérifier les fonctions
    const mobileMenuButton = document.querySelector('#mobile-menu-button, .mobile-menu-toggle');
    const mobileMenu = document.querySelector('#mobile-menu');
    const sidebar = document.querySelector('.sidebar');

    results.mobileMenuButton = !!mobileMenuButton;
    results.mobileMenu = !!mobileMenu;
    results.sidebar = !!sidebar;

    // Tester le toggle si possible
    if (mobileMenuButton && (toggleMobileMenu || toggleSidebar)) {
        try {
            const initialState = mobileMenu ? mobileMenu.classList.contains('hidden') : 
                                sidebar ? !sidebar.classList.contains('open') : true;
            
            if (toggleMobileMenu) {
                toggleMobileMenu();
            } else if (toggleSidebar) {
                toggleSidebar();
            }
            
            const afterToggle = mobileMenu ? mobileMenu.classList.contains('hidden') : 
                               sidebar ? !sidebar.classList.contains('open') : true;
            
            results.canToggle = (initialState !== afterToggle);
            
            // Remettre dans l'état initial
            if (toggleMobileMenu) {
                toggleMobileMenu();
            } else if (toggleSidebar) {
                toggleSidebar();
            }
        } catch (e) {
            results.toggleError = e.message;
        }
    }

    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/4b4f730e-c02b-49d5-b562-4d5fc3dd49d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'test-menu-all-pages.js:testMobileMenuFunctionality',message:'Test fonctionnalité menu mobile complété',data:results,timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    return results;
}

function testResponsiveMenu() {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/4b4f730e-c02b-49d5-b562-4d5fc3dd49d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'test-menu-all-pages.js:testResponsiveMenu',message:'Test responsive menu démarré',data:{width:window.innerWidth},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    // #endregion

    const results = {
        currentWidth: window.innerWidth,
        isMobile: window.innerWidth <= 640,
        isTablet: window.innerWidth > 640 && window.innerWidth <= 1024,
        isDesktop: window.innerWidth > 1024,
        navbarVisible: false,
        sidebarVisible: false,
        mobileMenuVisible: false
    };

    const navbar = document.querySelector('nav');
    const sidebar = document.querySelector('.sidebar');
    const mobileMenu = document.querySelector('#mobile-menu');

    if (navbar) {
        const navbarStyle = window.getComputedStyle(navbar);
        results.navbarVisible = navbarStyle.display !== 'none' && navbarStyle.visibility !== 'hidden';
    }

    if (sidebar) {
        const sidebarStyle = window.getComputedStyle(sidebar);
        results.sidebarVisible = sidebarStyle.display !== 'none' && sidebarStyle.visibility !== 'hidden';
    }

    if (mobileMenu) {
        const mobileMenuStyle = window.getComputedStyle(mobileMenu);
        results.mobileMenuVisible = !mobileMenu.classList.contains('hidden') && 
                                   mobileMenuStyle.display !== 'none';
    }

    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/4b4f730e-c02b-49d5-b562-4d5fc3dd49d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'test-menu-all-pages.js:testResponsiveMenu',message:'Test responsive menu complété',data:results,timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    // #endregion

    return results;
}

// Fonction principale de test
function runMenuTests() {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/4b4f730e-c02b-49d5-b562-4d5fc3dd49d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'test-menu-all-pages.js:runMenuTests',message:'Tests menu démarrés',data:{currentPage:window.location.pathname},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'ALL'})}).catch(()=>{});
    // #endregion

    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // Test de la page courante
    const pageResult = testPageMenu(currentPage);
    MENU_TEST_RESULTS.pages.push(pageResult);

    // Test de la fonctionnalité mobile
    const mobileResult = testMobileMenuFunctionality();
    pageResult.mobileFunctionality = mobileResult;

    // Test responsive
    const responsiveResult = testResponsiveMenu();
    pageResult.responsive = responsiveResult;

    // Mise à jour du résumé
    MENU_TEST_RESULTS.summary.totalPages = 1;
    if (pageResult.hasNavbar) MENU_TEST_RESULTS.summary.pagesWithNavbar++;
    if (pageResult.hasSidebar) MENU_TEST_RESULTS.summary.pagesWithSidebar++;
    if (pageResult.hasNavbar && pageResult.hasSidebar) MENU_TEST_RESULTS.summary.pagesWithBoth++;
    if (!pageResult.hasNavbar && !pageResult.hasSidebar) MENU_TEST_RESULTS.summary.pagesWithNone++;
    if (pageResult.hasMobileMenu) MENU_TEST_RESULTS.summary.pagesWithMobileMenu++;
    if (pageResult.hasActivePage) MENU_TEST_RESULTS.summary.pagesWithActivePage++;
    if (pageResult.brokenLinks.length > 0) MENU_TEST_RESULTS.summary.pagesWithBrokenLinks++;

    if (pageResult.issues.length > 0) {
        MENU_TEST_RESULTS.issues.push({
            page: currentPage,
            issues: pageResult.issues
        });
    }

    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/4b4f730e-c02b-49d5-b562-4d5fc3dd49d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'test-menu-all-pages.js:runMenuTests',message:'Tests menu complétés',data:{currentPage,result:pageResult,summary:MENU_TEST_RESULTS.summary},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'ALL'})}).catch(()=>{});
    // #endregion

    // Afficher les résultats dans la console
    console.group('📊 Résultats du test de menu');
    console.log('Page testée:', currentPage);
    console.log('Résultats:', pageResult);
    console.log('Résumé:', MENU_TEST_RESULTS.summary);
    if (MENU_TEST_RESULTS.issues.length > 0) {
        console.warn('⚠️ Problèmes détectés:', MENU_TEST_RESULTS.issues);
    }
    console.groupEnd();

    return MENU_TEST_RESULTS;
}

// Exporter pour utilisation globale
if (typeof window !== 'undefined') {
    window.runMenuTests = runMenuTests;
    window.MENU_TEST_RESULTS = MENU_TEST_RESULTS;
}

// Exécuter automatiquement si le DOM est prêt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(runMenuTests, 1000); // Attendre que les scripts de menu soient chargés
    });
} else {
    setTimeout(runMenuTests, 1000);
}

