// Sidebar Navigation Component - Style Hapag-Lloyd
// Pour désactiver la sidebar, ajoutez: <script>window.DISABLE_SIDEBAR = true;</script> avant ce script

function initSidebar() {
    // Vérifier si la sidebar est désactivée
    if (window.DISABLE_SIDEBAR === true) {
        return;
    }
    // Créer la sidebar si elle n'existe pas
    if (!document.querySelector('.sidebar')) {
        const sidebar = document.createElement('aside');
        sidebar.className = 'sidebar';
        sidebar.setAttribute('role', 'navigation');
        sidebar.setAttribute('aria-label', 'Navigation principale');
        sidebar.innerHTML = `
            <div class="sidebar-header">
                <div class="sidebar-logo">SilyProcure</div>
                <button class="sidebar-close" onclick="closeSidebar()" aria-label="Fermer le menu" title="Fermer le menu">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <nav class="sidebar-nav" role="navigation" aria-label="Menu de navigation">
                <a href="home.html" class="sidebar-nav-item" data-page="home" aria-label="Aller à la page d'accueil">
                    <span class="sidebar-nav-item-icon" aria-hidden="true"><i class="fas fa-home"></i></span>
                    <span>Accueil</span>
                </a>
                <a href="dashboard.html" class="sidebar-nav-item" data-page="dashboard" aria-label="Aller au tableau de bord">
                    <span class="sidebar-nav-item-icon" aria-hidden="true"><i class="fas fa-tachometer-alt"></i></span>
                    <span>Dashboard</span>
                </a>
                <a href="demandes-devis.html" class="sidebar-nav-item" data-page="demandes-devis" aria-label="Voir les demandes de devis">
                    <span class="sidebar-nav-item-icon" aria-hidden="true"><i class="fas fa-inbox"></i></span>
                    <span>Demandes Devis</span>
                </a>
                <a href="clients.html" class="sidebar-nav-item" data-page="clients" aria-label="Voir les clients">
                    <span class="sidebar-nav-item-icon" aria-hidden="true"><i class="fas fa-users"></i></span>
                    <span>Clients</span>
                </a>
                <a href="rfq.html" class="sidebar-nav-item" data-page="rfq" aria-label="Voir les RFQ">
                    <span class="sidebar-nav-item-icon" aria-hidden="true"><i class="fas fa-file-alt"></i></span>
                    <span>RFQ</span>
                </a>
                <a href="devis.html" class="sidebar-nav-item" data-page="devis" aria-label="Voir les devis">
                    <span class="sidebar-nav-item-icon" aria-hidden="true"><i class="fas fa-briefcase"></i></span>
                    <span>Devis</span>
                </a>
                <a href="commandes.html" class="sidebar-nav-item" data-page="commandes" aria-label="Voir les commandes">
                    <span class="sidebar-nav-item-icon" aria-hidden="true"><i class="fas fa-box"></i></span>
                    <span>Commandes</span>
                </a>
                <a href="factures.html" class="sidebar-nav-item" data-page="factures" aria-label="Voir les factures">
                    <span class="sidebar-nav-item-icon" aria-hidden="true"><i class="fas fa-money-bill-wave"></i></span>
                    <span>Factures</span>
                </a>
                <a href="entreprises.html" class="sidebar-nav-item" data-page="entreprises" aria-label="Voir les entreprises">
                    <span class="sidebar-nav-item-icon" aria-hidden="true"><i class="fas fa-building"></i></span>
                    <span>Entreprises</span>
                </a>
                <a href="produits.html" class="sidebar-nav-item" data-page="produits" aria-label="Voir les produits">
                    <span class="sidebar-nav-item-icon" aria-hidden="true"><i class="fas fa-box"></i></span>
                    <span>Produits</span>
                </a>
                <a href="catalogue-fournisseur.html" class="sidebar-nav-item" data-page="catalogue" aria-label="Voir le catalogue">
                    <span class="sidebar-nav-item-icon" aria-hidden="true">📚</span>
                    <span>Catalogue</span>
                </a>
                <a href="carte.html" class="sidebar-nav-item" data-page="carte" aria-label="Voir la carte">
                    <span class="sidebar-nav-item-icon" aria-hidden="true"><i class="fas fa-map"></i></span>
                    <span>Carte</span>
                </a>
                <div id="admin-menu-section" style="display: none;">
                    <div class="sidebar-nav-divider"></div>
                    <a href="utilisateurs.html" class="sidebar-nav-item" data-page="utilisateurs" aria-label="Gérer les utilisateurs">
                        <span class="sidebar-nav-item-icon" aria-hidden="true"><i class="fas fa-users-cog"></i></span>
                        <span>Utilisateurs</span>
                    </a>
                </div>
            </nav>
        `;
        document.body.insertBefore(sidebar, document.body.firstChild);
        document.body.classList.add('has-sidebar');
    }

    // Créer l'overlay pour fermeture automatique
    if (!document.querySelector('.sidebar-overlay')) {
        const overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        overlay.setAttribute('role', 'button');
        overlay.setAttribute('aria-label', 'Fermer le menu');
        overlay.setAttribute('tabindex', '-1');
        overlay.addEventListener('click', closeSidebar);
        document.body.appendChild(overlay);
    }

    // Créer le conteneur principal si il n'existe pas
    if (!document.querySelector('.main-content')) {
        const mainContent = document.createElement('div');
        mainContent.className = 'main-content';
        
        // Créer le header supérieur dans main-content
        if (!document.querySelector('.top-header')) {
            const topHeader = document.createElement('header');
            topHeader.className = 'top-header';
            topHeader.innerHTML = `
                <div class="top-header-left">
                    <button class="mobile-menu-toggle" onclick="toggleSidebar()" aria-label="Ouvrir le menu" aria-expanded="false" aria-controls="sidebar">
                        <i class="fas fa-bars" aria-hidden="true"></i>
                        <span class="sr-only">Menu</span>
                    </button>
                </div>
                <div class="top-header-right">
                    <div class="user-menu" onclick="toggleUserMenu()">
                        <div class="user-avatar" id="user-avatar" aria-hidden="true">U</div>
                        <span id="user-name-header"></span>
                        <button onclick="logout()" style="background: none; border: none; color: var(--color-primary); cursor: pointer; padding: 0.5rem 1rem; border-radius: 6px; margin-left: 0.5rem;" aria-label="Se déconnecter">Déconnexion</button>
                    </div>
                </div>
            `;
            mainContent.appendChild(topHeader);
        }
        
        // Déplacer tous les éléments sauf sidebar dans main-content
        const elementsToMove = Array.from(document.body.children).filter(el => 
            !el.classList.contains('sidebar') && 
            !el.classList.contains('main-content') &&
            !el.classList.contains('sidebar-overlay')
        );
        
        // Si on a déjà un .container, on le garde dans main-content
        const existingContainer = document.querySelector('.container');
        if (existingContainer && elementsToMove.includes(existingContainer)) {
            mainContent.appendChild(existingContainer);
            // Retirer le container de la liste à déplacer
            const index = elementsToMove.indexOf(existingContainer);
            if (index > -1) elementsToMove.splice(index, 1);
        }
        
        // Déplacer les autres éléments (scripts, etc.) sauf ceux qui doivent rester
        elementsToMove.forEach(el => {
            // Ne pas déplacer les scripts qui doivent rester à la fin
            if (el.tagName === 'SCRIPT') {
                return; // Ne pas déplacer les scripts
            }
            // Ne pas déplacer le top-header s'il existe déjà
            if (el.classList.contains('top-header')) {
                return;
            }
            mainContent.appendChild(el);
        });
        
        document.body.appendChild(mainContent);
    } else {
        // Si main-content existe déjà, s'assurer que top-header est dedans
        const mainContent = document.querySelector('.main-content');
        const existingTopHeader = document.querySelector('.top-header');
        if (!existingTopHeader && mainContent) {
            const topHeader = document.createElement('header');
            topHeader.className = 'top-header';
            topHeader.innerHTML = `
                <div class="top-header-left">
                    <button class="mobile-menu-toggle" onclick="toggleSidebar()" aria-label="Ouvrir le menu" aria-expanded="false" aria-controls="sidebar">
                        <i class="fas fa-bars" aria-hidden="true"></i>
                        <span class="sr-only">Menu</span>
                    </button>
                </div>
                <div class="top-header-right">
                    <div class="user-menu" onclick="toggleUserMenu()">
                        <div class="user-avatar" id="user-avatar" aria-hidden="true">U</div>
                        <span id="user-name-header"></span>
                        <button onclick="logout()" style="background: none; border: none; color: var(--color-primary); cursor: pointer; padding: 0.5rem 1rem; border-radius: 6px; margin-left: 0.5rem;" aria-label="Se déconnecter">Déconnexion</button>
                    </div>
                </div>
            `;
            mainContent.insertBefore(topHeader, mainContent.firstChild);
        } else if (existingTopHeader && !mainContent.contains(existingTopHeader)) {
            // Si top-header existe mais n'est pas dans main-content, le déplacer
            mainContent.insertBefore(existingTopHeader, mainContent.firstChild);
        }
    }

    // Marquer la page active
    let currentPage = window.location.pathname.split('/').pop().replace('.html', '') || 'dashboard';
    
    // Mapping des pages spéciales
    const pageMapping = {
        'rfq-create': 'rfq',
        'rfq-detail': 'rfq',
        'devis-create': 'devis',
        'devis-detail': 'devis',
        'devis-compare': 'devis',
        'entreprises-detail': 'entreprises',
        'produits-fournisseur': 'produits',
        'catalogue-fournisseur': 'catalogue',
        'fournisseur-rfq': 'rfq'
    };
    
    if (pageMapping[currentPage]) {
        currentPage = pageMapping[currentPage];
    }
    
    const activeItem = document.querySelector(`.sidebar-nav-item[data-page="${currentPage}"]`);
    if (activeItem) {
        activeItem.classList.add('active');
    }

    // Mettre à jour le nom d'utilisateur
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userName = `${user.prenom || ''} ${user.nom || ''}`.trim() || user.email || 'Utilisateur';
    const userNameHeader = document.getElementById('user-name-header');
    if (userNameHeader) {
        userNameHeader.textContent = userName;
    }
    
    // Mettre à jour l'avatar
    const userAvatar = document.getElementById('user-avatar');
    if (userAvatar) {
        const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
        userAvatar.textContent = initials || 'U';
    }

    // Afficher le menu admin seulement si l'utilisateur est admin
    const adminMenuSection = document.getElementById('admin-menu-section');
    if (adminMenuSection && user.role === 'admin') {
        adminMenuSection.style.display = 'block';
    }

    // Responsive: toggle sidebar sur mobile/tablette
    updateSidebarVisibility();
    
    // Fermer automatiquement au clic sur un lien (mobile)
    const navItems = document.querySelectorAll('.sidebar-nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            if (isMobileOrTablet()) {
                closeSidebar();
            }
        });
    });
}

function isMobileOrTablet() {
    return window.innerWidth <= 1024 || (window.innerWidth <= 1366 && window.matchMedia('(orientation: portrait)').matches);
}

function updateSidebarVisibility() {
    if (window.DISABLE_SIDEBAR === true) {
        return;
    }
    
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (isMobileOrTablet()) {
        if (mobileMenuToggle) {
            mobileMenuToggle.style.display = 'flex';
            mobileMenuToggle.setAttribute('aria-hidden', 'false');
        }
        if (sidebar) {
            sidebar.classList.remove('open');
        }
    } else {
        if (mobileMenuToggle) {
            mobileMenuToggle.style.display = 'none';
            mobileMenuToggle.setAttribute('aria-hidden', 'true');
        }
        if (sidebar) {
            sidebar.classList.remove('open');
        }
    }
}

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    const toggle = document.querySelector('.mobile-menu-toggle');
    
    if (!sidebar) return;
    
    const isOpen = sidebar.classList.contains('open');
    
    if (isOpen) {
        closeSidebar();
    } else {
        openSidebar();
    }
}

function openSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    const toggle = document.querySelector('.mobile-menu-toggle');
    const body = document.body;
    
    if (!sidebar) return;
    
    sidebar.classList.add('open');
    if (overlay) {
        overlay.classList.add('active');
    }
    if (toggle) {
        toggle.setAttribute('aria-expanded', 'true');
    }
    body.classList.add('sidebar-open');
    
    // Empêcher le scroll du body quand le menu est ouvert
    body.style.overflow = 'hidden';
}

function closeSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    const toggle = document.querySelector('.mobile-menu-toggle');
    const body = document.body;
    
    if (!sidebar) return;
    
    sidebar.classList.remove('open');
    if (overlay) {
        overlay.classList.remove('active');
    }
    if (toggle) {
        toggle.setAttribute('aria-expanded', 'false');
    }
    body.classList.remove('sidebar-open');
    
    // Réactiver le scroll du body
    body.style.overflow = '';
    
    // Retirer le focus du toggle pour éviter la réouverture accidentelle
    if (toggle && document.activeElement === toggle) {
        toggle.blur();
    }
}

function toggleUserMenu() {
    // Implémenter le menu utilisateur si nécessaire
}

// Gestion du clavier (ESC pour fermer)
document.addEventListener('keydown', (e) => {
    if (window.DISABLE_SIDEBAR === true) {
        return;
    }
    
    if (e.key === 'Escape') {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar && sidebar.classList.contains('open')) {
            closeSidebar();
        }
    }
});

// Initialiser au chargement
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSidebar);
} else {
    initSidebar();
}

// Gérer le responsive avec debounce pour performance
let resizeTimeout;
window.addEventListener('resize', () => {
    if (window.DISABLE_SIDEBAR === true) {
        return;
    }
    
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        updateSidebarVisibility();
        
        // Fermer le menu si on passe en mode desktop
        if (!isMobileOrTablet()) {
            closeSidebar();
        }
    }, 150);
});

// Gérer les changements d'orientation
window.addEventListener('orientationchange', () => {
    if (window.DISABLE_SIDEBAR === true) {
        return;
        }
    
    // Attendre que l'orientation change complètement
    setTimeout(() => {
        updateSidebarVisibility();
        
        // Fermer le menu lors du changement d'orientation
        closeSidebar();
    }, 200);
});

