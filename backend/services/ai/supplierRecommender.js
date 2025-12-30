const pool = require('../../config/database');

/**
 * Service de recommandation de fournisseurs
 * Recommande les meilleurs fournisseurs pour une demande client ou RFQ
 */
class SupplierRecommender {
    /**
     * Recommande des fournisseurs pour une demande de devis client
     * @param {number} demandeDevisId - ID de la demande de devis
     * @returns {Promise<array>} Liste de fournisseurs recommandés avec scores
     */
    async recommendForDemande(demandeDevisId) {
        try {
            // Récupérer la demande de devis
            const [demandes] = await pool.execute(
                `SELECT * FROM demandes_devis WHERE id = ?`,
                [demandeDevisId]
            );

            if (demandes.length === 0) {
                throw new Error('Demande de devis non trouvée');
            }

            const demande = demandes[0];

            // Récupérer les lignes de la demande
            const [lignes] = await pool.execute(
                `SELECT * FROM demandes_devis_lignes WHERE demande_devis_id = ?`,
                [demandeDevisId]
            );

            // Analyser les catégories et produits demandés
            const categories = new Set();
            const produits = [];

            for (const ligne of lignes) {
                if (ligne.categorie) {
                    categories.add(ligne.categorie);
                }
                if (ligne.produit_id) {
                    produits.push(ligne.produit_id);
                }
            }

            // Recommander des fournisseurs
            const recommendations = await this._findMatchingSuppliers(
                demande.secteur || demande.categorie,
                Array.from(categories),
                produits,
                demande.ville,
                demande.pays
            );

            return recommendations;
        } catch (error) {
            console.error('Erreur recommandation fournisseurs:', error);
            throw error;
        }
    }

    /**
     * Recommande des fournisseurs pour une RFQ
     * @param {number} rfqId - ID de la RFQ
     * @returns {Promise<array>} Liste de fournisseurs recommandés
     */
    async recommendForRFQ(rfqId) {
        try {
            // Récupérer la RFQ
            const [rfqs] = await pool.execute(
                `SELECT r.*, c.nom as categorie_nom 
                 FROM rfq r
                 LEFT JOIN categories c ON r.categorie_id = c.id
                 WHERE r.id = ?`,
                [rfqId]
            );

            if (rfqs.length === 0) {
                throw new Error('RFQ non trouvée');
            }

            const rfq = rfqs[0];

            // Récupérer les lignes de la RFQ
            const [lignes] = await pool.execute(
                `SELECT rl.*, p.categorie_id 
                 FROM rfq_lignes rl
                 LEFT JOIN produits p ON rl.produit_id = p.id
                 WHERE rl.rfq_id = ?`,
                [rfqId]
            );

            // Extraire les catégories
            const categories = new Set();
            if (rfq.categorie_id) {
                categories.add(rfq.categorie_id);
            }
            lignes.forEach(l => {
                if (l.categorie_id) {
                    categories.add(l.categorie_id);
                }
            });

            // Recommander des fournisseurs
            const recommendations = await this._findMatchingSuppliers(
                rfq.categorie_nom,
                Array.from(categories),
                lignes.map(l => l.produit_id).filter(Boolean),
                null,
                null
            );

            return recommendations;
        } catch (error) {
            console.error('Erreur recommandation fournisseurs RFQ:', error);
            throw error;
        }
    }

    /**
     * Trouve les fournisseurs correspondants aux critères
     */
    async _findMatchingSuppliers(secteur, categories, produits, ville, pays) {
        let query = `
            SELECT e.*,
                   COUNT(DISTINCT d.id) as nb_devis,
                   COUNT(DISTINCT CASE WHEN d.statut = 'accepte' THEN d.id END) as nb_devis_acceptes,
                   AVG(CASE WHEN d.statut = 'accepte' THEN d.total_ttc END) as prix_moyen,
                   AVG(CASE WHEN d.statut = 'accepte' THEN d.delai_livraison END) as delai_moyen
            FROM entreprises e
            LEFT JOIN devis d ON d.fournisseur_id = e.id
            WHERE e.type = 'fournisseur' AND e.actif = 1
        `;

        const params = [];
        const conditions = [];

        // Filtre par secteur
        if (secteur) {
            conditions.push('(e.secteur_activite LIKE ? OR e.secteur_activite = ?)');
            params.push(`%${secteur}%`, secteur);
        }

        // Filtre par catégories de produits
        if (categories && categories.length > 0) {
            // Vérifier si le fournisseur a des produits dans ces catégories
            conditions.push(`EXISTS (
                SELECT 1 FROM produits_fournisseur pf
                INNER JOIN produits p ON pf.produit_id = p.id
                WHERE pf.fournisseur_id = e.id 
                AND p.categorie_id IN (${categories.map(() => '?').join(',')})
            )`);
            params.push(...categories);
        }

        // Filtre par produits spécifiques
        if (produits && produits.length > 0) {
            conditions.push(`EXISTS (
                SELECT 1 FROM produits_fournisseur pf
                WHERE pf.fournisseur_id = e.id 
                AND pf.produit_id IN (${produits.map(() => '?').join(',')})
            )`);
            params.push(...produits);
        }

        // Filtre géographique (optionnel)
        if (ville) {
            conditions.push('(e.ville = ? OR e.ville LIKE ?)');
            params.push(ville, `%${ville}%`);
        }

        if (pays) {
            conditions.push('e.pays = ?');
            params.push(pays);
        }

        if (conditions.length > 0) {
            query += ' AND ' + conditions.join(' AND ');
        }

        query += `
            GROUP BY e.id
            ORDER BY 
                (nb_devis_acceptes / NULLIF(nb_devis, 0)) DESC,
                nb_devis_acceptes DESC,
                e.nom ASC
            LIMIT 20
        `;

        const [fournisseurs] = await pool.execute(query, params);

        // Calculer un score pour chaque fournisseur
        const recommendations = await Promise.all(
            fournisseurs.map(async (f) => {
                const score = await this._calculateSupplierScore(f);
                return {
                    fournisseur_id: f.id,
                    fournisseur_nom: f.nom,
                    fournisseur: f,
                    score: score.total,
                    score_details: score,
                    match_reasons: this._getMatchReasons(f, secteur, categories, produits, ville, pays)
                };
            })
        );

        // Trier par score décroissant
        return recommendations.sort((a, b) => b.score - a.score);
    }

    /**
     * Calcule un score pour un fournisseur
     */
    async _calculateSupplierScore(fournisseur) {
        const score = {
            total: 0,
            historique: 0,
            performance: 0,
            localisation: 0,
            capacite: 0
        };

        // Score historique (40 points max)
        const tauxAcceptation = fournisseur.nb_devis > 0 
            ? (fournisseur.nb_devis_acceptes / fournisseur.nb_devis) 
            : 0;
        score.historique = tauxAcceptation * 40;
        score.total += score.historique;

        // Score performance (30 points max)
        if (fournisseur.nb_devis_acceptes > 0) {
            // Plus de devis acceptés = meilleur score
            score.performance = Math.min(30, fournisseur.nb_devis_acceptes * 5);
            score.total += score.performance;
        }

        // Score capacité (20 points max)
        // Vérifier le nombre de produits disponibles
        const [produitsCount] = await pool.execute(
            'SELECT COUNT(*) as count FROM produits_fournisseur WHERE fournisseur_id = ?',
            [fournisseur.id]
        );
        score.capacite = Math.min(20, produitsCount[0].count * 2);
        score.total += score.capacite;

        // Score localisation (10 points max)
        // Pour l'instant, on donne 10 points si localisé, 5 sinon
        score.localisation = (fournisseur.ville || fournisseur.pays) ? 10 : 5;
        score.total += score.localisation;

        // Normaliser entre 0 et 100
        score.total = Math.round(Math.min(100, Math.max(0, score.total)));

        return score;
    }

    /**
     * Génère les raisons de correspondance
     */
    _getMatchReasons(fournisseur, secteur, categories, produits, ville, pays) {
        const reasons = [];

        if (secteur && fournisseur.secteur_activite && 
            fournisseur.secteur_activite.toLowerCase().includes(secteur.toLowerCase())) {
            reasons.push(`Secteur d'activité correspondant: ${fournisseur.secteur_activite}`);
        }

        if (fournisseur.nb_devis_acceptes > 0) {
            const taux = ((fournisseur.nb_devis_acceptes / fournisseur.nb_devis) * 100).toFixed(0);
            reasons.push(`Taux d'acceptation: ${taux}% (${fournisseur.nb_devis_acceptes}/${fournisseur.nb_devis} devis)`);
        }

        if (ville && fournisseur.ville && fournisseur.ville.toLowerCase().includes(ville.toLowerCase())) {
            reasons.push(`Localisation: ${fournisseur.ville}`);
        }

        if (fournisseur.nb_devis_acceptes > 5) {
            reasons.push('Fournisseur expérimenté avec historique positif');
        }

        return reasons;
    }
}

module.exports = new SupplierRecommender();

