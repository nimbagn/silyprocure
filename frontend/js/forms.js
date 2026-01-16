// Gestion des formulaires

// Formulaire de création RFQ
function createRFQForm() {
    const content = `
        <form id="rfq-form" onsubmit="handleCreateRFQ(event)">
            <div class="form-row">
                <div class="form-group">
                    <label for="rfq-numero">Numéro RFQ *</label>
                    <input type="text" id="rfq-numero" name="numero" required 
                           placeholder="RFQ-2024-001">
                </div>
                <div class="form-group">
                    <label for="rfq-date">Date d'émission *</label>
                    <input type="date" id="rfq-date" name="date_emission" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="rfq-destinataire">Fournisseur *</label>
                    <select id="rfq-destinataire" name="destinataire_id" required>
                        <option value="">Sélectionner un fournisseur</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="rfq-date-limite">Date limite de réponse</label>
                    <input type="date" id="rfq-date-limite" name="date_limite_reponse">
                </div>
            </div>
            <div class="form-group">
                <label for="rfq-description">Description *</label>
                <textarea id="rfq-description" name="description" required 
                          placeholder="Description détaillée de la demande"></textarea>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="rfq-categorie">Catégorie</label>
                    <select id="rfq-categorie" name="categorie_id">
                        <option value="">Sélectionner une catégorie</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="rfq-date-livraison">Date de livraison souhaitée</label>
                    <input type="date" id="rfq-date-livraison" name="date_livraison_souhaitee">
                </div>
            </div>
        </form>
    `;
    
    const footer = `
        <button class="btn btn-secondary" onclick="Modal.hide('create-rfq')">Annuler</button>
        <button class="btn btn-primary" onclick="document.getElementById('rfq-form').requestSubmit()">Créer</button>
    `;
    
    const modal = new Modal('create-rfq', 'Nouvelle RFQ', content, footer);
    modal.show();
    
    // Charger les fournisseurs et catégories
    loadFournisseurs('rfq-destinataire');
    loadCategories('rfq-categorie');
}

async function handleCreateRFQ(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    
    showLoading('Création de la RFQ...');
    
    try {
        const response = await apiCall('/api/rfq', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        
        if (response && response.ok) {
            Toast.success('RFQ créée avec succès');
            Modal.hide('create-rfq');
            if (typeof loadRFQ === 'function') {
                loadRFQ();
            }
        } else {
            const error = await response.json();
            Toast.error(error.error || 'Erreur lors de la création');
        }
    } catch (error) {
        Toast.error('Erreur de connexion');
    } finally {
        hideLoading();
    }
}

// Formulaire de création Entreprise
function createEntrepriseForm() {
    const content = `
        <form id="entreprise-form" onsubmit="handleCreateEntreprise(event)">
            <div class="form-row">
                <div class="form-group">
                    <label for="ent-nom">Nom *</label>
                    <input type="text" id="ent-nom" name="nom" required>
                </div>
                <div class="form-group">
                    <label for="ent-type">Type *</label>
                    <select id="ent-type" name="type_entreprise" required>
                        <option value="">Sélectionner</option>
                        <option value="fournisseur">Fournisseur</option>
                        <option value="client">Client</option>
                        <option value="acheteur">Acheteur</option>
                        <option value="transporteur">Transporteur</option>
                    </select>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="ent-raison-sociale">Raison sociale</label>
                    <input type="text" id="ent-raison-sociale" name="raison_sociale">
                </div>
                <div class="form-group">
                    <label for="ent-forme-juridique">Forme juridique</label>
                    <select id="ent-forme-juridique" name="forme_juridique">
                        <option value="">Sélectionner</option>
                        <option value="SARL">SARL</option>
                        <option value="SA">SA</option>
                        <option value="SNC">SNC</option>
                        <option value="EURL">EURL</option>
                        <option value="Auto-entrepreneur">Auto-entrepreneur</option>
                        <option value="Autre">Autre</option>
                    </select>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="ent-rccm">RCCM</label>
                    <input type="text" id="ent-rccm" name="rccm" placeholder="Ex: GN-2024-A-12345">
                </div>
                <div class="form-group">
                    <label for="ent-numero-contribuable">Numéro contribuable</label>
                    <input type="text" id="ent-numero-contribuable" name="numero_contribuable">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="ent-siret">SIRET (si applicable)</label>
                    <input type="text" id="ent-siret" name="siret" maxlength="14" placeholder="Pour entreprises françaises">
                </div>
                <div class="form-group">
                    <label for="ent-tva">TVA Intracommunautaire</label>
                    <input type="text" id="ent-tva" name="tva_intracommunautaire">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="ent-capital">Capital social (GNF)</label>
                    <input type="number" id="ent-capital" name="capital_social" step="0.01" min="0">
                </div>
                <div class="form-group">
                    <label for="ent-secteur">Secteur d'activité</label>
                    <input type="text" id="ent-secteur" name="secteur_activite" placeholder="Ex: Commerce, Services, Industrie">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="ent-email">Email</label>
                    <input type="email" id="ent-email" name="email">
                </div>
                <div class="form-group">
                    <label for="ent-telephone">Téléphone</label>
                    <input type="tel" id="ent-telephone" name="telephone" placeholder="Ex: +224 612 34 56 78">
                </div>
            </div>
            <div class="form-group">
                <label for="ent-site-web">Site web</label>
                <input type="url" id="ent-site-web" name="site_web" placeholder="https://...">
            </div>

            <h3 style="margin: 1.5rem 0 1rem 0; color: var(--color-primary); border-top: 2px solid var(--color-background-blue); padding-top: 1rem;">
                📍 Adresse et géolocalisation
            </h3>

            <div class="form-group">
                <label for="ent-addr-ligne1">Adresse ligne 1</label>
                <input type="text" id="ent-addr-ligne1" name="adresse_ligne1" placeholder="Rue, avenue...">
            </div>
            <div class="form-group">
                <label for="ent-addr-ligne2">Adresse ligne 2</label>
                <input type="text" id="ent-addr-ligne2" name="adresse_ligne2" placeholder="Complément d'adresse">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="ent-addr-code-postal">Code postal</label>
                    <input type="text" id="ent-addr-code-postal" name="code_postal" placeholder="Ex: 001">
                </div>
                <div class="form-group">
                    <label for="ent-addr-ville">Ville</label>
                    <input type="text" id="ent-addr-ville" name="ville" placeholder="Ex: Conakry">
                </div>
            </div>
            <div class="form-group">
                <label for="ent-addr-pays">Pays</label>
                <input type="text" id="ent-addr-pays" name="pays" value="Guinée" placeholder="Guinée">
            </div>

            <div class="form-group">
                <label>
                    <input type="checkbox" id="ent-geocode" onchange="toggleGeocodeEntreprise()">
                    Géolocaliser automatiquement cette adresse
                </label>
            </div>

            <div id="ent-geocode-section" class="hidden">
                <div class="form-row">
                    <div class="form-group">
                        <label for="ent-addr-latitude">Latitude (optionnel)</label>
                        <input type="text" id="ent-addr-latitude" name="latitude" 
                               pattern="^-?[0-9]+([.,][0-9]+)?$"
                               placeholder="Ex: 9.6412 ou 9,6412"
                               title="Format: nombre décimal avec point ou virgule">
                        <small style="color: var(--color-neutral); font-size: 0.75rem;">
                            Format: 9.6412 ou 9,6412 (entre -90 et 90)
                        </small>
                    </div>
                    <div class="form-group">
                        <label for="ent-addr-longitude">Longitude (optionnel)</label>
                        <input type="text" id="ent-addr-longitude" name="longitude" 
                               pattern="^-?[0-9]+([.,][0-9]+)?$"
                               placeholder="Ex: -13.5784 ou -13,5784"
                               title="Format: nombre décimal avec point ou virgule">
                        <small style="color: var(--color-neutral); font-size: 0.75rem;">
                            Format: -13.5784 ou -13,5784 (entre -180 et 180)
                        </small>
                    </div>
                </div>
                <button type="button" class="btn btn-secondary" onclick="geocodeEntrepriseAddress()" style="width: 100%; margin-bottom: 1rem;">
                    <i class="fas fa-search"></i> Géocoder l'adresse automatiquement
                </button>
                <button type="button" class="btn btn-secondary" onclick="useCurrentLocation()" style="width: 100%;">
                    📍 Utiliser ma position actuelle
                </button>
                <div style="margin-top: 1rem; padding: 0.75rem; background: var(--color-background-blue); border-radius: 8px; font-size: 0.875rem;">
                    💡 <strong>Note:</strong> La géolocalisation est optionnelle. Vous pouvez créer l'entreprise sans coordonnées GPS.
                </div>
            </div>

            <div class="form-group" style="margin-top: 1rem;">
                <label for="ent-notes">Notes</label>
                <textarea id="ent-notes" name="notes" rows="3" placeholder="Notes complémentaires..."></textarea>
            </div>
        </form>
    `;
    
    const footer = `
        <button class="btn btn-secondary" onclick="Modal.hide('create-entreprise')">Annuler</button>
        <button class="btn btn-primary" onclick="document.getElementById('entreprise-form').requestSubmit()">Créer</button>
    `;
    
    const modal = new Modal('create-entreprise', 'Nouvelle Entreprise', content, footer);
    modal.show();
}

function toggleGeocodeEntreprise() {
    const checkbox = document.getElementById('ent-geocode');
    const section = document.getElementById('ent-geocode-section');
    if (checkbox && section) {
        if (checkbox.checked) {
            section.classList.remove('hidden');
        } else {
            section.classList.add('hidden');
        }
    }
}

async function geocodeEntrepriseAddress() {
    const adresse = document.getElementById('ent-addr-ligne1').value;
    const ville = document.getElementById('ent-addr-ville').value;
    const pays = document.getElementById('ent-addr-pays').value || 'Guinée';

    if (!adresse || !ville) {
        Toast.warning('Veuillez remplir l\'adresse ligne 1 et la ville');
        return;
    }

    showLoading('Géocodage en cours...');
    
    // Utiliser geocodeAddress depuis window (exporté par geolocalisation.js)
    if (!window.geocodeAddress) {
        Toast.error('Fonction de géocodage non disponible. Veuillez recharger la page.');
        return;
    }
    const result = await window.geocodeAddress(adresse, ville, pays);
    
    hideLoading();

    if (result) {
        // Formater les coordonnées avec un point (format standard)
        document.getElementById('ent-addr-latitude').value = result.latitude.toFixed(8);
        document.getElementById('ent-addr-longitude').value = result.longitude.toFixed(8);
        Toast.success('Adresse géocodée avec succès');
    } else {
        Toast.error('Impossible de géocoder cette adresse');
    }
}

async function useCurrentLocation() {
    if (navigator.geolocation) {
        showLoading('Récupération de votre position...');
        navigator.geolocation.getCurrentPosition(
            position => {
                // Formater les coordonnées avec un point (format standard)
                document.getElementById('ent-addr-latitude').value = position.coords.latitude.toFixed(8);
                document.getElementById('ent-addr-longitude').value = position.coords.longitude.toFixed(8);
                hideLoading();
                Toast.success('Position actuelle récupérée');
            },
            error => {
                hideLoading();
                Toast.error('Impossible d\'obtenir votre position');
            }
        );
    } else {
        Toast.error('Géolocalisation non supportée par votre navigateur');
    }
}

async function handleCreateEntreprise(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    
    // Séparer les données entreprise et adresse
    // Nettoyer les valeurs vides pour les convertir en null
    const cleanValue = (value) => {
        if (!value || value === '' || value === 'null' || value === 'undefined') return null;
        return value;
    };
    
    const entrepriseData = {
        nom: data.nom.trim(),
        raison_sociale: cleanValue(data.raison_sociale),
        rccm: cleanValue(data.rccm),
        numero_contribuable: cleanValue(data.numero_contribuable),
        capital_social: data.capital_social && data.capital_social !== '' ? parseFloat(data.capital_social) : null,
        forme_juridique: cleanValue(data.forme_juridique),
        secteur_activite: cleanValue(data.secteur_activite),
        siret: cleanValue(data.siret),
        tva_intracommunautaire: cleanValue(data.tva_intracommunautaire),
        type_entreprise: data.type_entreprise,
        email: cleanValue(data.email),
        telephone: cleanValue(data.telephone),
        site_web: cleanValue(data.site_web),
        notes: cleanValue(data.notes)
    };

    // Nettoyer et convertir les coordonnées GPS (gérer virgule et point)
    // Récupérer les valeurs même si la section est cachée
    let latitude = null;
    let longitude = null;
    
    // Récupérer les valeurs des champs même s'ils sont cachés
    const latInput = document.getElementById('ent-addr-latitude');
    const lngInput = document.getElementById('ent-addr-longitude');
    const latValue = latInput ? latInput.value : (data.latitude || '');
    const lngValue = lngInput ? lngInput.value : (data.longitude || '');
    
    if (latValue && latValue.trim() !== '') {
        const latStr = String(latValue).replace(',', '.');
        const latNum = parseFloat(latStr);
        if (!isNaN(latNum) && latNum >= -90 && latNum <= 90) {
            latitude = latNum;
        } else {
            console.warn('Latitude invalide:', latValue);
        }
    }
    
    if (lngValue && lngValue.trim() !== '') {
        const lngStr = String(lngValue).replace(',', '.');
        const lngNum = parseFloat(lngStr);
        if (!isNaN(lngNum) && lngNum >= -180 && lngNum <= 180) {
            longitude = lngNum;
        } else {
            console.warn('Longitude invalide:', lngValue);
        }
    }

    const adresseData = {
        type_adresse: 'siege',
        libelle: 'Siège social',
        adresse_ligne1: data.adresse_ligne1 || null,
        adresse_ligne2: data.adresse_ligne2 || null,
        code_postal: data.code_postal || null,
        ville: data.ville || null,
        pays: data.pays || 'Guinée',
        latitude: latitude,
        longitude: longitude,
        principal: true
    };
    
    showLoading('Création de l\'entreprise...');
    
    try {
        // Créer l'entreprise
        const response = await apiCall('/api/entreprises', {
            method: 'POST',
            body: JSON.stringify(entrepriseData)
        });
        
        if (!response || !response.ok) {
            const error = await response.json();
            Toast.error(error.error || 'Erreur lors de la création');
            hideLoading();
            return;
        }

        const result = await response.json();
        const entrepriseId = result.id;

        // Créer l'adresse si au moins l'adresse ligne 1, la ville OU les coordonnées GPS sont fournies
        // Les coordonnées GPS peuvent être la seule information fournie
        if (adresseData.adresse_ligne1 || adresseData.ville || (latitude !== null && longitude !== null)) {
            adresseData.entreprise_id = entrepriseId;
            const adresseResponse = await apiCall('/api/adresses', {
                method: 'POST',
                body: JSON.stringify(adresseData)
            });

            if (!adresseResponse || !adresseResponse.ok) {
                const errorData = await adresseResponse.json().catch(() => ({ error: 'Erreur inconnue' }));
                console.warn('Entreprise créée mais erreur lors de la création de l\'adresse:', errorData);
                Toast.warning('Entreprise créée mais l\'adresse n\'a pas pu être enregistrée: ' + (errorData.error || 'Erreur inconnue'));
            } else {
                console.log('Adresse créée avec succès, coordonnées GPS:', latitude, longitude);
            }
        } else {
            // Aucune adresse fournie, ce n'est pas grave
            console.log('Aucune adresse fournie, entreprise créée sans adresse');
        }

        Toast.success('Entreprise créée avec succès');
        Modal.hide('create-entreprise');
        if (typeof loadEntreprises === 'function') {
            loadEntreprises();
        }
    } catch (error) {
        Toast.error('Erreur de connexion');
        console.error('Erreur:', error);
    } finally {
        hideLoading();
    }
}

// Fonction pour charger les projets
async function loadProjets() {
    try {
        const response = await apiCall('/api/projets');
        if (response && response.ok) {
            const projets = await response.json();
            const select = document.getElementById('rfq-projet');
            if (select) {
                projets.forEach(proj => {
                    const option = document.createElement('option');
                    option.value = proj.id;
                    option.textContent = `${proj.code || ''} - ${proj.libelle}`.trim();
                    select.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Erreur chargement projets:', error);
    }
}

// Fonction pour charger les centres de coût
async function loadCentresCout() {
    try {
        const response = await apiCall('/api/projets/centres-cout');
        if (response && response.ok) {
            const centres = await response.json();
            const select = document.getElementById('rfq-centre-cout');
            if (select) {
                centres.forEach(centre => {
                    const option = document.createElement('option');
                    option.value = centre.id;
                    option.textContent = `${centre.code} - ${centre.libelle}`;
                    select.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Erreur chargement centres de coût:', error);
    }
}

// Fonctions utilitaires pour charger les données
async function loadFournisseurs(selectId) {
    try {
        const response = await apiCall('/api/entreprises?type=fournisseur');
        if (response && response.ok) {
            const entreprises = await response.json();
            const select = document.getElementById(selectId);
            if (select) {
                entreprises.forEach(ent => {
                    const option = document.createElement('option');
                    option.value = ent.id;
                    option.textContent = ent.nom;
                    select.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Erreur chargement fournisseurs:', error);
    }
}

async function loadCategories(selectId) {
    try {
        const response = await apiCall('/api/produits/categories');
        if (response && response.ok) {
            const categories = await response.json();
            const select = document.getElementById(selectId);
            if (select) {
                categories.forEach(cat => {
                    const option = document.createElement('option');
                    option.value = cat.id;
                    option.textContent = cat.libelle;
                    select.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Erreur chargement catégories:', error);
    }
}

// Formulaire d'édition RFQ
async function editRFQForm(id) {
    try {
        showLoading('Chargement de la RFQ...');
        const response = await apiCall(`/api/rfq/${id}`);
        if (!response || !response.ok) {
            hideLoading();
            Toast.error('Erreur lors du chargement de la RFQ');
            return;
        }

        const rfq = await response.json();
        hideLoading();

        const content = `
            <form id="rfq-edit-form" onsubmit="handleUpdateRFQ(event, ${id})">
                <div class="form-row">
                    <div class="form-group">
                        <label for="rfq-edit-numero">Numéro RFQ</label>
                        <input type="text" id="rfq-edit-numero" name="numero" value="${rfq.numero || ''}" readonly style="background: #f0f0f0;">
                    </div>
                    <div class="form-group">
                        <label for="rfq-edit-date">Date d'émission *</label>
                        <input type="date" id="rfq-edit-date" name="date_emission" value="${rfq.date_emission ? rfq.date_emission.split('T')[0] : ''}" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="rfq-edit-destinataire">Fournisseur *</label>
                        <select id="rfq-edit-destinataire" name="destinataire_id" required>
                            <option value="">Sélectionner un fournisseur</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="rfq-edit-date-limite">Date limite de réponse</label>
                        <input type="date" id="rfq-edit-date-limite" name="date_limite_reponse" value="${rfq.date_limite_reponse ? rfq.date_limite_reponse.split('T')[0] : ''}">
                    </div>
                </div>
                <div class="form-group">
                    <label for="rfq-edit-description">Description *</label>
                    <textarea id="rfq-edit-description" name="description" required>${rfq.description || ''}</textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="rfq-edit-categorie">Catégorie</label>
                        <select id="rfq-edit-categorie" name="categorie_id">
                            <option value="">Sélectionner une catégorie</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="rfq-edit-date-livraison">Date de livraison souhaitée</label>
                        <input type="date" id="rfq-edit-date-livraison" name="date_livraison_souhaitee" value="${rfq.date_livraison_souhaitee ? rfq.date_livraison_souhaitee.split('T')[0] : ''}">
                    </div>
                </div>
                <div class="form-group">
                    <label for="rfq-edit-conditions">Conditions de paiement</label>
                    <textarea id="rfq-edit-conditions" name="conditions_paiement" rows="2">${rfq.conditions_paiement || ''}</textarea>
                </div>
                
                <div style="margin-top: 2rem; border-top: 2px solid var(--color-background-blue); padding-top: 1.5rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h4 style="margin: 0; color: var(--color-primary);"><i class="fas fa-box"></i> Lignes de la RFQ</h4>
                        <button type="button" class="btn btn-primary btn-sm" onclick="addLigneRFQEdit()">
                            <i class="fas fa-plus"></i> Ajouter une ligne
                        </button>
                    </div>
                    <div id="rfq-edit-lignes">
                        ${rfq.lignes && rfq.lignes.length > 0 ? rfq.lignes.map((ligne, index) => `
                            <div class="card" style="margin-bottom: 1rem; padding: 1rem;" data-ligne-index="${index}">
                                <div class="form-row">
                                    <div class="form-group" style="flex: 2;">
                                        <label>Description *</label>
                                        <input type="text" name="ligne-description[]" value="${ligne.description || ''}" required placeholder="Description du produit/service">
                                    </div>
                                    <div class="form-group">
                                        <label>Quantité *</label>
                                        <input type="number" name="ligne-quantite[]" value="${ligne.quantite || ''}" required min="0.01" step="0.01" placeholder="1">
                                    </div>
                                    <div class="form-group">
                                        <label>Unité</label>
                                        <input type="text" name="ligne-unite[]" value="${ligne.unite || 'unité'}" placeholder="unité">
                                    </div>
                                    <div class="form-group" style="flex: 1;">
                                        <label>Produit (optionnel)</label>
                                        <select name="ligne-produit[]" class="produit-select-edit">
                                            <option value="">Sélectionner</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <button type="button" class="btn btn-danger btn-sm" onclick="removeLigneRFQEdit(this)" style="margin-top: 1.75rem;">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label>Référence</label>
                                    <input type="text" name="ligne-reference[]" value="${ligne.reference || ''}" placeholder="Référence produit">
                                </div>
                                <div class="form-group">
                                    <label>Spécifications techniques</label>
                                    <textarea name="ligne-specifications[]" rows="2" placeholder="Spécifications détaillées...">${ligne.specifications || ''}</textarea>
                                </div>
                                <input type="hidden" name="ligne-id[]" value="${ligne.id || ''}">
                            </div>
                        `).join('') : `
                            <div class="empty-state" style="padding: 1rem; text-align: center; color: #666;">
                                <i class="fas fa-box" style="font-size: 2rem; margin-bottom: 0.5rem; opacity: 0.5;"></i>
                                <p>Aucune ligne. Cliquez sur "Ajouter une ligne" pour commencer.</p>
                            </div>
                        `}
                    </div>
                </div>
            </form>
        `;
        
        const footer = `
            <button class="btn btn-secondary" onclick="Modal.hide('edit-rfq')">Annuler</button>
            <button class="btn btn-primary" onclick="document.getElementById('rfq-edit-form').requestSubmit()">Enregistrer</button>
        `;
        
        const modal = new Modal('edit-rfq', 'Modifier RFQ', content, footer);
        modal.show();
        
        // Charger les données
        await loadFournisseurs('rfq-edit-destinataire', rfq.destinataire_id);
        await loadCategories('rfq-edit-categorie', rfq.categorie_id);
    } catch (error) {
        hideLoading();
        Toast.error('Erreur lors du chargement');
        console.error('Erreur:', error);
    }
}

async function handleUpdateRFQ(event, id) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    // Construire l'objet data avec les champs principaux
    const data = {
        date_emission: formData.get('date_emission'),
        date_limite_reponse: formData.get('date_limite_reponse') || null,
        destinataire_id: formData.get('destinataire_id'),
        contact_destinataire_id: null,
        categorie_id: formData.get('categorie_id') || null,
        description: formData.get('description'),
        lieu_livraison_id: null,
        date_livraison_souhaitee: formData.get('date_livraison_souhaitee') || null,
        incoterms: null,
        conditions_paiement: formData.get('conditions_paiement') || null,
        projet_id: null,
        centre_cout_id: null,
        lignes: []
    };
    
    // Récupérer les lignes
    const descriptions = formData.getAll('ligne-description[]');
    const quantites = formData.getAll('ligne-quantite[]');
    const unites = formData.getAll('ligne-unite[]');
    const produits = formData.getAll('ligne-produit[]');
    const specifications = formData.getAll('ligne-specifications[]');
    const references = formData.getAll('ligne-reference[]');
    const ligneIds = formData.getAll('ligne-id[]');
    
    for (let i = 0; i < descriptions.length; i++) {
        // Récupérer la référence du produit si un produit est sélectionné
        let reference = references[i] || null;
        if (!reference && produits[i]) {
            const ligneCards = document.querySelectorAll('#rfq-edit-lignes > .card');
            if (ligneCards[i]) {
                const produitSelect = ligneCards[i].querySelector('select[name="ligne-produit[]"]');
                if (produitSelect && produitSelect.value) {
                    const option = produitSelect.options[produitSelect.selectedIndex];
                    if (option && option.textContent) {
                        reference = option.textContent.split(' - ')[0] || null;
                    }
                }
            }
        }
        
        data.lignes.push({
            id: ligneIds[i] || null, // null pour nouvelles lignes
            description: descriptions[i],
            quantite: parseFloat(quantites[i]),
            unite: unites[i] || 'unité',
            produit_id: produits[i] || null,
            reference: reference || null,
            specifications: specifications[i] || null,
            ordre: i
        });
    }
    
    showLoading('Mise à jour de la RFQ...');
    
    try {
        const response = await apiCall(`/api/rfq/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        
        if (response && response.ok) {
            Toast.success('RFQ mise à jour avec succès');
            Modal.hide('edit-rfq');
            if (typeof loadRFQ === 'function') {
                loadRFQ();
            }
            if (window.location.pathname.includes('rfq-detail')) {
                window.location.reload();
            }
        } else {
            const error = await response.json().catch(() => ({ error: 'Erreur inconnue' }));
            Toast.error(error.error || 'Erreur lors de la mise à jour');
        }
    } catch (error) {
        Toast.error('Erreur de connexion: ' + error.message);
        console.error('Erreur:', error);
    } finally {
        hideLoading();
    }
}

// Formulaire d'édition Entreprise
async function editEntrepriseForm(id) {
    try {
        showLoading('Chargement de l\'entreprise...');
        const response = await apiCall(`/api/entreprises/${id}`);
        if (!response || !response.ok) {
            hideLoading();
            Toast.error('Erreur lors du chargement');
            return;
        }

        const entreprise = await response.json();
        hideLoading();

        const currentLogo = entreprise.logo_url ? String(entreprise.logo_url) : '';
        const logoBlock = `
            <div style="margin: 1.5rem 0 1rem 0; border-top: 2px solid var(--color-background-blue, #dbeafe); padding-top: 1rem;">
                <h3 style="margin: 0 0 0.75rem 0; color: var(--color-primary, #2563eb);">🖼️ Logo entreprise</h3>
                <div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap;">
                    <div style="width:72px; height:72px; border-radius:16px; background:#f8fafc; border:1px solid #e2e8f0; display:flex; align-items:center; justify-content:center; overflow:hidden;">
                        ${currentLogo
                            ? `<img src="${currentLogo}" alt="Logo" style="max-width:100%; max-height:100%; object-fit:contain;" onerror="this.remove();">`
                            : `<span style="font-weight:800; color:#0f172a;">${(entreprise.nom || 'CL').trim().slice(0,2).toUpperCase()}</span>`
                        }
                    </div>
                    <div style="flex:1; min-width:240px;">
                        <input type="file" id="ent-edit-logo-file" accept="image/png,image/jpeg,image/webp" />
                        <div style="font-size:12px; color:#64748b; margin-top:6px;">Formats: PNG/JPG/WEBP — max 2MB</div>
                    </div>
                    <div style="display:flex; gap:8px;">
                        <button type="button" class="btn btn-primary" onclick="handleUploadEntrepriseLogo(${id})">
                            <i class="fas fa-upload"></i> Uploader
                        </button>
                        ${currentLogo ? `
                            <button type="button" class="btn btn-secondary" onclick="handleDeleteEntrepriseLogo(${id})">
                                <i class="fas fa-trash"></i> Supprimer
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;

        const content = `
            <form id="entreprise-edit-form" onsubmit="handleUpdateEntreprise(event, ${id})">
                <div class="form-row">
                    <div class="form-group">
                        <label for="ent-edit-nom">Nom *</label>
                        <input type="text" id="ent-edit-nom" name="nom" value="${entreprise.nom || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="ent-edit-type">Type *</label>
                        <select id="ent-edit-type" name="type_entreprise" required>
                            <option value="">Sélectionner</option>
                            <option value="fournisseur" ${entreprise.type_entreprise === 'fournisseur' ? 'selected' : ''}>Fournisseur</option>
                            <option value="client" ${entreprise.type_entreprise === 'client' ? 'selected' : ''}>Client</option>
                            <option value="acheteur" ${entreprise.type_entreprise === 'acheteur' ? 'selected' : ''}>Acheteur</option>
                            <option value="transporteur" ${entreprise.type_entreprise === 'transporteur' ? 'selected' : ''}>Transporteur</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="ent-edit-raison-sociale">Raison sociale</label>
                        <input type="text" id="ent-edit-raison-sociale" name="raison_sociale" value="${entreprise.raison_sociale || ''}">
                    </div>
                    <div class="form-group">
                        <label for="ent-edit-forme-juridique">Forme juridique</label>
                        <select id="ent-edit-forme-juridique" name="forme_juridique">
                            <option value="">Sélectionner</option>
                            <option value="SARL" ${entreprise.forme_juridique === 'SARL' ? 'selected' : ''}>SARL</option>
                            <option value="SA" ${entreprise.forme_juridique === 'SA' ? 'selected' : ''}>SA</option>
                            <option value="SNC" ${entreprise.forme_juridique === 'SNC' ? 'selected' : ''}>SNC</option>
                            <option value="EURL" ${entreprise.forme_juridique === 'EURL' ? 'selected' : ''}>EURL</option>
                            <option value="Auto-entrepreneur" ${entreprise.forme_juridique === 'Auto-entrepreneur' ? 'selected' : ''}>Auto-entrepreneur</option>
                            <option value="Autre" ${entreprise.forme_juridique === 'Autre' ? 'selected' : ''}>Autre</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="ent-edit-rccm">RCCM *</label>
                        <input type="text" id="ent-edit-rccm" name="rccm" value="${entreprise.rccm || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="ent-edit-numero-contribuable">Numéro contribuable</label>
                        <input type="text" id="ent-edit-numero-contribuable" name="numero_contribuable" value="${entreprise.numero_contribuable || ''}">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="ent-edit-capital">Capital social (GNF)</label>
                        <input type="number" id="ent-edit-capital" name="capital_social" step="0.01" min="0" value="${entreprise.capital_social || ''}">
                    </div>
                    <div class="form-group">
                        <label for="ent-edit-secteur">Secteur d'activité</label>
                        <input type="text" id="ent-edit-secteur" name="secteur_activite" value="${entreprise.secteur_activite || ''}">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="ent-edit-email">Email</label>
                        <input type="email" id="ent-edit-email" name="email" value="${entreprise.email || ''}">
                    </div>
                    <div class="form-group">
                        <label for="ent-edit-telephone">Téléphone</label>
                        <input type="tel" id="ent-edit-telephone" name="telephone" value="${entreprise.telephone || ''}">
                    </div>
                </div>
                <div class="form-group">
                    <label for="ent-edit-site-web">Site web</label>
                    <input type="url" id="ent-edit-site-web" name="site_web" value="${entreprise.site_web || ''}">
                </div>
                <div class="form-group">
                    <label for="ent-edit-notes">Notes</label>
                    <textarea id="ent-edit-notes" name="notes" rows="3">${entreprise.notes || ''}</textarea>
                </div>
                ${logoBlock}
            </form>
        `;
        
        const footer = `
            <button class="btn btn-secondary" onclick="Modal.hide('edit-entreprise')">Annuler</button>
            <button class="btn btn-primary" onclick="document.getElementById('entreprise-edit-form').requestSubmit()">Enregistrer</button>
        `;
        
        const modal = new Modal('edit-entreprise', 'Modifier Entreprise', content, footer);
        modal.show();
    } catch (error) {
        hideLoading();
        Toast.error('Erreur lors du chargement');
        console.error('Erreur:', error);
    }
}

async function handleUploadEntrepriseLogo(id) {
    const input = document.getElementById('ent-edit-logo-file');
    const file = input && input.files ? input.files[0] : null;
    if (!file) {
        Toast.error('Sélectionnez un fichier logo');
        return;
    }

    const form = new FormData();
    form.append('logo', file);

    showLoading('Upload du logo...');
    try {
        const response = await apiCall(`/api/entreprises/${id}/logo`, {
            method: 'POST',
            body: form
        });

        if (response && response.ok) {
            Toast.success('Logo mis à jour');
            Modal.hide('edit-entreprise');
            if (typeof loadEntreprises === 'function') loadEntreprises();
        } else {
            const err = await response.json().catch(() => ({ error: 'Erreur inconnue' }));
            Toast.error(err.error || 'Erreur upload logo');
        }
    } catch (e) {
        Toast.error('Erreur upload logo');
    } finally {
        hideLoading();
    }
}

async function handleDeleteEntrepriseLogo(id) {
    confirmAction(
        'Supprimer le logo de cette entreprise ?',
        async () => {
            showLoading('Suppression du logo...');
            try {
                const response = await apiCall(`/api/entreprises/${id}/logo`, { method: 'DELETE' });
                if (response && response.ok) {
                    Toast.success('Logo supprimé');
                    Modal.hide('edit-entreprise');
                    if (typeof loadEntreprises === 'function') loadEntreprises();
                } else {
                    const err = await response.json().catch(() => ({ error: 'Erreur inconnue' }));
                    Toast.error(err.error || 'Erreur suppression logo');
                }
            } catch (e) {
                Toast.error('Erreur suppression logo');
            } finally {
                hideLoading();
            }
        }
    );
}

async function handleUpdateEntreprise(event, id) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    
    // Nettoyer les valeurs vides pour les convertir en null
    const cleanValue = (value) => {
        if (!value || value === '' || value === 'null' || value === 'undefined') return null;
        return value;
    };
    
    // Nettoyer les données
    if (data.capital_social && data.capital_social !== '') {
        data.capital_social = parseFloat(data.capital_social);
    } else {
        data.capital_social = null;
    }
    
    // Nettoyer tous les champs optionnels
    data.nom = data.nom.trim();
    data.raison_sociale = cleanValue(data.raison_sociale);
    data.rccm = cleanValue(data.rccm);
    data.numero_contribuable = cleanValue(data.numero_contribuable);
    data.forme_juridique = cleanValue(data.forme_juridique);
    data.secteur_activite = cleanValue(data.secteur_activite);
    data.siret = cleanValue(data.siret);
    data.tva_intracommunautaire = cleanValue(data.tva_intracommunautaire);
    data.email = cleanValue(data.email);
    data.telephone = cleanValue(data.telephone);
    data.site_web = cleanValue(data.site_web);
    data.notes = cleanValue(data.notes);
    
    showLoading('Mise à jour de l\'entreprise...');
    
    try {
        const response = await apiCall(`/api/entreprises/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        
        if (response && response.ok) {
            Toast.success('Entreprise mise à jour avec succès');
            Modal.hide('edit-entreprise');
            if (typeof loadEntreprises === 'function') {
                loadEntreprises();
            }
            if (window.location.pathname.includes('entreprises-detail')) {
                window.location.reload();
            }
        } else {
            const error = await response.json();
            Toast.error(error.error || 'Erreur lors de la mise à jour');
        }
    } catch (error) {
        Toast.error('Erreur de connexion');
    } finally {
        hideLoading();
    }
}

// Fonction pour charger les fournisseurs avec sélection
async function loadFournisseurs(selectId, selectedId = null) {
    try {
        const response = await apiCall('/api/entreprises?type_entreprise=fournisseur');
        if (response && response.ok) {
            const fournisseurs = await response.json();
            const select = document.getElementById(selectId);
            if (select) {
                select.innerHTML = '<option value="">Sélectionner un fournisseur</option>';
                fournisseurs.forEach(f => {
                    const option = document.createElement('option');
                    option.value = f.id;
                    option.textContent = f.nom;
                    if (selectedId && f.id == selectedId) {
                        option.selected = true;
                    }
                    select.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Erreur chargement fournisseurs:', error);
    }
}

// Fonction pour charger les catégories avec sélection
async function loadCategories(selectId, selectedId = null) {
    try {
        const response = await apiCall('/api/produits/categories');
        if (response && response.ok) {
            const categories = await response.json();
            const select = document.getElementById(selectId);
            if (select) {
                const firstOption = select.querySelector('option[value=""]') || document.createElement('option');
                if (!firstOption.value) {
                    firstOption.value = '';
                    firstOption.textContent = 'Sélectionner une catégorie';
                    select.innerHTML = '';
                    select.appendChild(firstOption);
                }
                categories.forEach(c => {
                    const option = document.createElement('option');
                    option.value = c.id;
                    option.textContent = c.libelle;
                    if (selectedId && c.id == selectedId) {
                        option.selected = true;
                    }
                    select.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Erreur chargement catégories:', error);
    }
}

// Export
window.createRFQForm = createRFQForm;
window.handleCreateRFQ = handleCreateRFQ;
window.editRFQForm = editRFQForm;
window.handleUpdateRFQ = handleUpdateRFQ;
window.createEntrepriseForm = createEntrepriseForm;
window.handleCreateEntreprise = handleCreateEntreprise;
window.editEntrepriseForm = editEntrepriseForm;
window.handleUpdateEntreprise = handleUpdateEntreprise;
window.handleUploadEntrepriseLogo = handleUploadEntrepriseLogo;
window.handleDeleteEntrepriseLogo = handleDeleteEntrepriseLogo;
window.toggleGeocodeEntreprise = toggleGeocodeEntreprise;
window.geocodeEntrepriseAddress = geocodeEntrepriseAddress;
window.useCurrentLocation = useCurrentLocation;
window.loadFournisseurs = loadFournisseurs;
window.loadCategories = loadCategories;
window.loadProjets = loadProjets;
window.loadCentresCout = loadCentresCout;

// Formulaire d'édition Devis (seulement si statut = brouillon)
async function editDevisForm(id) {
    try {
        showLoading('Chargement du devis...');
        const response = await apiCall(`/api/devis/${id}`);
        if (!response || !response.ok) {
            hideLoading();
            Toast.error('Erreur lors du chargement');
            return;
        }

        const devis = await response.json();
        
        if (devis.statut !== 'brouillon') {
            hideLoading();
            Toast.error('Seuls les devis en brouillon peuvent être modifiés');
            return;
        }

        // Charger la RFQ associée
        const rfqResponse = await apiCall(`/api/rfq/${devis.rfq_id}`);
        if (!rfqResponse || !rfqResponse.ok) {
            hideLoading();
            Toast.error('Erreur lors du chargement de la RFQ');
            return;
        }

        const rfq = await rfqResponse.json();
        hideLoading();

        // Générer le formulaire avec les données
        const lignesHTML = devis.lignes.map((ligne, index) => `
            <div class="card" style="margin-bottom: 1rem; padding: 1rem;">
                <h4 style="margin-bottom: 1rem;">Ligne ${index + 1}</h4>
                <div class="form-row">
                    <div class="form-group">
                        <label>Description</label>
                        <input type="text" value="${ligne.description || ''}" disabled style="background: #f0f0f0;">
                    </div>
                    <div class="form-group">
                        <label>Quantité</label>
                        <input type="number" value="${ligne.quantite}" disabled style="background: #f0f0f0;">
                    </div>
                    <div class="form-group">
                        <label>Unité</label>
                        <input type="text" value="${ligne.unite || ''}" disabled style="background: #f0f0f0;">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Prix unitaire HT (GNF) *</label>
                        <input type="number" name="ligne-prix[]" value="${ligne.prix_unitaire_ht || ''}" required min="0" step="0.01">
                    </div>
                    <div class="form-group">
                        <label>Remise (%)</label>
                        <input type="number" name="ligne-remise[]" value="${ligne.remise || 0}" min="0" max="100" step="0.01">
                    </div>
                    <div class="form-group">
                        <label>TVA (%)</label>
                        <input type="number" name="ligne-tva[]" value="${ligne.tva_taux || 20}" min="0" max="100" step="0.01">
                    </div>
                </div>
                <input type="hidden" name="ligne-rfq-id[]" value="${ligne.rfq_ligne_id || ''}">
                <input type="hidden" name="ligne-quantite[]" value="${ligne.quantite}">
                <input type="hidden" name="ligne-description[]" value="${ligne.description || ''}">
                <input type="hidden" name="ligne-unite[]" value="${ligne.unite || ''}">
            </div>
        `).join('');

        const content = `
            <div class="card" style="margin-bottom: 1.5rem; padding: 1rem; background: var(--color-background-blue);">
                <strong>RFQ:</strong> ${rfq.numero || '-'}<br>
                <strong>Fournisseur:</strong> ${devis.fournisseur_nom || '-'}
            </div>
            <form id="devis-edit-form" onsubmit="handleUpdateDevis(event, ${id})">
                <div class="form-row">
                    <div class="form-group">
                        <label for="devis-edit-numero">Numéro de devis</label>
                        <input type="text" id="devis-edit-numero" value="${devis.numero || ''}" readonly style="background: #f0f0f0;">
                    </div>
                    <div class="form-group">
                        <label for="devis-edit-date">Date d'émission *</label>
                        <input type="date" id="devis-edit-date" name="date_emission" value="${devis.date_emission ? devis.date_emission.split('T')[0] : ''}" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="devis-edit-date-validite">Date de validité</label>
                        <input type="date" id="devis-edit-date-validite" name="date_validite" value="${devis.date_validite ? devis.date_validite.split('T')[0] : ''}">
                    </div>
                    <div class="form-group">
                        <label for="devis-edit-delai-livraison">Délai de livraison (jours)</label>
                        <input type="number" id="devis-edit-delai-livraison" name="delai_livraison" value="${devis.delai_livraison || ''}" min="1">
                    </div>
                </div>
                <div class="form-group">
                    <label for="devis-edit-remise-globale">Remise globale (%)</label>
                    <input type="number" id="devis-edit-remise-globale" name="remise_globale" value="${devis.remise_globale || 0}" min="0" max="100" step="0.01">
                </div>
                <h3 style="margin: 1.5rem 0 1rem 0; color: var(--color-primary);"><i class="fas fa-box"></i> Lignes de devis</h3>
                <div id="devis-edit-lignes">
                    ${lignesHTML}
                </div>
                <div style="margin-top: 1.5rem; padding: 1rem; background: var(--color-background-blue); border-radius: 8px;">
                    <div class="form-row">
                        <div><strong>Total HT:</strong> <span id="devis-edit-total-ht">${formatCurrency(devis.total_ht || 0)}</span></div>
                        <div><strong>Total TVA:</strong> <span id="devis-edit-total-tva">${formatCurrency(devis.total_tva || 0)}</span></div>
                        <div><strong>Total TTC:</strong> <span id="devis-edit-total-ttc">${formatCurrency(devis.total_ttc || 0)}</span></div>
                    </div>
                </div>
                <div class="form-group" style="margin-top: 1.5rem;">
                    <label for="devis-edit-conditions-paiement">Conditions de paiement</label>
                    <textarea id="devis-edit-conditions-paiement" name="conditions_paiement" rows="2">${devis.conditions_paiement || ''}</textarea>
                </div>
                <div class="form-group">
                    <label for="devis-edit-garanties">Garanties</label>
                    <textarea id="devis-edit-garanties" name="garanties" rows="2">${devis.garanties || ''}</textarea>
                </div>
                <div class="form-group">
                    <label for="devis-edit-certifications">Certifications</label>
                    <textarea id="devis-edit-certifications" name="certifications" rows="2">${devis.certifications || ''}</textarea>
                </div>
                <div class="form-group">
                    <label for="devis-edit-notes">Notes complémentaires</label>
                    <textarea id="devis-edit-notes" name="notes" rows="3">${devis.notes || ''}</textarea>
                </div>
            </form>
        `;
        
        const footer = `
            <button class="btn btn-secondary" onclick="Modal.hide('edit-devis')">Annuler</button>
            <button class="btn btn-primary" onclick="document.getElementById('devis-edit-form').requestSubmit()">Enregistrer</button>
        `;
        
        const modal = new Modal('edit-devis', 'Modifier Devis', content, footer);
        modal.show();
        
        // Attacher les événements après l'affichage de la modale
        setTimeout(() => {
            const remiseGlobaleInput = document.getElementById('devis-edit-remise-globale');
            if (remiseGlobaleInput) {
                remiseGlobaleInput.addEventListener('input', calculateDevisTotals);
            }
            const prixInputs = document.querySelectorAll('#devis-edit-form input[name="ligne-prix[]"]');
            const remiseInputs = document.querySelectorAll('#devis-edit-form input[name="ligne-remise[]"]');
            const tvaInputs = document.querySelectorAll('#devis-edit-form input[name="ligne-tva[]"]');
            [...prixInputs, ...remiseInputs, ...tvaInputs].forEach(input => {
                input.addEventListener('input', calculateDevisTotals);
            });
        }, 100);
    } catch (error) {
        hideLoading();
        Toast.error('Erreur lors du chargement');
        console.error('Erreur:', error);
    }
}

function calculateDevisTotals() {
    const prixInputs = document.querySelectorAll('#devis-edit-form input[name="ligne-prix[]"]');
    const remiseInputs = document.querySelectorAll('#devis-edit-form input[name="ligne-remise[]"]');
    const tvaInputs = document.querySelectorAll('#devis-edit-form input[name="ligne-tva[]"]');
    const quantiteInputs = document.querySelectorAll('#devis-edit-form input[name="ligne-quantite[]"]');
    const remiseGlobaleInput = document.getElementById('devis-edit-remise-globale');
    
    if (!remiseGlobaleInput) return;
    
    const remiseGlobale = parseFloat(remiseGlobaleInput.value) || 0;

    let totalHT = 0;
    let totalTVA = 0;

    prixInputs.forEach((prixInput, index) => {
        const prix = parseFloat(prixInput.value) || 0;
        const quantite = parseFloat(quantiteInputs[index]?.value) || 0;
        const remise = parseFloat(remiseInputs[index]?.value) || 0;
        const tva = parseFloat(tvaInputs[index]?.value) || 20;

        const ligneHT = prix * quantite * (1 - remise / 100);
        const ligneTVA = ligneHT * (tva / 100);

        totalHT += ligneHT;
        totalTVA += ligneTVA;
    });

    totalHT = totalHT * (1 - remiseGlobale / 100);
    totalTVA = totalTVA * (1 - remiseGlobale / 100);
    const totalTTC = totalHT + totalTVA;

    const totalHTEl = document.getElementById('devis-edit-total-ht');
    const totalTVAEl = document.getElementById('devis-edit-total-tva');
    const totalTTCEl = document.getElementById('devis-edit-total-ttc');
    
    if (totalHTEl) totalHTEl.textContent = formatCurrency(totalHT);
    if (totalTVAEl) totalTVAEl.textContent = formatCurrency(totalTVA);
    if (totalTTCEl) totalTTCEl.textContent = formatCurrency(totalTTC);
}

async function handleUpdateDevis(event, id) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    const data = {
        date_emission: formData.get('date_emission'),
        date_validite: formData.get('date_validite') || null,
        delai_livraison: formData.get('delai_livraison') ? parseInt(formData.get('delai_livraison')) : null,
        remise_globale: parseFloat(formData.get('remise_globale')) || 0,
        conditions_paiement: formData.get('conditions_paiement') || null,
        garanties: formData.get('garanties') || null,
        certifications: formData.get('certifications') || null,
        notes: formData.get('notes') || null,
        lignes: []
    };

    // Récupérer les lignes
    const rfqLigneIds = formData.getAll('ligne-rfq-id[]');
    const prix = formData.getAll('ligne-prix[]');
    const remises = formData.getAll('ligne-remise[]');
    const tvas = formData.getAll('ligne-tva[]');
    const quantites = formData.getAll('ligne-quantite[]');
    const descriptions = formData.getAll('ligne-description[]');
    const unites = formData.getAll('ligne-unite[]');

    for (let i = 0; i < prix.length; i++) {
        const prixUnitaire = parseFloat(prix[i]);
        const quantite = parseFloat(quantites[i]);
        const remise = parseFloat(remises[i]) || 0;
        const tva = parseFloat(tvas[i]) || 20;

        data.lignes.push({
            rfq_ligne_id: rfqLigneIds[i] || null,
            description: descriptions[i],
            quantite: quantite,
            unite: unites[i],
            prix_unitaire_ht: prixUnitaire,
            remise: remise,
            tva_taux: tva,
            ordre: i
        });
    }

    showLoading('Mise à jour du devis...');
    
    try {
        const response = await apiCall(`/api/devis/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        
        if (response && response.ok) {
            Toast.success('Devis mis à jour avec succès');
            Modal.hide('edit-devis');
            if (typeof loadDevis === 'function') {
                loadDevis();
            }
        } else {
            const error = await response.json();
            Toast.error(error.error || 'Erreur lors de la mise à jour');
        }
    } catch (error) {
        Toast.error('Erreur de connexion');
    } finally {
        hideLoading();
    }
}

window.editDevisForm = editDevisForm;
window.handleUpdateDevis = handleUpdateDevis;
window.calculateDevisTotals = calculateDevisTotals;

