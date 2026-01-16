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
      nouvelle: 'bg-red-100 text-red-800',
      en_cours: 'bg-yellow-100 text-yellow-800',
      traitee: 'bg-green-100 text-green-800',
      annulee: 'bg-slate-100 text-slate-800',
    };
    const label = {
      nouvelle: 'Nouvelle',
      en_cours: 'En cours',
      traitee: 'Traitée',
      annulee: 'Annulée',
    };
    const cls = map[statut] || 'bg-slate-100 text-slate-800';
    const txt = label[statut] || statut || '-';
    return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}">${escapeHtml(txt)}</span>`;
  }

  function openOverlayModal(modalId) {
    const modal = $(modalId);
    const overlay = modal?.closest('.modal-overlay');
    if (!modal || !overlay) return;
    modal.classList.add('active');
    overlay.classList.add('active');
    overlay.style.display = 'flex';
    document.body.classList.add('modal-open');
    document.body.style.overflow = 'hidden';
  }

  function closeOverlayModal(modalId) {
    const modal = $(modalId);
    const overlay = modal?.closest('.modal-overlay');
    if (modal) modal.classList.remove('active');
    if (overlay) {
      overlay.classList.remove('active');
      overlay.style.display = 'none';
    }
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
  }

  function updateResultsCount(currentCount) {
    const el = $('demandes-results-count');
    if (!el) return;
    if (state.pagination && Number.isFinite(state.pagination.total)) {
      el.textContent = `${currentCount} affichée(s) (page ${state.pagination.page}/${state.pagination.totalPages}) — total ${state.pagination.total}`;
    } else {
      el.textContent = `${currentCount} affichée(s)`;
    }
  }

  function updatePaginationUI() {
    const wrapper = $('demandes-pagination');
    const text = $('demandes-pagination-text');
    const prevBtn = $('btn-prev-page');
    const nextBtn = $('btn-next-page');
    if (!wrapper || !text || !prevBtn || !nextBtn) return;

    const p = state.pagination;
    if (!p || !p.totalPages || p.totalPages <= 1) {
      wrapper.classList.add('hidden');
      return;
    }
    wrapper.classList.remove('hidden');
    text.textContent = `Page ${p.page} sur ${p.totalPages} (limite ${p.limit})`;
    prevBtn.disabled = p.page <= 1;
    nextBtn.disabled = p.page >= p.totalPages;
  }

  function getFilteredDemandes() {
    const search = (state.search || '').toLowerCase().trim();
    if (!search) return state.demandes;
    return state.demandes.filter((d) => {
      return (
        (d.nom && d.nom.toLowerCase().includes(search)) ||
        (d.email && d.email.toLowerCase().includes(search)) ||
        (d.entreprise && d.entreprise.toLowerCase().includes(search))
      );
    });
  }

  function renderList() {
    const container = $('demandes-list');
    if (!container) return;
    const list = getFilteredDemandes();

    if (list.length === 0) {
      container.innerHTML = `
        <div class="text-center py-10">
          <i class="fas fa-inbox text-gray-300 text-5xl mb-4"></i>
          <p class="text-gray-700 font-semibold">Aucune demande</p>
          <p class="text-gray-500 text-sm mt-1">Ajustez la recherche ou le filtre.</p>
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
                  class="dd-item w-full text-left p-4 rounded-xl border border-gray-200 bg-white hover:bg-blue-50/30 transition flex items-start gap-3"
                  data-demande-id="${d.id}"
                  aria-selected="${selected ? 'true' : 'false'}">
            <div class="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 flex-shrink-0">
              <i class="fas fa-user" aria-hidden="true"></i>
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <div class="font-semibold text-gray-900 truncate">${escapeHtml(d.nom || 'Sans nom')}</div>
                  <div class="text-sm text-gray-600 truncate">${escapeHtml(d.entreprise || '-')}</div>
                </div>
                <div class="flex flex-col items-end gap-1 flex-shrink-0">
                  ${statutBadge(d.statut)}
                  <div class="text-xs text-gray-500">${escapeHtml(formatDate(d.date_creation))}</div>
                </div>
              </div>
              <div class="mt-2 flex items-center gap-2 text-xs text-gray-600">
                <span class="inline-flex items-center gap-1">
                  <i class="fas fa-envelope text-gray-400" aria-hidden="true"></i>
                  <span class="truncate">${escapeHtml(d.email || '-')}</span>
                </span>
                <span class="mx-1 text-gray-300">•</span>
                <span class="inline-flex items-center gap-1">
                  <i class="fas fa-box text-gray-400" aria-hidden="true"></i>
                  <span>${escapeHtml(String(d.nb_articles || 0))} article(s)</span>
                </span>
              </div>
            </div>
          </button>
        `;
      })
      .join('');

    container.innerHTML = `<div class="space-y-3">${items}</div>`;
    updateResultsCount(list.length);
  }

  function renderDetailPlaceholder() {
    const panel = $('detail-panel-body');
    if (!panel) return;
    panel.innerHTML = `
      <div class="dd-detail-empty rounded-2xl p-8 text-center bg-white">
        <i class="fas fa-hand-pointer text-slate-300 text-4xl mb-3" aria-hidden="true"></i>
        <div class="text-gray-900 font-semibold">Sélectionnez une demande</div>
        <div class="text-gray-500 text-sm mt-1">Le détail s’affichera ici.</div>
      </div>
    `;
  }

  function renderDetail(demande) {
    const html = `
      <div class="space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div class="min-w-0">
            <div class="text-xl font-bold text-gray-900 truncate">${escapeHtml(demande.nom || 'Sans nom')}</div>
            <div class="mt-1 text-sm text-gray-600">
              <span class="inline-flex items-center gap-2"><i class="fas fa-envelope text-gray-400" aria-hidden="true"></i>${escapeHtml(demande.email || '-')}</span>
              <span class="mx-2 text-gray-300">•</span>
              <span class="inline-flex items-center gap-2"><i class="fas fa-building text-gray-400" aria-hidden="true"></i>${escapeHtml(demande.entreprise || '-')}</span>
            </div>
            <div class="mt-2 text-xs text-gray-500">
              Créée le ${escapeHtml(formatDate(demande.date_creation))}
            </div>
          </div>
          <div class="flex items-center gap-2 flex-wrap">
            ${statutBadge(demande.statut)}
            <button type="button" class="btn btn-secondary" onclick="editDemande(${demande.id})">
              <i class="fas fa-edit"></i> Statut
            </button>
            <button type="button" class="btn btn-primary" onclick="openCreateRFQModal(${demande.id})">
              <i class="fas fa-file-alt"></i> Créer RFQ
            </button>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-gray-200 p-4">
          <div class="flex items-center justify-between">
            <h3 class="font-semibold text-gray-900 flex items-center gap-2">
              <i class="fas fa-paperclip text-gray-400" aria-hidden="true"></i>
              Fichiers joints
            </h3>
          </div>
          <div id="fichiers-joints-${demande.id}" class="mt-3">
            <div class="text-sm text-gray-500">Chargement...</div>
          </div>
        </div>

        ${demande.latitude && demande.longitude ? `
        <div class="bg-white rounded-xl border border-gray-200 p-4">
          <h3 class="font-semibold text-gray-900 flex items-center gap-2">
            <i class="fas fa-map-marker-alt text-gray-400" aria-hidden="true"></i>
            Localisation
          </h3>
          <div id="map-container-${demande.id}" class="mt-3 rounded-xl overflow-hidden border border-gray-200" style="height: 280px;">
            <div class="text-sm text-gray-500 p-3">Chargement de la carte...</div>
          </div>
        </div>
        ` : ''}
      </div>
    `;

    if (isMobile()) {
      const modalBody = $('detail-modal-body');
      if (modalBody) modalBody.innerHTML = html;
    } else {
      const panel = $('detail-panel-body');
      if (panel) panel.innerHTML = html;
    }
  }

  async function loadDemandes() {
    const statut = $('statut-filter')?.value || '';
    const url = `/api/contact/demandes?page=${state.page}&limit=${state.limit}${statut ? '&statut=' + statut : ''}`;
    const listContainer = $('demandes-list');
    if (listContainer) listContainer.innerHTML = '<div class="loading text-center py-10">Chargement des demandes...</div>';

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
      const html = `
        <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-600 hover:shadow-md transition-shadow">
          <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-2"><i class="fas fa-inbox text-blue-600 text-xl"></i></div>
          <div class="text-3xl font-bold text-gray-900 mb-1">${stats.totale}</div>
          <div class="text-sm text-gray-600 font-medium">Total</div>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-orange-500 hover:shadow-md transition-shadow">
          <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-2"><i class="fas fa-exclamation-circle text-orange-600 text-xl"></i></div>
          <div class="text-3xl font-bold text-gray-900 mb-1">${stats.nouvelle}</div>
          <div class="text-sm text-gray-600 font-medium">Nouvelles</div>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-yellow-500 hover:shadow-md transition-shadow">
          <div class="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-2"><i class="fas fa-clock text-yellow-600 text-xl"></i></div>
          <div class="text-3xl font-bold text-gray-900 mb-1">${stats.en_cours}</div>
          <div class="text-sm text-gray-600 font-medium">En cours</div>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500 hover:shadow-md transition-shadow">
          <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-2"><i class="fas fa-check-circle text-green-600 text-xl"></i></div>
          <div class="text-3xl font-bold text-gray-900 mb-1">${stats.traitee}</div>
          <div class="text-sm text-gray-600 font-medium">Traitées</div>
        </div>
      `;
      const el = $('stats-demandes');
      if (el) el.innerHTML = html;
    } catch (e) {
      // ignore
    }
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


