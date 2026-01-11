// Gestion de l'authentification

// Attacher les fonctions à window pour qu'elles soient accessibles depuis les attributs HTML inline
window.checkAuth = function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

window.logout = function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

// Fonction pour les appels API avec authentification
window.apiCall = async function apiCall(url, options = {}) {
    const token = localStorage.getItem('token');
    
    const defaultOptions = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };

    // Si body est fourni et que method n'est pas défini, utiliser POST par défaut
    if (options.body && !options.method) {
        defaultOptions.method = 'POST';
    }

    const finalOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...(options.headers || {})
        }
    };

    // Ne pas envoyer Content-Type pour FormData
    if (options.body instanceof FormData) {
        delete finalOptions.headers['Content-Type'];
    }

    try {
        // Détecter l'URL de base (production ou développement)
        let baseUrl = '';
        if (url.startsWith('http')) {
            // URL complète fournie, utiliser telle quelle
            baseUrl = '';
        } else if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            // Mode développement
            baseUrl = 'http://localhost:3000';
        } else {
            // Mode production - utiliser l'URL actuelle (même origine)
            baseUrl = window.location.origin;
        }
        
        const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
        
        // Log uniquement en mode développement
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('API Call:', fullUrl, {
                method: finalOptions.method,
                hasBody: !!finalOptions.body
            });
        }
        
        const response = await fetch(fullUrl, finalOptions);
        
        if (response.status === 401) {
            logout();
            return null;
        }

        return response;
    } catch (error) {
        console.error('Erreur API:', error);
        throw error;
    }
}

