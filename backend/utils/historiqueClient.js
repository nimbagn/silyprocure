const pool = require('../config/database');

/**
 * Enregistrer une interaction client dans l'historique
 * @param {Object} params - Paramètres de l'interaction
 * @param {number} params.client_id - ID du client
 * @param {string} params.type_interaction - Type d'interaction (demande_devis, devis_accepte, etc.)
 * @param {string} params.reference_document - Référence du document (optionnel)
 * @param {number} params.document_id - ID du document (optionnel)
 * @param {string} params.description - Description de l'interaction
 * @param {number} params.utilisateur_id - ID de l'utilisateur (optionnel, NULL si automatique)
 * @param {Object} params.metadata - Données supplémentaires en JSON (optionnel)
 */
async function enregistrerInteraction(params) {
    try {
        const {
            client_id,
            type_interaction,
            reference_document = null,
            document_id = null,
            description,
            utilisateur_id = null,
            metadata = null
        } = params;

        if (!client_id || !type_interaction || !description) {
            console.warn('⚠️  Paramètres manquants pour enregistrerInteraction:', params);
            return;
        }

        await pool.execute(
            `INSERT INTO historique_clients 
             (client_id, type_interaction, reference_document, document_id, description, utilisateur_id, metadata)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                client_id,
                type_interaction,
                reference_document,
                document_id,
                description,
                utilisateur_id,
                metadata ? JSON.stringify(metadata) : null
            ]
        );
    } catch (error) {
        // Ne pas bloquer le processus principal en cas d'erreur d'historique
        console.error('❌ Erreur lors de l\'enregistrement de l\'historique:', error);
    }
}

/**
 * Récupérer l'historique complet d'un client
 * @param {number} client_id - ID du client
 * @param {number} limit - Nombre maximum d'entrées (défaut: 100)
 * @returns {Promise<Array>} Liste des interactions
 */
async function getHistoriqueClient(client_id, limit = 100) {
    try {
        const [interactions] = await pool.execute(
            `SELECT h.*, 
                    u.nom as utilisateur_nom, 
                    u.prenom as utilisateur_prenom
             FROM historique_clients h
             LEFT JOIN utilisateurs u ON h.utilisateur_id = u.id
             WHERE h.client_id = $1
             ORDER BY h.date_interaction DESC
             LIMIT $2`,
            [client_id, limit]
        );

        // Parser les metadata JSON
        return interactions.map(interaction => ({
            ...interaction,
            metadata: interaction.metadata ? JSON.parse(interaction.metadata) : null
        }));
    } catch (error) {
        console.error('❌ Erreur lors de la récupération de l\'historique:', error);
        return [];
    }
}

module.exports = {
    enregistrerInteraction,
    getHistoriqueClient
};

