// Système de notifications
class NotificationsManager {
    constructor() {
        this.unreadCount = 0;
        this.checkInterval = null;
        this.init();
    }

    init() {
        // Créer le conteneur de notifications dans le header
        this.createNotificationBadge();
        // Charger le nombre de notifications non lues
        this.loadUnreadCount();
        // Vérifier périodiquement les nouvelles notifications
        this.startPolling();
    }

    createNotificationBadge() {
        const userInfo = document.querySelector('.user-info');
        if (!userInfo) return;

        // Vérifier si le badge existe déjà
        if (document.getElementById('notifications-badge')) return;

        const notificationContainer = document.createElement('div');
        notificationContainer.id = 'notifications-container';
        notificationContainer.style.cssText = 'position: relative; margin-right: 1rem;';
        
        const notificationButton = document.createElement('button');
        notificationButton.id = 'notifications-button';
        notificationButton.className = 'btn btn-secondary';
        notificationButton.style.cssText = 'position: relative; padding: 0.5rem 1rem;';
        notificationButton.innerHTML = '<i class="fas fa-bell"></i>';
        notificationButton.onclick = () => this.toggleNotificationsDropdown();

        const badge = document.createElement('span');
        badge.id = 'notifications-badge';
        badge.style.cssText = `
            position: absolute;
            top: -5px;
            right: -5px;
            background: var(--color-danger, #ef4444);
            color: white;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.75rem;
            font-weight: bold;
            display: none;
        `;
        badge.textContent = '0';

        notificationButton.appendChild(badge);
        notificationContainer.appendChild(notificationButton);
        userInfo.insertBefore(notificationContainer, userInfo.firstChild);
    }

    async loadUnreadCount() {
        try {
            const response = await apiCall('/api/notifications/unread-count');
            if (response && response.ok) {
                const data = await response.json();
                this.unreadCount = data.count || 0;
                this.updateBadge();
            }
        } catch (error) {
            console.error('Erreur chargement notifications:', error);
        }
    }

    updateBadge() {
        const badge = document.getElementById('notifications-badge');
        if (!badge) return;

        if (this.unreadCount > 0) {
            badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }

    async toggleNotificationsDropdown() {
        let dropdown = document.getElementById('notifications-dropdown');
        if (dropdown) {
            dropdown.remove();
            return;
        }

        // Créer le dropdown
        const container = document.getElementById('notifications-container');
        dropdown = document.createElement('div');
        dropdown.id = 'notifications-dropdown';
        dropdown.style.cssText = `
            position: absolute;
            top: 100%;
            right: 0;
            width: 400px;
            max-height: 500px;
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            z-index: 1000;
            overflow: hidden;
            margin-top: 0.5rem;
        `;

        // En-tête
        const header = document.createElement('div');
        header.style.cssText = 'padding: 1rem; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;';
        header.innerHTML = `
            <h3 style="margin: 0; font-size: 1.1rem;"><i class="fas fa-bell"></i> Notifications</h3>
            <button onclick="notificationsManager.markAllAsRead()" class="btn btn-sm btn-secondary" style="padding: 0.25rem 0.5rem;">
                Tout marquer comme lu
            </button>
        `;
        dropdown.appendChild(header);

        // Liste des notifications
        const list = document.createElement('div');
        list.id = 'notifications-list';
        list.style.cssText = 'max-height: 400px; overflow-y: auto;';
        list.innerHTML = '<div class="loading" style="padding: 2rem; text-align: center;">Chargement...</div>';
        dropdown.appendChild(list);

        container.appendChild(dropdown);

        // Charger les notifications
        await this.loadNotifications(list);

        // Fermer en cliquant à l'extérieur
        setTimeout(() => {
            document.addEventListener('click', (e) => {
                if (!container.contains(e.target)) {
                    dropdown.remove();
                }
            }, { once: true });
        }, 100);
    }

    async loadNotifications(container) {
        try {
            const response = await apiCall('/api/notifications?limit=20');
            if (response && response.ok) {
                const notifications = await response.json();
                this.renderNotifications(container, notifications);
            } else {
                container.innerHTML = '<div style="padding: 2rem; text-align: center; color: #666;">Erreur lors du chargement</div>';
            }
        } catch (error) {
            console.error('Erreur:', error);
            container.innerHTML = '<div style="padding: 2rem; text-align: center; color: #666;">Erreur de connexion</div>';
        }
    }

    renderNotifications(container, notifications) {
        if (notifications.length === 0) {
            container.innerHTML = '<div style="padding: 2rem; text-align: center; color: #666;"><i class="fas fa-bell-slash"></i><br>Aucune notification</div>';
            return;
        }

        container.innerHTML = notifications.map(notif => {
            const date = new Date(notif.date_creation);
            const dateStr = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
            
            const icons = {
                'rfq_reçue': '<i class="fas fa-file-alt"></i>',
                'devis_reçu': '<i class="fas fa-briefcase"></i>',
                'commande_créée': '<i class="fas fa-shopping-cart"></i>',
                'statut_modifié': '<i class="fas fa-sync-alt"></i>',
                'facture_créée': '<i class="fas fa-file-invoice"></i>',
                'paiement_reçu': '<i class="fas fa-money-check"></i>'
            };

            const icon = icons[notif.type_notification] || '<i class="fas fa-info-circle"></i>';
            const unreadClass = notif.lu ? '' : 'unread';
            const unreadStyle = notif.lu ? '' : 'background: #f0f9ff; border-left: 3px solid #3B82F6;';

            let actionButton = '';
            if (notif.type_document && notif.document_id) {
                const links = {
                    'rfq': 'rfq-detail.html',
                    'devis': 'devis-detail.html',
                    'commande': 'commandes-detail.html',
                    'facture': 'factures-detail.html'
                };
                const link = links[notif.type_document];
                if (link) {
                    actionButton = `<a href="${link}?id=${notif.document_id}" class="btn btn-sm btn-primary" style="margin-top: 0.5rem;">Voir</a>`;
                }
            }

            return `
                <div class="notification-item ${unreadClass}" style="padding: 1rem; border-bottom: 1px solid #e5e7eb; ${unreadStyle}" 
                     onclick="notificationsManager.markAsRead(${notif.id})">
                    <div style="display: flex; gap: 1rem;">
                        <div style="font-size: 1.5rem; color: #3B82F6;">${icon}</div>
                        <div style="flex: 1;">
                            <div style="font-weight: bold; margin-bottom: 0.25rem;">${notif.titre}</div>
                            <div style="color: #666; font-size: 0.9rem; margin-bottom: 0.5rem;">${notif.message || ''}</div>
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="color: #999; font-size: 0.8rem;">${dateStr}</span>
                                ${actionButton}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Ajouter un lien "Voir toutes les notifications"
        const footer = document.createElement('div');
        footer.style.cssText = 'padding: 1rem; border-top: 1px solid #e5e7eb; text-align: center;';
        footer.innerHTML = '<a href="notifications.html" style="color: #3B82F6; text-decoration: none;">Voir toutes les notifications →</a>';
        container.appendChild(footer);
    }

    async markAsRead(id) {
        try {
            const response = await apiCall(`/api/notifications/${id}/read`, { method: 'PATCH' });
            if (response && response.ok) {
                this.unreadCount = Math.max(0, this.unreadCount - 1);
                this.updateBadge();
                // Recharger les notifications si le dropdown est ouvert
                const dropdown = document.getElementById('notifications-dropdown');
                if (dropdown) {
                    const list = document.getElementById('notifications-list');
                    if (list) {
                        await this.loadNotifications(list);
                    }
                }
            }
        } catch (error) {
            console.error('Erreur marquage notification:', error);
        }
    }

    async markAllAsRead() {
        try {
            const response = await apiCall('/api/notifications/read-all', { method: 'PATCH' });
            if (response && response.ok) {
                this.unreadCount = 0;
                this.updateBadge();
                Toast.success('Toutes les notifications ont été marquées comme lues');
                // Recharger les notifications
                const dropdown = document.getElementById('notifications-dropdown');
                if (dropdown) {
                    const list = document.getElementById('notifications-list');
                    if (list) {
                        await this.loadNotifications(list);
                    }
                }
            }
        } catch (error) {
            console.error('Erreur:', error);
            Toast.error('Erreur lors du marquage');
        }
    }

    startPolling() {
        // Vérifier les nouvelles notifications toutes les 30 secondes
        this.checkInterval = setInterval(() => {
            this.loadUnreadCount();
        }, 30000);
    }

    stopPolling() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
    }
}

// Initialiser le gestionnaire de notifications
let notificationsManager;
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        notificationsManager = new NotificationsManager();
        window.notificationsManager = notificationsManager;
    });
}

