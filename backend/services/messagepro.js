/**
 * Service d'intégration avec Message Pro API
 * Documentation: https://messagepro-gn.com/api
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');
const FormData = require('form-data');

const MESSAGEPRO_BASE_URL = 'https://messagepro-gn.com/api';

class MessageProService {
    constructor() {
        this.loadSecret();
    }

    /**
     * Charge le secret depuis les variables d'environnement ou la base de données
     */
    async loadSecret() {
        this.secret = process.env.MESSAGEPRO_SECRET;
        
        // Si pas dans les variables d'environnement, essayer de charger depuis la DB
        if (!this.secret) {
            try {
                const pool = require('../config/database');
                const [params] = await pool.execute(
                    'SELECT valeur FROM parametres WHERE cle = ?',
                    ['MESSAGEPRO_SECRET']
                );
                if (params && params.length > 0) {
                    this.secret = params[0].valeur;
                    process.env.MESSAGEPRO_SECRET = this.secret;
                }
            } catch (error) {
                // Ignorer les erreurs de chargement depuis la DB
            }
        }
        
        if (!this.secret) {
            console.warn('⚠️  MESSAGEPRO_SECRET non défini. Les fonctionnalités SMS/WhatsApp seront désactivées.');
        }
    }

    /**
     * Met à jour le secret en mémoire
     */
    updateSecret(secret) {
        this.secret = secret;
        process.env.MESSAGEPRO_SECRET = secret;
    }

    /**
     * Effectue une requête HTTP vers l'API Message Pro
     */
    async makeRequest(endpoint, method = 'GET', data = null, isFormData = false) {
        if (!this.secret) {
            throw new Error('MESSAGEPRO_SECRET non configuré');
        }

        return new Promise((resolve, reject) => {
            const url = new URL(`${MESSAGEPRO_BASE_URL}${endpoint}`);
            
            // Ajouter le secret aux paramètres
            if (method === 'GET') {
                url.searchParams.append('secret', this.secret);
            }

            const options = {
                hostname: url.hostname,
                port: url.port || 443,
                path: url.pathname + url.search,
                method: method,
                headers: {}
            };

            if (method === 'POST') {
                if (isFormData) {
                    // Pour multipart/form-data, on utilisera FormData côté appelant
                    options.headers['Content-Type'] = 'multipart/form-data';
                } else {
                    options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
                }
            }

            const req = https.request(options, (res) => {
                let responseData = '';

                res.on('data', (chunk) => {
                    responseData += chunk;
                });

                res.on('end', () => {
                    try {
                        const json = JSON.parse(responseData);
                        if (json.status === 200) {
                            resolve(json);
                        } else {
                            reject(new Error(json.message || 'Erreur API Message Pro'));
                        }
                    } catch (error) {
                        reject(new Error(`Erreur parsing réponse: ${error.message}`));
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            if (data && method === 'POST') {
                if (isFormData) {
                    // Pour FormData, on envoie directement le buffer
                    req.write(data);
                } else {
                    // Pour application/x-www-form-urlencoded
                    const formData = new URLSearchParams();
                    formData.append('secret', this.secret);
                    Object.keys(data).forEach(key => {
                        if (data[key] !== null && data[key] !== undefined) {
                            formData.append(key, data[key]);
                        }
                    });
                    req.write(formData.toString());
                }
            }

            req.end();
        });
    }

    /**
     * Envoie un SMS unique
     * @param {string} phone - Numéro de téléphone (E.164 ou local)
     * @param {string} message - Message à envoyer
     * @param {string} mode - 'devices' ou 'credits'
     * @param {object} options - Options supplémentaires (device, gateway, sim, priority)
     */
    async sendSMS(phone, message, mode = 'credits', options = {}) {
        try {
            if (!this.secret) {
                throw new Error('MESSAGEPRO_SECRET non configuré');
            }
            
            const fd = new FormData();
            
            fd.append('secret', this.secret);
            fd.append('mode', mode);
            fd.append('phone', phone);
            fd.append('message', message);
            
            if (options.device) fd.append('device', options.device);
            if (options.gateway) fd.append('gateway', options.gateway);
            if (options.sim) fd.append('sim', options.sim);
            if (options.priority !== undefined) fd.append('priority', options.priority);
            if (options.shortener) fd.append('shortener', options.shortener);

            // Utiliser form-data pour multipart/form-data
            return new Promise((resolve, reject) => {
                const url = new URL(`${MESSAGEPRO_BASE_URL}/send/sms`);
                
                const options = {
                    hostname: url.hostname,
                    port: 443,
                    path: url.pathname,
                    method: 'POST',
                    headers: fd.getHeaders()
                };

                const req = https.request(options, (res) => {
                    let responseData = '';

                    res.on('data', (chunk) => {
                        responseData += chunk;
                    });

                    res.on('end', () => {
                        try {
                            const json = JSON.parse(responseData);
                            if (json.status === 200) {
                                resolve(json);
                            } else {
                                reject(new Error(json.message || 'Erreur API Message Pro'));
                            }
                        } catch (error) {
                            reject(new Error(`Erreur parsing réponse: ${error.message}`));
                        }
                    });
                });

                req.on('error', (error) => {
                    reject(error);
                });

                fd.pipe(req);
            });
        } catch (error) {
            console.error('Erreur envoi SMS:', error);
            throw error;
        }
    }

    /**
     * Envoie un message WhatsApp unique
     * @param {string} account - ID unique du compte WhatsApp
     * @param {string} recipient - Numéro de téléphone du destinataire
     * @param {string} message - Message à envoyer
     * @param {object} options - Options supplémentaires (type, priority, media, document)
     */
    async sendWhatsApp(account, recipient, message, options = {}) {
        try {
            if (!this.secret) {
                throw new Error('MESSAGEPRO_SECRET non configuré');
            }
            
            const fd = new FormData();
            
            fd.append('secret', this.secret);
            fd.append('account', account);
            fd.append('recipient', recipient);
            fd.append('type', options.type || 'text');
            fd.append('message', message);
            
            if (options.priority !== undefined) fd.append('priority', options.priority);
            if (options.media_file) fd.append('media_file', options.media_file);
            if (options.media_url) fd.append('media_url', options.media_url);
            if (options.media_type) fd.append('media_type', options.media_type);
            if (options.document_file) fd.append('document_file', options.document_file);
            if (options.document_url) fd.append('document_url', options.document_url);
            if (options.document_name) fd.append('document_name', options.document_name);
            if (options.document_type) fd.append('document_type', options.document_type);
            if (options.shortener) fd.append('shortener', options.shortener);

            return new Promise((resolve, reject) => {
                const url = new URL(`${MESSAGEPRO_BASE_URL}/send/whatsapp`);
                
                const requestOptions = {
                    hostname: url.hostname,
                    port: 443,
                    path: url.pathname,
                    method: 'POST',
                    headers: fd.getHeaders()
                };

                const req = https.request(requestOptions, (res) => {
                    let responseData = '';

                    res.on('data', (chunk) => {
                        responseData += chunk;
                    });

                    res.on('end', () => {
                        try {
                            const json = JSON.parse(responseData);
                            if (json.status === 200) {
                                resolve(json);
                            } else {
                                reject(new Error(json.message || 'Erreur API Message Pro'));
                            }
                        } catch (error) {
                            reject(new Error(`Erreur parsing réponse: ${error.message}`));
                        }
                    });
                });

                req.on('error', (error) => {
                    reject(error);
                });

                fd.pipe(req);
            });
        } catch (error) {
            console.error('Erreur envoi WhatsApp:', error);
            throw error;
        }
    }

    /**
     * Envoie un OTP (One-Time Password)
     * @param {string} phone - Numéro de téléphone
     * @param {string} message - Message avec {{otp}} placeholder
     * @param {string} type - 'sms' ou 'whatsapp'
     * @param {object} options - Options supplémentaires
     */
    async sendOTP(phone, message, type = 'sms', options = {}) {
        try {
            if (!this.secret) {
                throw new Error('MESSAGEPRO_SECRET non configuré');
            }
            
            const fd = new FormData();
            
            fd.append('secret', this.secret);
            fd.append('type', type);
            fd.append('phone', phone);
            fd.append('message', message);
            
            if (options.expire) fd.append('expire', options.expire);
            if (options.priority !== undefined) fd.append('priority', options.priority);
            if (options.account) fd.append('account', options.account);
            if (options.mode) fd.append('mode', options.mode);
            if (options.device) fd.append('device', options.device);
            if (options.gateway) fd.append('gateway', options.gateway);
            if (options.sim) fd.append('sim', options.sim);

            return new Promise((resolve, reject) => {
                const url = new URL(`${MESSAGEPRO_BASE_URL}/send/otp`);
                
                const requestOptions = {
                    hostname: url.hostname,
                    port: 443,
                    path: url.pathname,
                    method: 'POST',
                    headers: fd.getHeaders()
                };

                const req = https.request(requestOptions, (res) => {
                    let responseData = '';

                    res.on('data', (chunk) => {
                        responseData += chunk;
                    });

                    res.on('end', () => {
                        try {
                            const json = JSON.parse(responseData);
                            if (json.status === 200) {
                                resolve(json);
                            } else {
                                reject(new Error(json.message || 'Erreur API Message Pro'));
                            }
                        } catch (error) {
                            reject(new Error(`Erreur parsing réponse: ${error.message}`));
                        }
                    });
                });

                req.on('error', (error) => {
                    reject(error);
                });

                fd.pipe(req);
            });
        } catch (error) {
            console.error('Erreur envoi OTP:', error);
            throw error;
        }
    }

    /**
     * Vérifie les crédits restants
     */
    async getCredits() {
        try {
            const response = await this.makeRequest('/get/credits');
            return response.data;
        } catch (error) {
            console.error('Erreur récupération crédits:', error);
            throw error;
        }
    }

    /**
     * Récupère les comptes WhatsApp disponibles
     */
    async getWhatsAppAccounts(limit = 10, page = 1) {
        try {
            const url = new URL(`${MESSAGEPRO_BASE_URL}/get/wa.accounts`);
            url.searchParams.append('secret', this.secret);
            url.searchParams.append('limit', limit);
            url.searchParams.append('page', page);

            return new Promise((resolve, reject) => {
                const options = {
                    hostname: url.hostname,
                    port: 443,
                    path: url.pathname + url.search,
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                };

                const req = https.request(options, (res) => {
                    let responseData = '';

                    res.on('data', (chunk) => {
                        responseData += chunk;
                    });

                    res.on('end', () => {
                        try {
                            const json = JSON.parse(responseData);
                            if (json.status === 200) {
                                resolve(json.data);
                            } else {
                                reject(new Error(json.message || 'Erreur API Message Pro'));
                            }
                        } catch (error) {
                            reject(new Error(`Erreur parsing réponse: ${error.message}`));
                        }
                    });
                });

                req.on('error', (error) => {
                    reject(error);
                });

                req.end();
            });
        } catch (error) {
            console.error('Erreur récupération comptes WhatsApp:', error);
            throw error;
        }
    }

    /**
     * Récupère les devices Android disponibles
     */
    async getDevices(limit = 10, page = 1) {
        try {
            const url = new URL(`${MESSAGEPRO_BASE_URL}/get/devices`);
            url.searchParams.append('secret', this.secret);
            url.searchParams.append('limit', limit);
            url.searchParams.append('page', page);

            return new Promise((resolve, reject) => {
                const options = {
                    hostname: url.hostname,
                    port: 443,
                    path: url.pathname + url.search,
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                };

                const req = https.request(options, (res) => {
                    let responseData = '';

                    res.on('data', (chunk) => {
                        responseData += chunk;
                    });

                    res.on('end', () => {
                        try {
                            const json = JSON.parse(responseData);
                            if (json.status === 200) {
                                resolve(json.data);
                            } else {
                                reject(new Error(json.message || 'Erreur API Message Pro'));
                            }
                        } catch (error) {
                            reject(new Error(`Erreur parsing réponse: ${error.message}`));
                        }
                    });
                });

                req.on('error', (error) => {
                    reject(error);
                });

                req.end();
            });
        } catch (error) {
            console.error('Erreur récupération devices:', error);
            throw error;
        }
    }

    /**
     * Récupère les taux des gateways
     */
    async getRates() {
        try {
            const url = new URL(`${MESSAGEPRO_BASE_URL}/get/rates`);
            url.searchParams.append('secret', this.secret);

            return new Promise((resolve, reject) => {
                const options = {
                    hostname: url.hostname,
                    port: 443,
                    path: url.pathname + url.search,
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                };

                const req = https.request(options, (res) => {
                    let responseData = '';

                    res.on('data', (chunk) => {
                        responseData += chunk;
                    });

                    res.on('end', () => {
                        try {
                            const json = JSON.parse(responseData);
                            if (json.status === 200) {
                                resolve(json.data);
                            } else {
                                reject(new Error(json.message || 'Erreur API Message Pro'));
                            }
                        } catch (error) {
                            reject(new Error(`Erreur parsing réponse: ${error.message}`));
                        }
                    });
                });

                req.on('error', (error) => {
                    reject(error);
                });

                req.end();
            });
        } catch (error) {
            console.error('Erreur récupération taux:', error);
            throw error;
        }
    }
}

// Export singleton instance
const messageProService = new MessageProService();

module.exports = messageProService;

