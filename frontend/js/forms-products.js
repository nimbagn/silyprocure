// Formulaires pour les produits

// Vérifier que Modal est disponible
if (typeof Modal === 'undefined') {
    console.error('Modal n\'est pas défini. Assurez-vous que components.js est chargé avant forms-products.js');
}

function createProduitForm() {
    console.log('createProduitForm appelé');
    
    if (typeof Modal === 'undefined') {
        Toast.error('Erreur: Modal non disponible. Rechargez la page.');
        return;
    }
    const content = `
        <form id="produit-form" onsubmit="window.handleCreateProduit(event)">
            <div class="form-row">
                <div class="form-group">
                    <label for="prod-reference">Référence</label>
                    <input type="text" id="prod-reference" name="reference" placeholder="Auto-générée si vide">
                    <small style="color: #666; font-size: 0.85rem;">Laissé vide pour génération automatique</small>
                </div>
                <div class="form-group">
                    <label for="prod-categorie">Catégorie *</label>
                    <select id="prod-categorie" name="categorie_id" required>
                        <option value="">Sélectionner</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="prod-fournisseur">Fournisseur</label>
                    <select id="prod-fournisseur" name="fournisseur_id">
                        <option value="">Aucun fournisseur</option>
                    </select>
                    <small style="color: #666; font-size: 0.85rem;">Optionnel - Associer un fournisseur</small>
                </div>
            </div>
            <div class="form-group">
                <label for="prod-libelle">Libellé *</label>
                <input type="text" id="prod-libelle" name="libelle" required>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="prod-prix">Prix unitaire HT (GNF) *</label>
                    <input type="number" id="prod-prix" name="prix_unitaire_ht" required min="0" step="0.01">
                </div>
                <div class="form-group">
                    <label for="prod-unite">Unité *</label>
                    <input type="text" id="prod-unite" name="unite" required value="unité">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="prod-stock">Stock disponible</label>
                    <input type="number" id="prod-stock" name="stock_disponible" min="0" placeholder="Optionnel">
                    <small style="color: #666; font-size: 0.85rem;">Laisser vide si non disponible</small>
                </div>
                <div class="form-group">
                    <label for="prod-tva">TVA (%)</label>
                    <input type="number" id="prod-tva" name="tva_taux" min="0" max="100" step="0.01" value="20">
                </div>
            </div>
            <div class="form-group">
                <label for="prod-description">Description</label>
                <textarea id="prod-description" name="description" rows="3"></textarea>
            </div>
            <div class="form-group">
                <label for="prod-caracteristiques">Caractéristiques techniques</label>
                <textarea id="prod-caracteristiques" name="caracteristiques_techniques" rows="3"></textarea>
            </div>
        </form>
    `;

    const footer = `
        <button class="btn btn-secondary" onclick="Modal.hide('create-produit')">Annuler</button>
        <button class="btn btn-primary" onclick="document.getElementById('produit-form').requestSubmit()">Créer</button>
    `;

    try {
        const modal = new Modal('create-produit', 'Nouveau Produit', content, footer);
        modal.show();
        
        // Attendre que la modale soit complètement affichée avant de charger les catégories et fournisseurs
        setTimeout(() => {
            loadCategoriesForForm('prod-categorie');
            loadFournisseursForForm('prod-fournisseur');
        }, 200);
    } catch (error) {
        console.error('Erreur lors de la création de la modale:', error);
        Toast.error('Erreur: ' + error.message);
    }
}

// Fonction pour charger les fournisseurs dans un select
async function loadFournisseursForForm(selectId, selectedId = null) {
    console.log('loadFournisseursForForm appelé pour:', selectId);
    try {
        const response = await apiCall('/api/entreprises?type_entreprise=fournisseur');
        console.log('Réponse API fournisseurs:', response);
        
        if (!response) {
            console.error('Pas de réponse de l\'API');
            return;
        }
        
        if (response.ok) {
            const result = await response.json();
            const fournisseurs = Array.isArray(result) ? result : (result.data || []);
            console.log('Fournisseurs reçus:', fournisseurs);
            
            setTimeout(() => {
                const select = document.getElementById(selectId);
                console.log('Select fournisseur trouvé:', select);
                
                if (select) {
                    // Garder l'option par défaut
                    const defaultOption = select.querySelector('option[value=""]');
                    if (defaultOption) {
                        select.innerHTML = '';
                        select.appendChild(defaultOption);
                    } else {
                        select.innerHTML = '<option value="">Aucun fournisseur</option>';
                    }
                    
                    if (fournisseurs && fournisseurs.length > 0) {
                        fournisseurs.forEach(f => {
                            const option = document.createElement('option');
                            option.value = f.id;
                            option.textContent = f.nom;
                            if (selectedId && f.id == selectedId) {
                                option.selected = true;
                            }
                            select.appendChild(option);
                        });
                        console.log('Fournisseurs chargés dans le select');
                    } else {
                        console.warn('Aucun fournisseur trouvé');
                    }
                } else {
                    console.error('Select fournisseur non trouvé:', selectId);
                }
            }, 50);
        } else {
            console.error('Erreur API fournisseurs');
        }
    } catch (error) {
        console.error('Erreur chargement fournisseurs:', error);
    }
}

// Fonction pour charger les catégories dans un select
async function loadCategoriesForForm(selectId, selectedId = null) {
    console.log('loadCategoriesForForm appelé pour:', selectId);
    try {
        const response = await apiCall('/api/produits/categories');
        console.log('Réponse API catégories:', response);
        
        if (!response) {
            console.error('Pas de réponse de l\'API');
            Toast.error('Impossible de charger les catégories');
            return;
        }
        
        if (response.ok) {
            const categories = await response.json();
            console.log('Catégories reçues:', categories);
            
            // Attendre un peu pour être sûr que le DOM est prêt
            setTimeout(() => {
                const select = document.getElementById(selectId);
                console.log('Select trouvé:', select);
                
                if (select) {
                    // Garder l'option par défaut
                    const defaultOption = select.querySelector('option[value=""]');
                    if (defaultOption) {
                        select.innerHTML = '';
                        select.appendChild(defaultOption);
                    } else {
                        select.innerHTML = '<option value="">Sélectionner</option>';
                    }
                    
                    if (categories && categories.length > 0) {
                        categories.forEach(c => {
                            const option = document.createElement('option');
                            option.value = c.id;
                            option.textContent = c.libelle;
                            if (selectedId && c.id == selectedId) {
                                option.selected = true;
                            }
                            select.appendChild(option);
                        });
                        console.log('Catégories chargées dans le select');
                    } else {
                        console.warn('Aucune catégorie trouvée');
                        Toast.warning('Aucune catégorie disponible');
                    }
                } else {
                    console.error('Select non trouvé:', selectId);
                    Toast.error('Erreur: le champ catégorie n\'a pas été trouvé');
                }
            }, 50);
        } else {
            const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }));
            console.error('Erreur API catégories:', errorData);
            Toast.error('Erreur lors du chargement des catégories: ' + (errorData.error || 'Erreur inconnue'));
        }
    } catch (error) {
        console.error('Erreur chargement catégories:', error);
        Toast.error('Erreur lors du chargement des catégories: ' + error.message);
    }
}

async function handleCreateProduit(event) {
    event.preventDefault();
    console.log('handleCreateProduit appelé');
    
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    
    console.log('Données du formulaire:', data);
    
    // Générer une référence automatique si elle n'est pas fournie
    if (!data.reference || data.reference.trim() === '') {
        // Générer une référence basée sur le libellé et la date
        const libelleClean = (data.libelle || 'PROD').toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 6);
        const dateCode = new Date().toISOString().slice(2, 10).replace(/-/g, '');
        data.reference = `REF-${libelleClean}-${dateCode}`;
        console.log('Référence auto-générée:', data.reference);
    }
    
    // Validation
    if (!data.libelle || !data.categorie_id || !data.prix_unitaire_ht) {
        Toast.error('Veuillez remplir tous les champs obligatoires (Libellé, Catégorie, Prix)');
        console.error('Validation échouée - champs manquants:', {
            libelle: data.libelle,
            categorie_id: data.categorie_id,
            prix_unitaire_ht: data.prix_unitaire_ht
        });
        return;
    }
    
    // Convertir les nombres
    data.prix_unitaire_ht = parseFloat(data.prix_unitaire_ht);
    if (isNaN(data.prix_unitaire_ht) || data.prix_unitaire_ht < 0) {
        Toast.error('Le prix unitaire doit être un nombre positif');
        return;
    }
    
    // Stock optionnel : NULL si vide, sinon la valeur
    if (data.stock_disponible && data.stock_disponible.trim() !== '') {
        data.stock_disponible = parseInt(data.stock_disponible);
        if (isNaN(data.stock_disponible) || data.stock_disponible < 0) {
            Toast.error('Le stock doit être un nombre positif');
            return;
        }
    } else {
        data.stock_disponible = null; // NULL au lieu de 0 pour indiquer "non fourni"
    }
    
    data.tva_taux = data.tva_taux ? parseFloat(data.tva_taux) : 20;
    data.categorie_id = parseInt(data.categorie_id);
    
    if (!data.categorie_id || isNaN(data.categorie_id)) {
        Toast.error('Veuillez sélectionner une catégorie');
        return;
    }
    
    // Gérer le fournisseur_id (optionnel)
    if (data.fournisseur_id && data.fournisseur_id.trim() !== '') {
        data.fournisseur_id = parseInt(data.fournisseur_id);
        if (isNaN(data.fournisseur_id) || data.fournisseur_id < 1) {
            data.fournisseur_id = null;
        }
    } else {
        data.fournisseur_id = null;
    }
    
    // Valeurs par défaut
    if (!data.unite || data.unite.trim() === '') {
        data.unite = 'unité';
    }
    
    // Nettoyer les valeurs null/undefined
    if (!data.description) data.description = null;
    if (!data.caracteristiques_techniques) data.caracteristiques_techniques = null;
    
    console.log('Données finales à envoyer:', data);
    
    showLoading('Création du produit...');
    
    try {
        console.log('Envoi de la requête POST /api/produits');
        console.log('Données envoyées:', JSON.stringify(data, null, 2));
        
        const response = await apiCall('/api/produits', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        
        console.log('Réponse reçue:', response);
        console.log('Status:', response ? response.status : 'Pas de réponse');
        console.log('OK:', response ? response.ok : 'Pas de réponse');
        
        if (!response) {
            Toast.error('Pas de réponse du serveur. Vérifiez votre connexion.');
            return;
        }
        
        if (response.ok) {
            const result = await response.json();
            console.log('Produit créé avec succès:', result);
            Toast.success('Produit créé avec succès');
            if (typeof Modal !== 'undefined' && Modal.hide) {
                Modal.hide('create-produit');
            }
            if (typeof loadProduits === 'function') {
                loadProduits();
            } else {
                window.location.reload();
            }
        } else {
            // Gérer les différents codes d'erreur
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) {
                errorData = { error: `Erreur ${response.status}: ${response.statusText}` };
            }
            
            console.error('Erreur API:', errorData);
            console.error('Status:', response.status);
            console.error('StatusText:', response.statusText);
            
            if (response.status === 404) {
                Toast.error('Route API non trouvée. Vérifiez que le serveur est démarré.');
            } else if (response.status === 401) {
                Toast.error('Session expirée. Veuillez vous reconnecter.');
                setTimeout(() => logout(), 2000);
            } else {
                Toast.error(errorData.error || `Erreur ${response.status}: ${response.statusText}`);
            }
        }
    } catch (error) {
        console.error('Erreur catch:', error);
        console.error('Stack:', error.stack);
        Toast.error('Erreur de connexion: ' + (error.message || 'Erreur inconnue'));
    } finally {
        hideLoading();
    }
}

// Formulaire d'édition Produit
async function editProduitForm(id) {
    try {
        showLoading('Chargement du produit...');
        const response = await apiCall(`/api/produits/${id}`);
        if (!response || !response.ok) {
            hideLoading();
            Toast.error('Erreur lors du chargement');
            return;
        }

        const produit = await response.json();
        hideLoading();

        const content = `
            <form id="produit-edit-form" onsubmit="handleUpdateProduit(event, ${id})">
                <div class="form-row">
                    <div class="form-group">
                        <label for="prod-edit-reference">Référence *</label>
                        <input type="text" id="prod-edit-reference" name="reference" value="${produit.reference || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="prod-edit-categorie">Catégorie *</label>
                        <select id="prod-edit-categorie" name="categorie_id" required>
                            <option value="">Sélectionner</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="prod-edit-fournisseur">Fournisseur</label>
                        <select id="prod-edit-fournisseur" name="fournisseur_id">
                            <option value="">Aucun fournisseur</option>
                        </select>
                        <small style="color: #666; font-size: 0.85rem;">Optionnel - Modifier le fournisseur associé</small>
                    </div>
                </div>
                <div class="form-group">
                    <label for="prod-edit-libelle">Libellé *</label>
                    <input type="text" id="prod-edit-libelle" name="libelle" value="${produit.libelle || ''}" required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="prod-edit-prix">Prix unitaire HT (GNF) *</label>
                        <input type="number" id="prod-edit-prix" name="prix_unitaire_ht" value="${produit.prix_unitaire_ht || ''}" required min="0" step="0.01">
                    </div>
                    <div class="form-group">
                        <label for="prod-edit-unite">Unité *</label>
                        <input type="text" id="prod-edit-unite" name="unite" value="${produit.unite || 'unité'}" required>
                    </div>
                </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="prod-edit-stock">Stock disponible</label>
                            <input type="number" id="prod-edit-stock" name="stock_disponible" value="${produit.stock_disponible || ''}" min="0" placeholder="Optionnel">
                            <small style="color: #666; font-size: 0.85rem;">Laisser vide si non disponible</small>
                        </div>
                    <div class="form-group">
                        <label for="prod-edit-tva">TVA (%)</label>
                        <input type="number" id="prod-edit-tva" name="tva_taux" value="${produit.tva_taux || 20}" min="0" max="100" step="0.01">
                    </div>
                </div>
                <div class="form-group">
                    <label for="prod-edit-description">Description</label>
                    <textarea id="prod-edit-description" name="description" rows="3">${produit.description || ''}</textarea>
                </div>
                <div class="form-group">
                    <label for="prod-edit-caracteristiques">Caractéristiques techniques</label>
                    <textarea id="prod-edit-caracteristiques" name="caracteristiques_techniques" rows="3">${produit.caracteristiques_techniques || ''}</textarea>
                </div>
            </form>
        `;

        const footer = `
            <button class="btn btn-secondary" onclick="Modal.hide('edit-produit')">Annuler</button>
            <button class="btn btn-primary" onclick="document.getElementById('produit-edit-form').requestSubmit()">Enregistrer</button>
        `;

        const modal = new Modal('edit-produit', 'Modifier Produit', content, footer);
        modal.show();
        
        // Charger les catégories et fournisseurs avec sélection
        await loadCategoriesForForm('prod-edit-categorie', produit.categorie_id);
        await loadFournisseursForForm('prod-edit-fournisseur', produit.fournisseur_id);
    } catch (error) {
        hideLoading();
        Toast.error('Erreur lors du chargement');
        console.error('Erreur:', error);
    }
}

async function handleUpdateProduit(event, id) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData);

        // Convertir les nombres
        data.prix_unitaire_ht = parseFloat(data.prix_unitaire_ht);
        data.categorie_id = parseInt(data.categorie_id);
        
        // Stock optionnel : NULL si vide, sinon la valeur
        if (data.stock_disponible && data.stock_disponible.trim() !== '') {
            data.stock_disponible = parseInt(data.stock_disponible);
            if (isNaN(data.stock_disponible) || data.stock_disponible < 0) {
                Toast.error('Le stock doit être un nombre positif');
                return;
            }
        } else {
            data.stock_disponible = null; // NULL au lieu de 0 pour indiquer "non fourni"
        }
        
        // Gérer le fournisseur_id (optionnel)
        if (data.fournisseur_id && data.fournisseur_id.trim() !== '') {
            data.fournisseur_id = parseInt(data.fournisseur_id);
            if (isNaN(data.fournisseur_id) || data.fournisseur_id < 1) {
                data.fournisseur_id = null;
            }
        } else {
            data.fournisseur_id = null;
        }
        
        data.tva_taux = data.tva_taux ? parseFloat(data.tva_taux) : 20;
        
        // Nettoyer les valeurs null/undefined pour description et caracteristiques
        if (!data.description || data.description.trim() === '') {
            data.description = null;
        }
        if (!data.caracteristiques_techniques || data.caracteristiques_techniques.trim() === '') {
            data.caracteristiques_techniques = null;
        }
    
    showLoading('Mise à jour du produit...');
    
    try {
        const response = await apiCall(`/api/produits/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        
        if (response && response.ok) {
            Toast.success('Produit mis à jour avec succès');
            Modal.hide('edit-produit');
            if (typeof loadProduits === 'function') {
                loadProduits();
            }
        } else {
            const error = await response.json().catch(() => ({ error: 'Erreur inconnue' }));
            // Afficher les détails de validation si disponibles
            if (error.errors && Array.isArray(error.errors)) {
                const errorMessages = error.errors.map(e => e.msg || e.message).join(', ');
                Toast.error('Erreurs de validation: ' + errorMessages);
            } else {
                Toast.error(error.error || error.message || 'Erreur lors de la mise à jour');
            }
            console.error('Erreur mise à jour produit:', error);
        }
    } catch (error) {
        Toast.error('Erreur de connexion');
    } finally {
        hideLoading();
    }
}

// Exporter toutes les fonctions pour utilisation globale
window.createProduitForm = createProduitForm;
window.handleCreateProduit = handleCreateProduit;
window.editProduitForm = editProduitForm;
window.handleUpdateProduit = handleUpdateProduit;
window.loadCategoriesForForm = loadCategoriesForForm;
window.loadFournisseursForForm = loadFournisseursForForm;

// Vérification au chargement
console.log('forms-products.js chargé');
console.log('createProduitForm exporté:', typeof window.createProduitForm !== 'undefined');
console.log('handleCreateProduit exporté:', typeof window.handleCreateProduit !== 'undefined');

