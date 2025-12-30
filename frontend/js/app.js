// Utilitaires généraux

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
}

function formatCurrency(amount) {
    if (!amount) return '0 GNF';
    return new Intl.NumberFormat('fr-FR', { 
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount) + ' GNF';
}

function getStatusBadge(status) {
    const badges = {
        'brouillon': 'badge-info',
        'envoye': 'badge-warning',
        'accepte': 'badge-success',
        'refuse': 'badge-danger',
        'en_cours': 'badge-info',
        'cloture': 'badge-success',
        'annule': 'badge-danger',
        'en_attente': 'badge-warning',
        'payee': 'badge-success',
        'impayee': 'badge-danger'
    };
    return badges[status] || 'badge-info';
}

function getStatusLabel(status) {
    const labels = {
        'brouillon': 'Brouillon',
        'envoye': 'Envoyé',
        'accepte': 'Accepté',
        'refuse': 'Refusé',
        'en_cours': 'En cours',
        'cloture': 'Clôturé',
        'annule': 'Annulé',
        'en_attente': 'En attente',
        'payee': 'Payée',
        'impayee': 'Impayée',
        'partiellement_payee': 'Partiellement payée'
    };
    return labels[status] || status;
}

