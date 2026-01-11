/**
 * Fonction réutilisable pour le menu mobile
 * À inclure dans toutes les pages avec menu mobile
 */

// Fonction pour toggle le menu mobile
function toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    const button = document.getElementById('mobile-menu-button');
    
    if (menu && button) {
        const isHidden = menu.classList.contains('hidden');
        menu.classList.toggle('hidden');
        
        // Mettre à jour l'état ARIA
        button.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
        
        // Changer l'icône
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

// Exporter pour utilisation globale
if (typeof window !== 'undefined') {
    window.toggleMobileMenu = toggleMobileMenu;
}

