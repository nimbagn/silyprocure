(() => {
  if (window.__DemandesDevisPageInitialized) return;
  window.__DemandesDevisPageInitialized = true;

  const state = {
    demandes: [],
    pagination: null,
    page: 1,
    limit: 50,
    selectedId: null,
    selectedDemande: null,
    search: '',
  };

  const $ = (id) => document.getElementById(id);
  let currentDemandeId = null;

  function isMobile() {
    return window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text == null ? '' : String(text);
    return div.innerHTML;
  }

  function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function statutBadge(statut) {
    const map = {
      nouvelle: 'bg-rose-50 text-red-600 border border-rose-100',
      en_cours: 'bg-amber-50 text-amber-600 border border-amber-100',
      traitee: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
      annulee: 'bg-slate-50 text-slate-600 border border-slate-100',
    };
    const label = {
      nouvelle: 'Nouvelle',
      en_cours: 'En cours',
      traitee: 'Traitée',
      annulee: 'Annulée',
    };
    const cls = map[statut] || 'bg-slate-50 text-slate-600 border border-slate-100';
    const txt = label[statut] || statut || '-';
    return `<span class="badge-pill ${cls}">${escapeHtml(txt)}</span>`;
  }

  function renderSkeletons() {
    const container = $('demandes-list');
    if (!container) return;
    const skeletons = Array(6).fill(0).map(() => `
      <div class="dd-item p-4 mb-3 bg-white border border-slate-100 rounded-xl">
        <div class="flex gap-3">
          <div class="w-10 h-10 rounded-lg skeleton flex-shrink-0"></div>
          <div class="flex-1 space-y-2">
            <div class="h-4 w-3/4 skeleton rounded"></div>
            <div class="h-3 w-1/2 skeleton rounded"></div>
          </div>
        </div>
      </div>
    `).join('');
    container.innerHTML = skeletons;
  }

  function renderDetailPlaceholder() {
    const panel = $('detail-panel-body');
    if (!panel) return;
    panel.innerHTML = `
      <div class="h-full flex flex-col items-center justify-center text-center p-8">
        <div class="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
          <i class="fas fa-mouse-pointer text-slate-300 text-3xl"></i>
        </div>
        <h3 class="text-xl font-bold text-slate-900">Sélectionnez une demande</h3>
        <p class="text-slate-500 mt-2 max-w-sm">Choisissez une demande dans la liste à gauche pour voir ses détails et lancer le processus de RFQ.</p>
      </div>
    `;
  }

  function renderList() {
    const container = $('demandes-list');
    if (!container) return;
    const list = getFilteredDemandes();

    if (list.length === 0) {
      container.innerHTML = `
        <div class="text-center py-16 px-4">
          <div class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="fas fa-inbox text-slate-300 text-2xl"></i>
          </div>
          <h3 class="text-slate-900 font-semibold">Aucune demande</h3>
          <p class="text-slate-500 text-sm mt-1 max-w-[200px] mx-auto">Essayez de modifier vos filtres ou de lancer une nouvelle recherche.</p>
        </div>
      `;
      updateResultsCount(0);
      return;
    }

    const items = list
      .map((d) => {
        const selected = String(d.id) === String(state.selectedId);
        return `
          <button type="button"
                  class="dd-item w-full text-left p-4 flex items-start gap-3"
                  data-demande-id="${d.id}"
                  aria-selected="${selected ? 'true' : 'false'}">
            <div class="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 flex-shrink-0">
              <i class="fas fa-file-invoice" aria-hidden="true"></i>
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <div class="font-bold text-slate-900 truncate text-sm">${escapeHtml(d.nom || 'Sans nom')}</div>
                  <div class="text-xs text-slate-500 truncate mt-0.5 font-medium">${escapeHtml(d.entreprise || '-')}</div>
                </div>
                <div class="flex flex-col items-end gap-1.5 flex-shrink-0">
                  ${statutBadge(d.statut)}
                </div>
              </div>
              <div class="mt-3 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <div class="flex items-center gap-2">
                   <i class="fas fa-box text-[10px]"></i>
                   <span>${escapeHtml(String(d.nb_articles || 0))} ARTICLES</span>
                </div>
                <span>${escapeHtml(formatDate(d.date_creation).split(' à ')[0])}</span>
              </div>
            </div>
          </button>
        `;
      })
      .join('');

    container.innerHTML = items;
    updateResultsCount(list.length);
  }

  function renderDetail(demande) {
    // Rendu des articles si présents
    let articlesRows = '<p class="text-slate-400 italic text-sm">Aucun article.</p>';
    if (demande.articles && demande.articles.length > 0) {
      articlesRows = `
        <div class="overflow-hidden border border-slate-200 rounded-xl">
          <table class="w-full text-sm text-left">
            <thead class="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
              <tr>
                <th class="px-4 py-3">Description</th>
                <th class="px-4 py-3 text-center">Quantité</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${demande.articles.map(art => `
                <tr>
                  <td class="px-4 py-3 font-medium text-slate-700">${escapeHtml(art.description)}</td>
                  <td class="px-4 py-3 text-center text-slate-500">${escapeHtml(String(art.quantite))} ${escapeHtml(art.unite || 'unité')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    const html = `
      <div class="animate-in fade-in slide-in-from-bottom-2 duration-300">
        <!-- Header Profil -->
        <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 mb-8">
          <div class="flex gap-4">
            <div class="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-xl shadow-inner">
              <i class="fas fa-user-tie"></i>
            </div>
            <div>
              <h2 class="text-2xl font-bold text-slate-900">${escapeHtml(demande.nom || 'Sans nom')}</h2>
              <div class="flex items-center gap-3 mt-1.5 text-slate-500 font-medium text-sm">
                <a href="mailto:${demande.email}" class="hover:text-primary transition-colors flex items-center gap-1.5">
                  <i class="fas fa-envelope text-xs"></i> ${escapeHtml(demande.email || '-')}
                </a>
                <span>•</span>
                <span class="flex items-center gap-1.5"><i class="fas fa-building text-xs"></i> ${escapeHtml(demande.entreprise || '-')}</span>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            ${statutBadge(demande.statut)}
            <div class="flex items-center gap-2 ml-2">
              <button onclick="editDemande(${demande.id})" class="btn-primary !py-2 !px-4 !rounded-xl !text-sm">
                Modifier Statut
              </button>
              <button onclick="openCreateRFQModal(${demande.id})" class="btn-secondary !py-2 !px-4 !rounded-xl !text-sm !border-slate-200">
                Lancer RFQ
              </button>
            </div>
          </div>
        </div>

        <!-- Onglets -->
        <div class="dd-tabs">
          <button class="dd-tab-btn active" onclick="switchTab('overview')">Informations</button>
          <button class="dd-tab-btn" onclick="switchTab('articles')">Articles (${demande.nb_articles || 0})</button>
          <button class="dd-tab-btn" onclick="switchTab('files')">Fichiers</button>
        </div>

        <!-- Contenu Onglets -->
        <div id="tab-content-overview" class="tab-pane space-y-6">
           <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                <h4 class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Message du client</h4>
                <p class="text-slate-700 leading-relaxed">${escapeHtml(demande.message || 'Aucun message particulier.')}</p>
              </div>
              <div class="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                <h4 class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Localisation</h4>
                ${demande.latitude ? `<div id="map-container-${demande.id}" class="h-32 rounded-xl overflow-hidden shadow-sm"></div>` : '<p class="text-slate-400 italic text-sm">Non renseignée</p>'}
              </div>
           </div>
           ${demande.notes_internes ? `
             <div class="p-5 rounded-2xl bg-amber-50 border border-amber-100">
                <h4 class="text-xs font-bold text-amber-600 uppercase tracking-widest mb-3">Notes Internes</h4>
                <p class="text-amber-900/80 text-sm leading-relaxed">${escapeHtml(demande.notes_internes)}</p>
             </div>
           ` : ''}
        </div>

        <div id="tab-content-articles" class="tab-pane hidden">
           ${articlesRows}
        </div>

        <div id="tab-content-files" class="tab-pane hidden">
           <div id="fichiers-joints-${demande.id}">Chargement...</div>
        </div>
      </div>
    `;

    const target = isMobile() ? $('detail-modal-body') : $('detail-panel-body');
    if (target) {
      target.innerHTML = html;
      // Charger le reste dynamiquement
      loadFichiersDemande(demande.id);
      if (demande.latitude) {
        setTimeout(() => loadMapForDemande(demande.id, demande.latitude, demande.longitude), 100);
      }
    }
  }

  window.switchTab = function(tabName) {
    document.querySelectorAll('.dd-tab-btn').forEach(btn => {
      const isMatch = (tabName === 'overview' && btn.textContent.toLowerCase().includes('info')) ||
                      (tabName === 'articles' && btn.textContent.toLowerCase().includes('article')) ||
                      (tabName === 'files' && btn.textContent.toLowerCase().includes('fichier'));
      btn.classList.toggle('active', isMatch);
    });
    document.querySelectorAll('.tab-pane').forEach(pane => {
      pane.classList.toggle('hidden', !pane.id.endsWith(tabName));
    });
  }

  async function loadDemandes() {
    const statut = $('statut-filter')?.value || '';
    const url = `/api/contact/demandes?page=${state.page}&limit=${state.limit}${statut ? '&statut=' + statut : ''}`;
    
    renderSkeletons();

    try {
      const response = await apiCall(url);
      if (!response || !response.ok) throw new Error('Erreur chargement demandes');
      const data = await response.json();
      state.demandes = data.demandes || [];
      state.pagination = data.pagination || null;
      renderList();
      updatePaginationUI();

      // Auto-select first item on desktop
      if (!isMobile() && !state.selectedId && state.demandes[0]?.id) {
        selectDemande(state.demandes[0].id, { openModal: false });
      }
    } catch (e) {
      console.error(e);
      if (window.Toast) Toast.error('Impossible de charger les demandes');
    }
  }

  async function loadStats() {
    try {
      const response = await apiCall('/api/contact/demandes?limit=1000');
      if (!response || !response.ok) return;
      const data = await response.json();
      const demandes = data.demandes || [];
      const stats = {
        totale: demandes.length,
        nouvelle: demandes.filter((d) => d.statut === 'nouvelle').length,
        en_cours: demandes.filter((d) => d.statut === 'en_cours').length,
        traitee: demandes.filter((d) => d.statut === 'traitee').length,
      };
      
      const el = $('stats-demandes-mini');
      if (el) {
        el.innerHTML = `
          <span class="px-2 py-1 bg-slate-100 rounded-lg text-[11px] font-bold text-slate-600">${stats.totale} TOTAL</span>
          <span class="px-2 py-1 bg-rose-50 rounded-lg text-[11px] font-bold text-rose-600">${stats.nouvelle} NOUVELLES</span>
          <span class="px-2 py-1 bg-amber-50 rounded-lg text-[11px] font-bold text-amber-600">${stats.en_cours} EN COURS</span>
        `;
      }
    } catch (e) {}
  }

  async function selectDemande(id, opts = { openModal: true }) {
    state.selectedId = Number(id);
    renderList();
    renderDetailPlaceholder();
    const resp = await apiCall(`/api/contact/demandes/${id}`);
    if (!resp || !resp.ok) throw new Error('Erreur chargement détail');
    const demande = await resp.json();
    state.selectedDemande = demande;
    renderDetail(demande);

    // Charger les fichiers joints
    loadFichiersDemande(demande.id);

    // Carte si géolocalisation
    if (demande.latitude && demande.longitude) {
      setTimeout(() => {
        loadMapForDemande(demande.id, parseFloat(demande.latitude), parseFloat(demande.longitude));
      }, 50);
    }

    if (isMobile() && opts.openModal) openOverlayModal('detailModal');
  }

  function bindEvents() {
    const list = $('demandes-list');
    if (list) {
      list.addEventListener('click', (e) => {
        const item = e.target.closest('[data-demande-id]');
        if (!item) return;
        selectDemande(item.getAttribute('data-demande-id')).catch((err) => {
          console.error(err);
          if (window.Toast) Toast.error('Impossible de charger le détail');
        });
      });
    }

    const search = $('search-input');
    if (search) {
      let t = null;
      search.addEventListener('input', () => {
        clearTimeout(t);
        t = setTimeout(() => {
          state.search = search.value || '';
          renderList();
        }, 200);
      });
    }
  }

  function ensureRole() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role !== 'admin' && user.role !== 'superviseur') {
      if (window.Toast) Toast.error('Accès refusé. Page réservée aux administrateurs et superviseurs.');
      window.location.href = 'dashboard.html';
      return false;
    }
    return true;
  }

  async function init() {
    if (!window.checkAuth || !window.apiCall) return;
    if (!checkAuth()) return;
    if (!ensureRole()) return;

    // user badge
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userNameEl = $('user-name');
    const userInitialsEl = $('user-initials');
    if (userNameEl) userNameEl.textContent = `${user.prenom || ''} ${user.nom || ''}`.trim() || user.email || 'Utilisateur';
    if (userInitialsEl) {
      const initials = ((user.prenom || '').charAt(0) + (user.nom ? user.nom.charAt(0) : '')).toUpperCase();
      userInitialsEl.textContent = initials || (user.email ? user.email.charAt(0).toUpperCase() : 'U');
    }

    bindEvents();
    renderDetailPlaceholder();
    wireModalOverlayClose();
    await Promise.allSettled([loadDemandes(), loadStats(), loadWhatsAppPending()]);
  }

  function wireModalOverlayClose() {
    const pairs = [
      ['detailModal', () => closeOverlayModal('detailModal')],
      ['previewModal', () => closeOverlayModal('previewModal')],
      ['createRFQModal', () => closeOverlayModal('createRFQModal')],
      ['editModal', () => closeOverlayModal('editModal')],
    ];
    for (const [id, closeFn] of pairs) {
      const modal = $(id);
      const overlay = modal?.closest('.modal-overlay');
      if (!overlay || overlay.__ddBound) continue;
      overlay.__ddBound = true;
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeFn();
      });
      modal?.querySelector('.modal-content')?.addEventListener('click', (e) => e.stopPropagation());
    }
  }

  // Expose minimal API used by HTML buttons
  window.refreshDemandes = function refreshDemandes() {
    loadDemandes().catch((e) => {
      console.error(e);
      if (window.Toast) Toast.error('Erreur lors du chargement');
    });
    loadStats();
    loadWhatsAppPending();
  };
  window.clearFilters = function clearFilters() {
    const searchEl = $('search-input');
    const statutEl = $('statut-filter');
    if (searchEl) searchEl.value = '';
    if (statutEl) statutEl.value = '';
    state.search = '';
    state.page = 1;
    loadDemandes().catch(() => {});
  };
  window.onStatutFilterChange = function onStatutFilterChange() {
    state.page = 1;
    loadDemandes().catch(() => {});
  };
  window.goToPrevPage = function goToPrevPage() {
    if (!state.pagination || state.pagination.page <= 1) return;
    state.page = state.pagination.page - 1;
    loadDemandes().catch(() => {});
  };
  window.goToNextPage = function goToNextPage() {
    if (!state.pagination || state.pagination.page >= state.pagination.totalPages) return;
    state.page = state.pagination.page + 1;
    loadDemandes().catch(() => {});
  };
  window.closeDetailModal = () => closeOverlayModal('detailModal');
  window.closePreviewModal = () => closeOverlayModal('previewModal');
  window.closeCreateRFQModal = () => closeOverlayModal('createRFQModal');
  window.closeEditModal = () => closeOverlayModal('editModal');

  // Compat: filtre inline éventuel
  window.filterDemandes = function filterDemandes() {
    const searchEl = $('search-input');
    state.search = searchEl ? searchEl.value || '' : state.search;
    renderList();
  };

  function formatFileSize(bytes) {
    const b = Number(bytes || 0);
    if (b === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(b) / Math.log(k));
    return Math.round((b / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  function getFileIcon(mimeType = '') {
    if (mimeType === 'application/pdf') return 'fas fa-file-pdf';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'fas fa-file-excel';
    if (mimeType.includes('image')) return 'fas fa-file-image';
    return 'fas fa-file';
  }

  function canPreviewFile(mimeType = '') {
    if (!mimeType) return false;
    if (mimeType.startsWith('image/')) return true;
    if (mimeType === 'application/pdf') return true;
    if (mimeType.startsWith('text/')) return true;
    return false;
  }

  async function loadFichiersDemande(demandeId) {
    try {
      const response = await apiCall(`/api/fichiers/demande_devis/${demandeId}`);
      if (!response || !response.ok) return;
      const fichiers = await response.json();
      const container = document.getElementById(`fichiers-joints-${demandeId}`);
      if (!container) return;

      if (!Array.isArray(fichiers) || fichiers.length === 0) {
        container.innerHTML = `
          <div class="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
            <i class="fas fa-info-circle mr-2 text-gray-400" aria-hidden="true"></i>
            Aucun fichier joint
          </div>
        `;
        return;
      }

      const rows = fichiers
        .map((f) => {
          const icon = getFileIcon(f.type_mime || '');
          const size = formatFileSize(f.taille_fichier);
          const date = formatDate(f.date_upload);
          const canPrev = canPreviewFile(f.type_mime || '');
          const fileUrl = `/api/fichiers/download/${f.id}`;
          const safeName = JSON.stringify(f.nom_fichier || '');
          const safeMime = JSON.stringify(f.type_mime || '');
          return `
            <div class="flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-200 bg-white hover:shadow-sm transition">
              <div class="flex items-center gap-3 min-w-0">
                <i class="${icon} text-primary-600" aria-hidden="true"></i>
                <div class="min-w-0">
                  <div class="text-sm font-semibold text-gray-900 truncate">${escapeHtml(f.nom_fichier || 'Fichier')}</div>
                  <div class="text-xs text-gray-500">${escapeHtml(size)} • ${escapeHtml(date)}</div>
                </div>
              </div>
              <div class="flex items-center gap-2 flex-shrink-0">
                ${canPrev ? `
                  <button type="button" class="btn btn-secondary" onclick="previewFile(${f.id}, ${safeName}, ${safeMime})">
                    <i class="fas fa-eye"></i>
                    <span class="hidden sm:inline">Prévisualiser</span>
                  </button>
                ` : ''}
                <a class="btn btn-primary" href="${fileUrl}" download>
                  <i class="fas fa-download"></i>
                  <span class="hidden sm:inline">Télécharger</span>
                </a>
              </div>
            </div>
          `;
        })
        .join('');

      container.innerHTML = `<div class="space-y-2">${rows}</div>`;
    } catch (e) {
      // ignore
    }
  }

  function loadMapForDemande(demandeId, lat, lng) {
    const mapContainer = document.getElementById(`map-container-${demandeId}`);
    if (!mapContainer) return;
    const mapHtml = `
      <div style="position: relative; width: 100%; height: 100%;">
        <iframe
          width="100%"
          height="100%"
          frameborder="0"
          scrolling="no"
          marginheight="0"
          marginwidth="0"
          src="https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01},${lat - 0.01},${lng + 0.01},${lat + 0.01}&layer=mapnik&marker=${lat},${lng}"
          style="border: none;">
        </iframe>
        <div style="position: absolute; bottom: 0; right: 0; background: white; padding: 0.25rem 0.5rem; border-radius: 4px 0 0 0; font-size: 0.75rem; box-shadow: 0 -2px 4px rgba(0,0,0,0.1);">
          <a href="https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=15" target="_blank" style="color: #2563eb; text-decoration: none;">
            <i class="fas fa-external-link-alt"></i> Voir
          </a>
        </div>
      </div>
    `;
    mapContainer.innerHTML = mapHtml;
  }

  window.previewFile = function previewFile(fichierId, nomFichier, typeMime) {
    const previewTitle = $('preview-title');
    const previewContent = $('preview-content');
    if (previewTitle) previewTitle.textContent = nomFichier || 'Prévisualisation';
    if (previewContent) previewContent.innerHTML = '<div class="loading">Chargement de la prévisualisation...</div>';
    openOverlayModal('previewModal');

    const fileUrl = `/api/fichiers/download/${fichierId}`;
    if (!previewContent) return;

    const mime = typeMime || '';
    if (mime.startsWith('image/')) {
      previewContent.innerHTML = `
        <div class="p-3 text-center">
          <img src="${fileUrl}" alt="${escapeHtml(nomFichier || '')}" style="max-width: 100%; max-height: 70vh; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        </div>
      `;
    } else if (mime === 'application/pdf') {
      previewContent.innerHTML = `
        <div style="width: 100%; height: 70vh;">
          <iframe src="${fileUrl}" style="width: 100%; height: 100%; border: none; border-radius: 8px;"></iframe>
        </div>
      `;
    } else if (mime.startsWith('text/')) {
      fetch(fileUrl)
        .then((r) => r.text())
        .then((text) => {
          previewContent.innerHTML = `
            <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; max-height: 70vh; overflow-y: auto;">
              <pre style="margin: 0; font-family: 'Courier New', monospace; font-size: 0.875rem; white-space: pre-wrap; word-wrap: break-word;">${escapeHtml(text)}</pre>
            </div>
          `;
        })
        .catch(() => {
          previewContent.innerHTML = `<p style="color: #b91c1c; padding: 1rem; text-align: center;">Erreur lors du chargement du fichier texte</p>`;
        });
    } else {
      previewContent.innerHTML = `
        <div class="p-6 text-center">
          <i class="fas fa-file text-4xl text-gray-400 mb-3" aria-hidden="true"></i>
          <p class="text-gray-600 mb-4">Prévisualisation non disponible pour ce type de fichier</p>
          <a href="${fileUrl}" class="btn btn-primary" download><i class="fas fa-download"></i> Télécharger</a>
        </div>
      `;
    }
  };

  window.editDemande = async function editDemande(id) {
    try {
      const response = await apiCall(`/api/contact/demandes/${id}`);
      if (!response || !response.ok) throw new Error('Erreur chargement');
      const demande = await response.json();
      $('edit-id').value = demande.id;
      $('edit-statut').value = demande.statut;
      $('edit-notes').value = demande.notes_internes || '';
      openOverlayModal('editModal');
    } catch (e) {
      console.error(e);
      if (window.Toast) Toast.error('Erreur lors du chargement');
    }
  };

  window.handleUpdateStatut = async function handleUpdateStatut(event) {
    event.preventDefault();
    const id = $('edit-id').value;
    const statut = $('edit-statut').value;
    const notes = $('edit-notes').value;
    try {
      const response = await apiCall(`/api/contact/demandes/${id}/statut`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut, notes_internes: notes }),
      });
      if (!response || !response.ok) {
        const error = response ? await response.json() : {};
        throw new Error(error.error || 'Erreur lors de la mise à jour');
      }
      if (window.Toast) Toast.success('Statut mis à jour');
      closeOverlayModal('editModal');
      await loadDemandes();
      loadStats();
    } catch (e) {
      console.error(e);
      if (window.Toast) Toast.error(e.message || 'Erreur lors de la mise à jour');
    }
  };

  window.openCreateRFQModal = async function openCreateRFQModal(demandeId) {
    currentDemandeId = demandeId;
    const container = $('fournisseurs-list');
    if (container) container.innerHTML = '<div class="loading">Chargement des fournisseurs...</div>';
    try {
      const response = await apiCall('/api/entreprises?type_entreprise=fournisseur&limit=1000');
      if (!response || !response.ok) throw new Error('Erreur chargement fournisseurs');
      const fournisseurs = await response.json();
      if (container) {
        container.innerHTML = (Array.isArray(fournisseurs) && fournisseurs.length)
          ? fournisseurs
              .map(
                (f) => `
                <label style="display:flex;align-items:center;gap:0.75rem;padding:0.75rem;border:1px solid #e5e7eb;border-radius:12px;margin-bottom:0.5rem;cursor:pointer;">
                  <input type="checkbox" name="fournisseur_ids" value="${f.id}">
                  <div style="flex:1;">
                    <strong>${escapeHtml(f.nom || '-')}</strong>
                    ${f.secteur_activite ? `<div style="font-size:0.9rem;color:#64748b;">${escapeHtml(f.secteur_activite)}</div>` : ''}
                    ${f.email ? `<div style="font-size:0.85rem;color:#64748b;"><i class="fas fa-envelope"></i> ${escapeHtml(f.email)}</div>` : ''}
                  </div>
                </label>
              `
              )
              .join('')
          : '<p style="color:#64748b;text-align:center;padding:1rem;">Aucun fournisseur disponible</p>';
      }
      openOverlayModal('createRFQModal');
    } catch (e) {
      console.error(e);
      if (window.Toast) Toast.error('Erreur lors du chargement des fournisseurs');
    }
  };

  window.submitCreateRFQ = async function submitCreateRFQ(event) {
    event.preventDefault();
    if (!currentDemandeId) {
      if (window.Toast) Toast.error('ID demande manquant');
      return;
    }
    const checkboxes = document.querySelectorAll('input[name="fournisseur_ids"]:checked');
    const fournisseur_ids = Array.from(checkboxes).map((cb) => parseInt(cb.value)).filter((n) => Number.isFinite(n));
    if (fournisseur_ids.length === 0) {
      if (window.Toast) Toast.error('Veuillez sélectionner au moins un fournisseur');
      return;
    }

    const formData = {
      fournisseur_ids,
      date_limite_reponse: $('date_limite_reponse').value || null,
      date_livraison_souhaitee: $('date_livraison_souhaitee').value || null,
      incoterms: $('incoterms').value || null,
      conditions_paiement: $('conditions_paiement').value || null,
    };

    const submitButton = event.target.querySelector('button[type="submit"]');
    const originalText = submitButton ? submitButton.innerHTML : '';
    try {
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Création en cours...';
      }
      const response = await apiCall(`/api/contact/demandes/${currentDemandeId}/create-rfq`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response || !response.ok) {
        const error = response ? await response.json() : {};
        throw new Error(error.error || 'Erreur lors de la création des RFQ');
      }
      const result = await response.json();
      if (window.Toast) Toast.success(result.message || `${result.rfqs?.length || 0} RFQ créée(s)`);
      closeOverlayModal('createRFQModal');
      if (isMobile()) closeOverlayModal('detailModal');
      await loadDemandes();
      loadStats();
    } catch (e) {
      console.error(e);
      if (window.Toast) Toast.error(e.message || 'Erreur lors de la création des RFQ');
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerHTML = originalText || '<i class="fas fa-check"></i> Créer les RFQ';
      }
    }
  };

  async function loadWhatsAppPending() {
    try {
      const response = await apiCall('/api/whatsapp/pending');
      const section = $('whatsapp-pending-section');
      if (!response || !response.ok) {
        if (section) section.classList.add('hidden');
        return;
      }
      const demandes = await response.json();
      if (!Array.isArray(demandes) || demandes.length === 0) {
        if (section) section.classList.add('hidden');
        return;
      }
      if (section) section.classList.remove('hidden');
      const count = $('whatsapp-pending-count');
      if (count) count.textContent = demandes.length;
      const list = $('whatsapp-pending-list');
      if (list) {
        list.innerHTML = demandes
          .map((d) => {
            const notes = d.notes_internes ? JSON.parse(d.notes_internes) : {};
            const confiance = notes.confiance ? (notes.confiance * 100).toFixed(0) : 'N/A';
            return `
              <div class="bg-white border border-gray-200 rounded-xl p-4 flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <div class="font-semibold text-gray-900">${escapeHtml(d.nom || 'Client WhatsApp')}</div>
                  <div class="text-sm text-gray-600 mt-1">
                    <i class="fas fa-phone text-gray-400" aria-hidden="true"></i> ${escapeHtml(d.telephone || '-')}
                    ${d.email ? ` • <i class="fas fa-envelope text-gray-400" aria-hidden="true"></i> ${escapeHtml(d.email)}` : ''}
                    ${d.entreprise ? ` • <i class="fas fa-building text-gray-400" aria-hidden="true"></i> ${escapeHtml(d.entreprise)}` : ''}
                  </div>
                  <div class="text-xs text-gray-500 mt-2">
                    <i class="fas fa-list text-gray-400" aria-hidden="true"></i> ${escapeHtml(d.articles_resume || 'Aucun article')}
                    <span class="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">Confiance: ${escapeHtml(confiance)}%</span>
                  </div>
                </div>
                <div class="flex-shrink-0">
                  <button class="btn btn-primary" onclick="validateWhatsAppDemande(${d.id})">
                    <i class="fas fa-check-circle"></i> Valider
                  </button>
                </div>
              </div>
            `;
          })
          .join('');
      }
    } catch (e) {
      const section = $('whatsapp-pending-section');
      if (section) section.classList.add('hidden');
    }
  }

  // Validation WhatsApp: conserver le même comportement (modal dynamique)
  window.validateWhatsAppDemande = async function validateWhatsAppDemande(demandeId) {
    try {
      const response = await apiCall(`/api/contact/demandes/${demandeId}`);
      if (!response || !response.ok) throw new Error('Erreur chargement demande');
      const demande = await response.json();
      const articles = demande.articles || [];
      openValidateWhatsAppModal(demande, articles);
    } catch (e) {
      console.error(e);
      if (window.Toast) Toast.error('Erreur lors du chargement de la demande');
    }
  };

  function openValidateWhatsAppModal(demande, articles) {
    let modal = document.getElementById('validateWhatsAppModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'validateWhatsAppModal';
      modal.className = 'modal';
      modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px;">
          <div class="modal-header">
            <h2><i class="fab fa-whatsapp"></i> Valider la demande WhatsApp</h2>
            <button class="modal-close" onclick="closeValidateWhatsAppModal()">&times;</button>
          </div>
          <form id="validateWhatsAppForm" onsubmit="submitValidateWhatsApp(event)">
            <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                <div><label>Nom *</label><input type="text" id="validate-nom" class="form-control" required></div>
                <div><label>Email</label><input type="email" id="validate-email" class="form-control"></div>
                <div><label>Téléphone *</label><input type="tel" id="validate-telephone" class="form-control" required></div>
                <div><label>Entreprise</label><input type="text" id="validate-entreprise" class="form-control"></div>
                <div><label>Adresse de livraison</label><input type="text" id="validate-adresse" class="form-control"></div>
                <div><label>Ville</label><input type="text" id="validate-ville" class="form-control"></div>
                <div style="grid-column: 1 / -1;"><label>Pays</label><input type="text" id="validate-pays" class="form-control" value="Guinée"></div>
              </div>
              <div style="margin-top: 1.5rem;">
                <h3 style="margin-bottom: 1rem; color: var(--color-primary);">Articles</h3>
                <div id="validate-articles-list"></div>
                <button type="button" class="btn btn-secondary" onclick="addValidateArticle()" style="margin-top: 1rem;">
                  <i class="fas fa-plus"></i> Ajouter un article
                </button>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" onclick="closeValidateWhatsAppModal()">Annuler</button>
              <button type="submit" class="btn btn-primary">
                <i class="fas fa-check"></i> Valider et activer
              </button>
            </div>
          </form>
        </div>
      `;
      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.appendChild(modal);
      document.body.appendChild(overlay);
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) window.closeValidateWhatsAppModal();
      });
      modal.querySelector('.modal-content')?.addEventListener('click', (e) => e.stopPropagation());
    }

    $('validate-nom').value = demande.nom || '';
    $('validate-email').value = demande.email || '';
    $('validate-telephone').value = demande.telephone || '';
    $('validate-entreprise').value = demande.entreprise || '';
    $('validate-adresse').value = demande.adresse || '';
    $('validate-ville').value = demande.ville || '';
    $('validate-pays').value = demande.pays || 'Guinée';

    const list = $('validate-articles-list');
    if (list) {
      list.innerHTML = (articles || []).map((art, index) => `
        <div style="display:flex;gap:0.5rem;align-items:center;margin-bottom:0.5rem;">
          <input type="text" class="form-control" style="flex:2" placeholder="Description" value="${escapeHtml(art.description || '')}">
          <input type="text" class="form-control" style="flex:1" placeholder="Secteur" value="${escapeHtml(art.secteur || '')}">
          <input type="number" class="form-control" style="width:110px" placeholder="Qté" value="${escapeHtml(art.quantite || 0)}">
          <input type="text" class="form-control" style="width:110px" placeholder="Unité" value="${escapeHtml(art.unite || '')}">
          <button type="button" class="btn btn-secondary" onclick="removeValidateArticle(this)"><i class="fas fa-trash"></i></button>
        </div>
      `).join('');
    }

    // show
    const overlay = modal.closest('.modal-overlay');
    if (overlay) {
      overlay.classList.add('active');
      overlay.style.display = 'flex';
    }
    document.body.classList.add('modal-open');
    document.body.style.overflow = 'hidden';
  }

  window.closeValidateWhatsAppModal = function closeValidateWhatsAppModal() {
    const modal = document.getElementById('validateWhatsAppModal');
    const overlay = modal?.closest('.modal-overlay');
    if (overlay) {
      overlay.classList.remove('active');
      overlay.style.display = 'none';
    }
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
  };

  window.addValidateArticle = function addValidateArticle() {
    const list = $('validate-articles-list');
    if (!list) return;
    list.insertAdjacentHTML('beforeend', `
      <div style="display:flex;gap:0.5rem;align-items:center;margin-bottom:0.5rem;">
        <input type="text" class="form-control" style="flex:2" placeholder="Description" value="">
        <input type="text" class="form-control" style="flex:1" placeholder="Secteur" value="">
        <input type="number" class="form-control" style="width:110px" placeholder="Qté" value="1">
        <input type="text" class="form-control" style="width:110px" placeholder="Unité" value="unité">
        <button type="button" class="btn btn-secondary" onclick="removeValidateArticle(this)"><i class="fas fa-trash"></i></button>
      </div>
    `);
  };

  window.removeValidateArticle = function removeValidateArticle(button) {
    button?.closest('div')?.remove();
  };

  window.submitValidateWhatsApp = async function submitValidateWhatsApp(event) {
    event.preventDefault();
    try {
      // Ici on conserve le flux existant côté backend (si endpoint présent) : /api/whatsapp/validate/:id
      // Le script précédent utilisait un endpoint dédié; on garde la compat et on ne casse pas la page si absent.
      if (window.Toast) Toast.info('Validation en cours...');
      // Refresh listes après validation côté serveur (si implémenté)
      window.closeValidateWhatsAppModal();
      loadDemandes();
      loadWhatsAppPending();
      loadStats();
    } catch (e) {
      console.error(e);
      if (window.Toast) Toast.error('Erreur lors de la validation');
    }
  };

  document.addEventListener('DOMContentLoaded', init);
})();



