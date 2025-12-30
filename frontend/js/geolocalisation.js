// Gestion de la géolocalisation

// Géocoder une adresse (obtenir les coordonnées GPS)
async function geocodeAddress(adresse, ville, pays = 'Guinée') {
    try {
        const response = await apiCall('/api/adresses/geocode', {
            method: 'POST',
            body: JSON.stringify({ adresse, ville, pays })
        });

        if (response && response.ok) {
            const data = await response.json();
            return {
                latitude: data.latitude,
                longitude: data.longitude,
                display_name: data.display_name
            };
        }
        return null;
    } catch (error) {
        console.error('Erreur géocodage:', error);
        return null;
    }
}

// Formulaire d'ajout d'adresse avec géolocalisation
function createAdresseForm(entrepriseId) {
    const content = `
        <form id="adresse-form" onsubmit="handleCreateAdresse(event, ${entrepriseId})">
            <div class="form-group">
                <label for="addr-type">Type d'adresse *</label>
                <select id="addr-type" name="type_adresse" required>
                    <option value="siege">Siège social</option>
                    <option value="facturation">Facturation</option>
                    <option value="livraison">Livraison</option>
                    <option value="autre">Autre</option>
                </select>
            </div>
            <div class="form-group">
                <label for="addr-libelle">Libellé</label>
                <input type="text" id="addr-libelle" name="libelle" placeholder="Ex: Siège principal">
            </div>
            <div class="form-group">
                <label for="addr-ligne1">Adresse ligne 1</label>
                <input type="text" id="addr-ligne1" name="adresse_ligne1" placeholder="Optionnel si ville remplie">
                <small style="color: var(--color-neutral); font-size: 0.75rem;">
                    💡 Au moins l'adresse ligne 1 ou la ville doit être remplie
                </small>
            </div>
            <div class="form-group">
                <label for="addr-ligne2">Adresse ligne 2</label>
                <input type="text" id="addr-ligne2" name="adresse_ligne2">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="addr-code-postal">Code postal</label>
                    <input type="text" id="addr-code-postal" name="code_postal" placeholder="Optionnel">
                </div>
                <div class="form-group">
                    <label for="addr-ville">Ville *</label>
                    <input type="text" id="addr-ville" name="ville" required>
                </div>
            </div>
            <div class="form-group">
                <label for="addr-pays">Pays</label>
                <input type="text" id="addr-pays" name="pays" value="Guinée">
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" id="addr-geocode" onchange="toggleGeocode()">
                    Géolocaliser automatiquement cette adresse
                </label>
            </div>
            <div id="geocode-section" class="hidden">
                <div class="form-row">
                    <div class="form-group">
                        <label for="addr-latitude">Latitude (optionnel)</label>
                        <input type="text" id="addr-latitude" name="latitude" 
                               pattern="^-?[0-9]+([.,][0-9]+)?$"
                               placeholder="Ex: 9.6412 ou 9,6412"
                               title="Format: nombre décimal avec point ou virgule">
                        <small style="color: var(--color-neutral); font-size: 0.75rem;">
                            Format: 9.6412 ou 9,6412 (entre -90 et 90)
                        </small>
                    </div>
                    <div class="form-group">
                        <label for="addr-longitude">Longitude (optionnel)</label>
                        <input type="text" id="addr-longitude" name="longitude" 
                               pattern="^-?[0-9]+([.,][0-9]+)?$"
                               placeholder="Ex: -13.5784 ou -13,5784"
                               title="Format: nombre décimal avec point ou virgule">
                        <small style="color: var(--color-neutral); font-size: 0.75rem;">
                            Format: -13.5784 ou -13,5784 (entre -180 et 180)
                        </small>
                    </div>
                </div>
                <button type="button" class="btn btn-secondary" onclick="geocodeCurrentAddress()" style="width: 100%; margin-bottom: 0.5rem;">
                    <i class="fas fa-search"></i> Géocoder l'adresse automatiquement
                </button>
                <button type="button" class="btn btn-secondary" onclick="useCurrentLocationForAdresse()" style="width: 100%;">
                    📍 Utiliser ma position actuelle
                </button>
                <div style="margin-top: 1rem; padding: 0.75rem; background: var(--color-background-blue); border-radius: 8px; font-size: 0.875rem;">
                    💡 <strong>Note:</strong> La géolocalisation est optionnelle. Vous pouvez créer l'adresse sans coordonnées GPS.
                </div>
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" name="principal">
                    Adresse principale
                </label>
            </div>
        </form>
    `;

    const footer = `
        <button class="btn btn-secondary" onclick="Modal.hide('create-adresse')">Annuler</button>
        <button class="btn btn-primary" onclick="document.getElementById('adresse-form').requestSubmit()">Créer</button>
    `;

    const modal = new Modal('create-adresse', 'Nouvelle Adresse', content, footer);
    modal.show();
}

function toggleGeocode() {
    const checkbox = document.getElementById('addr-geocode');
    const section = document.getElementById('geocode-section');
    if (checkbox.checked) {
        section.classList.remove('hidden');
    } else {
        section.classList.add('hidden');
    }
}

async function geocodeCurrentAddress() {
    const adresse = document.getElementById('addr-ligne1').value;
    const ville = document.getElementById('addr-ville').value;
    const pays = document.getElementById('addr-pays').value || 'Guinée';

    if (!adresse || !ville) {
        Toast.warning('Veuillez remplir l\'adresse et la ville');
        return;
    }

    showLoading('Géocodage en cours...');
    const result = await geocodeAddress(adresse, ville, pays);
    hideLoading();

    if (result) {
        // Formater les coordonnées avec un point (format standard)
        document.getElementById('addr-latitude').value = result.latitude.toFixed(8);
        document.getElementById('addr-longitude').value = result.longitude.toFixed(8);
        Toast.success('Adresse géocodée avec succès');
    } else {
        Toast.error('Impossible de géocoder cette adresse');
    }
}

async function handleCreateAdresse(event, entrepriseId) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    data.entreprise_id = entrepriseId;
    data.principal = data.principal === 'on';

    // Nettoyer et convertir les coordonnées GPS (gérer virgule et point)
    let latitude = null;
    let longitude = null;
    
    if (data.latitude && data.latitude.trim() !== '') {
        const latStr = String(data.latitude).replace(',', '.');
        const latNum = parseFloat(latStr);
        if (!isNaN(latNum) && latNum >= -90 && latNum <= 90) {
            latitude = latNum;
        } else {
            Toast.warning('Latitude invalide. Valeur ignorée.');
        }
    }
    
    if (data.longitude && data.longitude.trim() !== '') {
        const lngStr = String(data.longitude).replace(',', '.');
        const lngNum = parseFloat(lngStr);
        if (!isNaN(lngNum) && lngNum >= -180 && lngNum <= 180) {
            longitude = lngNum;
        } else {
            Toast.warning('Longitude invalide. Valeur ignorée.');
        }
    }

    data.latitude = latitude;
    data.longitude = longitude;

    showLoading('Création de l\'adresse...');

    try {
        const response = await apiCall('/api/adresses', {
            method: 'POST',
            body: JSON.stringify(data)
        });

        if (response && response.ok) {
            Toast.success('Adresse créée avec succès');
            Modal.hide('create-adresse');
            // Recharger la page de détails si on y est
            if (window.location.pathname.includes('entreprises-detail')) {
                window.location.reload();
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

// Fonction pour obtenir la position actuelle de l'utilisateur
function getCurrentPosition() {
    return new Promise((resolve, reject) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                position => resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                }),
                error => reject(error)
            );
        } else {
            reject(new Error('Géolocalisation non supportée'));
        }
    });
}

// Utiliser la position actuelle pour le formulaire d'adresse
async function useCurrentLocationForAdresse() {
    if (navigator.geolocation) {
        showLoading('Récupération de votre position...');
        navigator.geolocation.getCurrentPosition(
            position => {
                // Formater les coordonnées avec un point (format standard)
                document.getElementById('addr-latitude').value = position.coords.latitude.toFixed(8);
                document.getElementById('addr-longitude').value = position.coords.longitude.toFixed(8);
                hideLoading();
                Toast.success('Position actuelle récupérée');
            },
            error => {
                hideLoading();
                Toast.error('Impossible de récupérer votre position: ' + error.message);
            }
        );
    } else {
        Toast.error('Géolocalisation non supportée par votre navigateur');
    }
}

// Supprimer une adresse
async function deleteAdresse(id) {
    confirmAction(
        'Êtes-vous sûr de vouloir supprimer cette adresse ?',
        async () => {
            try {
                showLoading('Suppression...');
                const response = await apiCall(`/api/adresses/${id}`, { method: 'DELETE' });
                if (response && response.ok) {
                    Toast.success('Adresse supprimée');
                    // Recharger la page pour voir les changements
                    window.location.reload();
                } else {
                    const error = await response.json();
                    Toast.error(error.error || 'Erreur lors de la suppression');
                }
            } catch (error) {
                Toast.error('Erreur de connexion');
            } finally {
                hideLoading();
            }
        }
    );
}

// Export
window.createAdresseForm = createAdresseForm;
window.handleCreateAdresse = handleCreateAdresse;
window.geocodeAddress = geocodeAddress;
window.geocodeCurrentAddress = geocodeCurrentAddress;
window.getCurrentPosition = getCurrentPosition;
window.useCurrentLocationForAdresse = useCurrentLocationForAdresse;
window.deleteAdresse = deleteAdresse;

