// Composant d'upload de fichiers joints
// Protection contre la redéclaration si le fichier est chargé plusieurs fois
if (typeof FileUploadManager === 'undefined') {
class FileUploadManager {
    constructor(typeDocument, documentId) {
        this.typeDocument = typeDocument;
        this.documentId = documentId;
        this.fichiers = [];
    }

    async loadFiles() {
        try {
            const response = await apiCall(`/api/fichiers/${this.typeDocument}/${this.documentId}`);
            if (response && response.ok) {
                this.fichiers = await response.json();
                return this.fichiers;
            }
            return [];
        } catch (error) {
            console.error('Erreur chargement fichiers:', error);
            return [];
        }
    }

    render(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const html = `
            <div class="card" style="margin-top: 1.5rem;">
                <div class="card-header">
                    <h3 class="card-title"><i class="fas fa-paperclip"></i> Fichiers joints</h3>
                    <button class="btn btn-primary btn-sm" onclick="fileUploadManager.showUploadModal()">
                        <i class="fas fa-upload"></i> Ajouter un fichier
                    </button>
                </div>
                <div style="padding: 1.5rem;">
                    <div id="fichiers-list">
                        <div class="loading">Chargement des fichiers...</div>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;
        this.updateFilesList();
    }

    async updateFilesList() {
        await this.loadFiles();
        const listContainer = document.getElementById('fichiers-list');
        if (!listContainer) return;

        if (this.fichiers.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon"><i class="fas fa-paperclip"></i></div>
                    <div class="empty-state-text">Aucun fichier joint</div>
                </div>
            `;
            return;
        }

        listContainer.innerHTML = this.fichiers.map(fichier => {
            const date = new Date(fichier.date_upload);
            const dateStr = date.toLocaleDateString('fr-FR', { 
                day: 'numeric', 
                month: 'short', 
                year: 'numeric',
                hour: '2-digit', 
                minute: '2-digit' 
            });
            
            const tailleStr = this.formatFileSize(fichier.taille_fichier);
            const icon = this.getFileIcon(fichier.type_mime);
            
            return `
                <div style="padding: 1rem; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; gap: 1rem; align-items: center; flex: 1;">
                        <div style="font-size: 2rem; color: #3B82F6;">${icon}</div>
                        <div style="flex: 1;">
                            <div style="font-weight: 600; margin-bottom: 0.25rem;">${fichier.nom_fichier}</div>
                            <div style="font-size: 0.875rem; color: #666;">
                                ${tailleStr} • ${dateStr}
                                ${fichier.uploader_nom ? ` • Par ${fichier.uploader_prenom || ''} ${fichier.uploader_nom}` : ''}
                            </div>
                            ${fichier.description ? `<div style="font-size: 0.875rem; color: #999; margin-top: 0.25rem;">${fichier.description}</div>` : ''}
                        </div>
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                        <a href="/api/fichiers/download/${fichier.id}" class="btn btn-secondary btn-sm" download>
                            <i class="fas fa-download"></i> Télécharger
                        </a>
                        <button class="btn btn-danger btn-sm" onclick="fileUploadManager.deleteFile(${fichier.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    showUploadModal() {
        const modalContent = `
            <form id="upload-file-form" onsubmit="fileUploadManager.handleUpload(event)">
                <div class="form-group">
                    <label>Fichier *</label>
                    <input type="file" id="file-input" name="file" required 
                           accept="image/*,application/pdf,.xlsx,.xls,.doc,.docx,.txt,.csv,.zip">
                    <small style="color: #666;">Types autorisés: Images, PDF, Excel, Word, Texte, ZIP (max 50MB)</small>
                </div>
                <div class="form-group">
                    <label>Description (optionnel)</label>
                    <textarea id="file-description" class="form-control" rows="2" 
                              placeholder="Ex: Contrat signé, Facture originale..."></textarea>
                </div>
                <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem;">
                    <button type="button" class="btn btn-secondary" onclick="Modal.hide('upload-file')">Annuler</button>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-upload"></i> Uploader
                    </button>
                </div>
            </form>
        `;

        const modal = new Modal('upload-file', 'Ajouter un fichier', modalContent);
        modal.show();
    }

    async handleUpload(event) {
        event.preventDefault();
        
        const fileInput = document.getElementById('file-input');
        const description = document.getElementById('file-description')?.value || '';

        if (!fileInput.files || fileInput.files.length === 0) {
            Toast.error('Veuillez sélectionner un fichier');
            return;
        }

        const file = fileInput.files[0];
        
        // Vérifier la taille (50MB)
        if (file.size > 50 * 1024 * 1024) {
            Toast.error('Le fichier est trop volumineux (max 50MB)');
            return;
        }

        try {
            showLoading('Upload en cours...');

            const formData = new FormData();
            formData.append('file', file);
            if (description) {
                formData.append('description', description);
            }

            const response = await fetch(`/api/fichiers/${this.typeDocument}/${this.documentId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({ error: 'Erreur inconnue' }));
                throw new Error(error.error || 'Erreur lors de l\'upload');
            }

            const data = await response.json();
            hideLoading();
            Toast.success('Fichier uploadé avec succès');
            Modal.hide('upload-file');
            
            // Réinitialiser le formulaire
            document.getElementById('upload-file-form')?.reset();
            
            // Recharger la liste des fichiers
            await this.updateFilesList();
        } catch (error) {
            hideLoading();
            Toast.error(error.message || 'Erreur lors de l\'upload');
            console.error('Erreur upload:', error);
        }
    }

    async deleteFile(fileId) {
        if (!confirm('Voulez-vous supprimer ce fichier ?')) {
            return;
        }

        try {
            const response = await apiCall(`/api/fichiers/${fileId}`, { method: 'DELETE' });
            if (response && response.ok) {
                Toast.success('Fichier supprimé');
                await this.updateFilesList();
            } else {
                const error = await response.json().catch(() => ({ error: 'Erreur inconnue' }));
                Toast.error(error.error || 'Erreur lors de la suppression');
            }
        } catch (error) {
            Toast.error('Erreur de connexion');
            console.error('Erreur:', error);
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    getFileIcon(mimeType) {
        const icons = {
            'image': '<i class="fas fa-image"></i>',
            'application/pdf': '<i class="fas fa-file-pdf"></i>',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '<i class="fas fa-file-excel"></i>',
            'application/vnd.ms-excel': '<i class="fas fa-file-excel"></i>',
            'application/msword': '<i class="fas fa-file-word"></i>',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '<i class="fas fa-file-word"></i>',
            'text': '<i class="fas fa-file-alt"></i>',
            'application/zip': '<i class="fas fa-file-archive"></i>'
        };

        if (mimeType && mimeType.startsWith('image/')) return icons['image'];
        if (mimeType && mimeType.startsWith('text/')) return icons['text'];
        return icons[mimeType] || '<i class="fas fa-file"></i>';
    }
    
    // Exposer la classe globalement
    window.FileUploadManager = FileUploadManager;
}

// Fonction helper pour initialiser le gestionnaire de fichiers
function initFileUpload(typeDocument, documentId, containerId) {
    if (typeof FileUploadManager === 'undefined') {
        console.error('FileUploadManager n\'est pas défini');
        return null;
    }
    window.fileUploadManager = new FileUploadManager(typeDocument, documentId);
    window.fileUploadManager.render(containerId);
    return window.fileUploadManager;
}

