/**
 * Menu Moderne - Script réutilisable
 * Ajoute un menu hamburger moderne avec off-canvas à toutes les pages
 */

(function() {
    'use strict';

    // Configuration du menu
    const menuConfig = {
        currentPage: null, // Sera détecté automatiquement
        menuItems: [
            { href: 'home.html', icon: 'fa-home', label: 'Accueil', page: 'home', color: 'blue' },
            { href: 'dashboard.html', icon: 'fa-tachometer-alt', label: 'Dashboard', page: 'dashboard', color: 'emerald' },
            { href: 'rfq.html', icon: 'fa-file-contract', label: 'RFQ', page: 'rfq', color: 'purple' },
            { href: 'devis.html', icon: 'fa-file-invoice-dollar', label: 'Devis', page: 'devis', color: 'orange' },
            { href: 'commandes.html', icon: 'fa-shopping-cart', label: 'Commandes', page: 'commandes', color: 'red' },
            { href: 'factures.html', icon: 'fa-money-bill-wave', label: 'Factures', page: 'factures', color: 'green' },
            { href: 'entreprises.html', icon: 'fa-building', label: 'Entreprises', page: 'entreprises', color: 'yellow' },
            { href: 'produits.html', icon: 'fa-box', label: 'Produits', page: 'produits', color: 'cyan' },
            { href: 'catalogue-fournisseur.html', icon: 'fa-book', label: 'Catalogue', page: 'catalogue', color: 'indigo' },
            { href: 'carte.html', icon: 'fa-map-marked-alt', label: 'Carte', page: 'carte', color: 'pink' }
        ],
        adminItems: [
            { href: 'utilisateurs.html', icon: 'fa-users-cog', label: 'Utilisateurs', page: 'utilisateurs' },
            { href: 'parametres-messagepro.html', icon: 'fa-comments', label: 'Message Pro', page: 'parametres-messagepro' }
        ]
    };

    // Détecter la page actuelle
    function detectCurrentPage() {
        const path = window.location.pathname;
        const filename = path.split('/').pop() || 'index.html';
        const pageName = filename.replace('.html', '');
        
        // Mapping spécial pour certaines pages
        const pageMap = {
            'index': 'home',
            'rfq-create': 'rfq',
            'rfq-detail': 'rfq',
            'devis-create': 'devis',
            'devis-detail': 'devis',
            'devis-compare': 'devis',
            'devis-externe': 'devis',
            'commandes-detail': 'commandes',
            'factures-detail': 'factures',
            'entreprises-detail': 'entreprises',
            'produits-fournisseur': 'produits',
            'fournisseur-rfq': 'rfq',
            'demandes-devis': 'rfq',
            'bons-livraison-detail': 'commandes'
        };
        
        return pageMap[pageName] || pageName;
    }

    // Générer le HTML du menu
    function generateMenuHTML() {
        const currentPage = detectCurrentPage();
        menuConfig.currentPage = currentPage;
        
        const menuItemsHTML = menuConfig.menuItems.map(item => {
            const isActive = item.page === currentPage ? 'active' : '';
            const colorClasses = {
                blue: 'bg-blue-100 text-blue-600',
                emerald: 'bg-emerald-100 text-emerald-600',
                purple: 'bg-purple-100 text-purple-600',
                orange: 'bg-orange-100 text-orange-600',
                red: 'bg-red-100 text-red-600',
                green: 'bg-green-100 text-green-600',
                yellow: 'bg-yellow-100 text-yellow-600',
                cyan: 'bg-cyan-100 text-cyan-600',
                indigo: 'bg-indigo-100 text-indigo-600',
                pink: 'bg-pink-100 text-pink-600'
            };
            
            return `
                <a href="${item.href}" class="modern-menu-item ${isActive}" data-page="${item.page}">
                    <div class="modern-menu-icon ${colorClasses[item.color]}"><i class="fas ${item.icon}"></i></div>
                    <span>${item.label}</span>
                </a>
            `;
        }).join('');

        const adminItemsHTML = menuConfig.adminItems.map(item => {
            return `
                <a href="${item.href}" class="modern-menu-item" data-page="${item.page}">
                    <div class="modern-menu-icon bg-slate-100 text-slate-600"><i class="fas ${item.icon}"></i></div>
                    <span>${item.label}</span>
                </a>
            `;
        }).join('');

        return `
            <!-- Menu Moderne avec Hamburger -->
            <button id="modern-menu-toggle" class="fixed top-4 left-4 z-[2000] w-14 h-14 bg-brand-600 hover:bg-brand-700 rounded-2xl shadow-2xl shadow-brand-600/30 flex items-center justify-center text-white transition-all duration-300 hover:scale-110 hover:shadow-brand-600/50 group" aria-label="Ouvrir le menu" title="Menu">
                <i class="fas fa-bars text-xl group-hover:rotate-90 transition-transform duration-300"></i>
            </button>

            <!-- Overlay sombre -->
            <div id="modern-menu-overlay" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1998] transition-all duration-300" style="opacity: 0; visibility: hidden; pointer-events: none;" onclick="closeModernMenu()"></div>

            <!-- Menu latéral moderne -->
            <aside id="modern-menu" class="fixed top-0 left-0 h-full w-80 bg-white/95 backdrop-blur-xl shadow-2xl z-[1999] transform -translate-x-full transition-transform duration-300 ease-out overflow-y-auto">
                <!-- Header du menu -->
                <div class="sticky top-0 bg-gradient-to-r from-brand-600 to-brand-700 p-6 shadow-lg z-10">
                    <div class="flex items-center justify-between mb-6">
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white shadow-lg">
                                <i class="fas fa-cube text-xl"></i>
                            </div>
                            <div>
                                <h2 class="text-xl font-bold text-white">Sily<span class="text-brand-200">Procure</span></h2>
                                <p class="text-xs text-brand-200">Menu de navigation</p>
                            </div>
                        </div>
                        <button onclick="closeModernMenu()" class="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center text-white transition-all duration-200 hover:rotate-90" aria-label="Fermer le menu">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <!-- Info utilisateur -->
                    <div class="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                        <div class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-sm" id="user-avatar-menu">U</div>
                        <div class="flex-1 min-w-0">
                            <p class="text-sm font-semibold text-white truncate" id="user-name-menu">Utilisateur</p>
                            <p class="text-xs text-brand-200 truncate" id="user-email-menu">email@example.com</p>
                        </div>
                    </div>
                </div>

                <!-- Navigation -->
                <nav class="p-4 space-y-2" role="navigation" aria-label="Menu principal">
                    ${menuItemsHTML}
                    
                    <!-- Section Admin (cachée par défaut) -->
                    <div id="admin-menu-section" class="hidden pt-4 border-t border-slate-200 mt-4">
                        <p class="text-xs font-bold text-slate-400 uppercase tracking-wider px-4 mb-2">Administration</p>
                        ${adminItemsHTML}
                    </div>
                </nav>

                <!-- Footer du menu -->
                <div class="sticky bottom-0 bg-slate-50 border-t border-slate-200 p-4">
                    <button onclick="logout()" class="w-full flex items-center gap-3 px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-semibold transition-all duration-200 hover:scale-[1.02]">
                        <i class="fas fa-sign-out-alt"></i>
                        <span>Déconnexion</span>
                    </button>
                </div>
            </aside>
        `;
    }

    // Ajouter les styles CSS nécessaires
    function addMenuStyles() {
        if (document.getElementById('modern-menu-styles')) return;

        const style = document.createElement('style');
        style.id = 'modern-menu-styles';
        style.textContent = `
            /* Styles pour le menu moderne */
            .modern-menu-item {
                display: flex;
                align-items: center;
                gap: 1rem;
                padding: 0.875rem 1rem;
                border-radius: 0.75rem;
                color: #475569;
                font-weight: 500;
                transition: all 0.2s ease;
                text-decoration: none;
                position: relative;
            }
            
            .modern-menu-item:hover {
                background: linear-gradient(90deg, #f0f7ff 0%, #e0e7ff 100%);
                color: #2563eb;
                transform: translateX(4px);
            }
            
            .modern-menu-item.active {
                background: linear-gradient(90deg, #dbeafe 0%, #bfdbfe 100%);
                color: #2563eb;
                font-weight: 600;
            }
            
            .modern-menu-item.active::before {
                content: '';
                position: absolute;
                left: 0;
                top: 50%;
                transform: translateY(-50%);
                width: 4px;
                height: 60%;
                background: #2563eb;
                border-radius: 0 4px 4px 0;
            }
            
            .modern-menu-icon {
                width: 2.5rem;
                height: 2.5rem;
                border-radius: 0.75rem;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.125rem;
                flex-shrink: 0;
                transition: all 0.2s ease;
            }
            
            .modern-menu-item:hover .modern-menu-icon {
                transform: scale(1.1);
            }
            
            /* Animation du menu */
            #modern-menu.open {
                transform: translateX(0) !important;
            }
            
            /* Overlay - état par défaut (caché) */
            #modern-menu-overlay {
                opacity: 0 !important;
                visibility: hidden !important;
                pointer-events: none !important;
            }
            
            /* Overlay - état actif (visible) */
            #modern-menu-overlay.active {
                opacity: 1 !important;
                visibility: visible !important;
                pointer-events: auto !important;
            }
            
            /* Assurer que le body n'a pas de margin-left pour le menu */
            body {
                margin-left: 0 !important;
            }
            
            /* Main content sans margin pour le nouveau menu */
            .main-content, main {
                margin-left: 0 !important;
                width: 100% !important;
                transition: margin-left 0.3s ease !important;
            }
            
            /* Masquer l'ancienne navbar horizontale (redondante avec le menu moderne) */
            nav[aria-label="Navigation principale"],
            nav[role="navigation"][aria-label="Navigation principale"],
            nav.bg-white.border-b-2.border-blue-100 {
                display: none !important;
            }
            
            /* Masquer aussi la navbar si elle contient "Menu de navigation" dans un nav parent */
            nav[aria-label="Navigation principale"] nav[aria-label="Menu de navigation"],
            nav[aria-label="Menu de navigation"] {
                display: none !important;
            }
        `;
        document.head.appendChild(style);
    }

    // Fonctions de gestion du menu
    window.openModernMenu = function() {
        console.log('🟢 openModernMenu appelé');
        
        const menu = document.getElementById('modern-menu');
        const overlay = document.getElementById('modern-menu-overlay');
        const toggle = document.getElementById('modern-menu-toggle');
        
        console.log('🔍 Éléments trouvés:', { 
            menu: !!menu, 
            overlay: !!overlay, 
            toggle: !!toggle,
            menuElement: menu,
            overlayElement: overlay
        });
        
        if (menu && overlay) {
            console.log('✅ Éléments trouvés, ouverture du menu...');
            
            // Ajouter les classes
            menu.classList.add('open');
            overlay.classList.add('active');
            
            // Forcer les styles inline pour s'assurer que l'overlay est visible
            overlay.style.opacity = '1';
            overlay.style.visibility = 'visible';
            overlay.style.pointerEvents = 'auto';
            overlay.style.display = 'block';
            document.body.style.overflow = 'hidden';
            
            if (toggle) {
                toggle.style.transform = 'rotate(90deg)';
            }
            
            // Vérifier les styles après application
            setTimeout(() => {
                const overlayStyle = window.getComputedStyle(overlay);
                const menuStyle = window.getComputedStyle(menu);
                console.log('📊 Styles après ouverture:', {
                    overlayClasses: overlay.className,
                    menuClasses: menu.className,
                    overlayOpacity: overlayStyle.opacity,
                    overlayVisibility: overlayStyle.visibility,
                    overlayDisplay: overlayStyle.display,
                    overlayZIndex: overlayStyle.zIndex,
                    menuTransform: menuStyle.transform,
                    overlayHasActive: overlay.classList.contains('active'),
                    menuHasOpen: menu.classList.contains('open'),
                    overlayInlineOpacity: overlay.style.opacity,
                    overlayInlineVisibility: overlay.style.visibility
                });
            }, 100);
        } else {
            console.error('❌ Menu ou overlay non trouvé:', { 
                menu: !!menu, 
                overlay: !!overlay,
                allModernMenuElements: document.querySelectorAll('[id*="modern-menu"]').length
            });
        }
    };

    window.closeModernMenu = function() {
        const menu = document.getElementById('modern-menu');
        const overlay = document.getElementById('modern-menu-overlay');
        const toggle = document.getElementById('modern-menu-toggle');
        
        if (menu && overlay) {
            menu.classList.remove('open');
            overlay.classList.remove('active');
            // Réinitialiser les styles inline
            overlay.style.opacity = '';
            overlay.style.visibility = '';
            overlay.style.pointerEvents = '';
            document.body.style.overflow = '';
            if (toggle) {
                toggle.style.transform = 'rotate(0deg)';
            }
        }
    };

    // Mettre à jour les infos utilisateur
    function updateMenuUserInfo() {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const avatarEl = document.getElementById('user-avatar-menu');
            const nameEl = document.getElementById('user-name-menu');
            const emailEl = document.getElementById('user-email-menu');
            
            if (avatarEl && user.nom) {
                const initial = (user.prenom?.[0] || user.nom[0] || 'U').toUpperCase();
                avatarEl.textContent = initial;
            }
            
            if (nameEl && user.nom) {
                nameEl.textContent = `${user.prenom || ''} ${user.nom}`.trim() || user.email || 'Utilisateur';
            }
            
            if (emailEl && user.email) {
                emailEl.textContent = user.email;
            }
        } catch (error) {
            console.warn('Erreur mise à jour infos utilisateur menu:', error);
        }
    }

    // Vérifier si l'utilisateur est admin
    function checkAdminStatus() {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const adminSection = document.getElementById('admin-menu-section');
            
            if (adminSection && (user.role === 'admin' || user.is_admin)) {
                adminSection.classList.remove('hidden');
            }
        } catch (error) {
            console.warn('Erreur vérification admin:', error);
        }
    }

    // Initialiser le menu
    function initModernMenu() {
        console.log('🔧 initModernMenu appelé');
        
        // Vérifier si le menu ou l'overlay existe déjà (éviter les doublons)
        if (document.getElementById('modern-menu') || 
            document.getElementById('modern-menu-overlay') || 
            document.getElementById('modern-menu-toggle')) {
            console.debug('Menu moderne déjà présent, initialisation ignorée');
            return;
        }

        // Ajouter les styles (vérifie aussi en interne)
        addMenuStyles();

        // Ajouter le HTML du menu
        const menuHTML = generateMenuHTML();
        document.body.insertAdjacentHTML('afterbegin', menuHTML);
        
        console.log('✅ Menu HTML ajouté au DOM');

        // Gérer le bouton toggle
        const menuToggle = document.getElementById('modern-menu-toggle');
        if (menuToggle) {
            console.log('✅ Bouton toggle trouvé, ajout de l\'event listener');
            menuToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                console.log('🖱️ Clic sur le bouton toggle');
                const menu = document.getElementById('modern-menu');
                if (menu && menu.classList.contains('open')) {
                    console.log('📂 Menu ouvert, fermeture...');
                    closeModernMenu();
                } else {
                    console.log('📁 Menu fermé, ouverture...');
                    openModernMenu();
                }
            });
        } else {
            console.error('❌ Bouton toggle non trouvé après création du menu');
        }

        // Fermer avec ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeModernMenu();
            }
        });

        // Mettre à jour les infos utilisateur
        updateMenuUserInfo();
        checkAdminStatus();

        // Mettre à jour périodiquement (au cas où l'utilisateur change)
        setInterval(() => {
            updateMenuUserInfo();
            checkAdminStatus();
        }, 5000);
    }

    // Initialiser quand le DOM est prêt (une seule fois)
    if (!window._modernMenuInitialized) {
        window._modernMenuInitialized = true;
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initModernMenu);
        } else {
            initModernMenu();
        }
    } else {
        console.debug('Menu moderne déjà initialisé, nouvelle tentative ignorée');
    }

    // Exposer la fonction de mise à jour pour utilisation externe
    window.updateModernMenuUserInfo = updateMenuUserInfo;
    window.checkModernMenuAdminStatus = checkAdminStatus;

})();

