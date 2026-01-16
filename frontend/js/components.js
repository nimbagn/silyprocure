// Composants réutilisables
// NOTE: certaines pages incluaient `components.js` plusieurs fois, ce qui provoquait:
// "Identifier 'Toast' has already been declared".
// On encapsule donc les déclarations dans une IIFE pour éviter toute redéclaration globale.

(() => {
    if (window.Toast && window.Modal && window.confirmAction && window.showLoading && window.hideLoading) {
        return;
    }

// Système de notifications Toast
class Toast {
    static show(message, type = 'info', duration = 5000) {
        const container = document.getElementById('toast-container') || this.createContainer();
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: '<i class="fas fa-check-circle"></i>',
            error: '<i class="fas fa-times-circle"></i>',
            warning: '<i class="fas fa-exclamation-triangle"></i>',
            info: '<i class="fas fa-info-circle"></i>'
        };
        
        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || icons.info}</span>
            <span class="toast-message">${message}</span>
            <button class="toast-close" onclick="this.parentElement.remove()">×</button>
        `;
        
        container.appendChild(toast);
        
        // Auto remove
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
    
    static createContainer() {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
        return container;
    }
    
    static success(message) {
        this.show(message, 'success');
    }
    
    static error(message) {
        this.show(message, 'error');
    }
    
    static warning(message) {
        this.show(message, 'warning');
    }
    
    static info(message) {
        this.show(message, 'info');
    }
}

// Système de modales
class Modal {
    constructor(id, title, content, footer = null) {
        this.id = id;
        this.title = title;
        this.content = content;
        this.footer = footer;
    }
    
    show() {
        // Supprimer toute modale existante avec le même ID
        const existing = document.getElementById(`modal-${this.id}`);
        if (existing) {
            existing.remove();
        }
        
        // Fermer toutes les autres modales pour éviter les conflits
        const allModals = document.querySelectorAll('.modal-overlay');
        allModals.forEach(modal => {
            if (modal.id !== `modal-${this.id}`) {
                modal.remove();
            }
        });
        
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.id = `modal-${this.id}`;
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-labelledby', `modal-title-${this.id}`);
        overlay.setAttribute('aria-modal', 'true');
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                Modal.hide(this.id);
            }
        };
        
        overlay.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h2 class="modal-title" id="modal-title-${this.id}">${this.title}</h2>
                    <button class="modal-close" onclick="Modal.hide('${this.id}')" aria-label="Fermer">×</button>
                </div>
                <div class="modal-body">
                    ${this.content}
                </div>
                ${this.footer ? `<div class="modal-footer">${this.footer}</div>` : ''}
            </div>
        `;
        
        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';
        
        // Animation d'entrée
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
            overlay.style.opacity = '1';
        }, 10);
        
        // Focus sur le premier input ou le bouton de fermeture
        const firstInput = overlay.querySelector('input, textarea, select, button');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
        
        // Gérer la fermeture avec Escape
        const escapeHandler = (e) => {
            if (e.key === 'Escape' && document.getElementById(`modal-${this.id}`)) {
                Modal.hide(this.id);
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    }
    
    static hide(id) {
        const overlay = document.getElementById(`modal-${id}`);
        if (overlay) {
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 0.3s ease';
            setTimeout(() => {
                overlay.remove();
                // Si c'était la dernière modale, réinitialiser overflow
                if (!document.querySelector('.modal-overlay')) {
                    document.body.style.overflow = '';
                }
            }, 300);
        }
    }
}

// Confirmation dialog
function confirmAction(message, onConfirm, onCancel = null) {
    // Créer des IDs uniques pour les callbacks
    const confirmId = `confirm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const cancelId = `cancel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Stocker les callbacks globalement
    window[confirmId] = () => {
        Modal.hide('confirm');
        if (onConfirm) {
            onConfirm();
        }
    };
    
    if (onCancel) {
        window[cancelId] = () => {
            Modal.hide('confirm');
            onCancel();
        };
    }
    
    const cancelButton = onCancel 
        ? `<button class="btn btn-secondary" onclick="window['${cancelId}']()">Annuler</button>`
        : `<button class="btn btn-secondary" onclick="Modal.hide('confirm')">Annuler</button>`;
    
    const modal = new Modal(
        'confirm',
        'Confirmation',
        `<p>${message}</p>`,
        `
            ${cancelButton}
            <button class="btn btn-danger" onclick="window['${confirmId}']()">Confirmer</button>
        `
    );
    modal.show();
    
    // Nettoyer les callbacks après fermeture de la modale
    setTimeout(() => {
        delete window[confirmId];
        if (onCancel) {
            delete window[cancelId];
        }
    }, 10000); // Nettoyer après 10 secondes
}

// Loading overlay
function showLoading(message = 'Chargement...') {
    const overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <div class="modal" style="max-width: 300px; text-align: center;">
            <div class="loading-spinner" style="margin: 0 auto 1rem;"></div>
            <p>${message}</p>
        </div>
    `;
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
}

function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.remove();
        document.body.style.overflow = '';
    }
}

// Export pour utilisation globale
window.Toast = Toast;
window.Modal = Modal;
window.confirmAction = confirmAction;
window.showLoading = showLoading;
window.hideLoading = hideLoading;

})();
