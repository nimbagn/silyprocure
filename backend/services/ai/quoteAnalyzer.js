const pool = require('../../config/database');
const aiClient = require('./aiClient');

/**
 * Service d'analyse intelligente des devis
 * Analyse et score les devis pour recommander les meilleures offres
 */
class QuoteAnalyzer {
    /**
     * Analyse tous les devis d'une RFQ et génère des recommandations
     * @param {number} rfqId - ID de la RFQ
     * @returns {Promise<object>} Analyse avec scores, recommandations et anomalies
     */
    async analyzeQuotes(rfqId) {
        try {
            // Récupérer tous les devis de la RFQ
            // Note: ville et pays sont dans la table adresses, pas entreprises
            const usePostgreSQL = !!(process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql');
            const placeholder = usePostgreSQL ? '$1' : '?';
            
            const [devis] = await pool.execute(
                `SELECT d.*, 
                        e.nom as fournisseur_nom,
                        e.secteur_activite,
                        a.ville,
                        a.pays
                 FROM devis d
                 LEFT JOIN entreprises e ON d.fournisseur_id = e.id
                 LEFT JOIN adresses a ON e.id = a.entreprise_id AND a.type_adresse = 'siege'
                 WHERE d.rfq_id = ${placeholder} AND d.statut != 'refuse'
                 ORDER BY d.date_emission DESC`,
                [rfqId]
            );

            if (devis.length === 0) {
                return {
                    rfq_id: rfqId,
                    devis_count: 0,
                    scores: [],
                    recommendations: [],
                    anomalies: [],
                    best_combination: null
                };
            }

            // Récupérer les lignes pour chaque devis
            const devisWithLignes = await Promise.all(
                devis.map(async (d) => {
                    const [lignes] = await pool.execute(
                        'SELECT * FROM devis_lignes WHERE devis_id = ? ORDER BY ordre',
                        [d.id]
                    );
                    return { ...d, lignes };
                })
            );

            // Calculer les scores pour chaque devis
            const scores = await Promise.all(
                devisWithLignes.map(d => this._calculateScore(d, devisWithLignes))
            );

            // Détecter les anomalies
            const anomalies = this._detectAnomalies(devisWithLignes, scores);

            // Générer les recommandations
            const recommendations = this._generateRecommendations(devisWithLignes, scores);

            // Trouver la meilleure combinaison (peut mixer plusieurs fournisseurs)
            const bestCombination = this._findBestCombination(devisWithLignes, scores);

            const analysis = {
                rfq_id: rfqId,
                devis_count: devis.length,
                scores: scores.sort((a, b) => b.total_score - a.total_score),
                recommendations,
                anomalies,
                best_combination: bestCombination,
                analyzed_at: new Date().toISOString()
            };

            // Sauvegarder l'analyse dans le cache
            await this._saveAnalysis(rfqId, analysis);

            return analysis;
        } catch (error) {
            console.error('Erreur analyse devis:', error);
            throw error;
        }
    }

    /**
     * Calcule un score (0-100) pour un devis
     * @param {object} devis - Le devis avec ses lignes
     * @param {array} allDevis - Tous les devis pour comparaison
     * @returns {Promise<object>} Score détaillé
     */
    async _calculateScore(devis, allDevis) {
        const scores = {
            devis_id: devis.id,
            fournisseur_nom: devis.fournisseur_nom,
            total_score: 0,
            criteria: {}
        };

        // 1. Score prix (40 points max)
        const prixScore = this._scorePrice(devis, allDevis);
        scores.criteria.prix = prixScore;
        scores.total_score += prixScore.value * 0.4;

        // 2. Score délai (20 points max)
        const delaiScore = this._scoreDeliveryTime(devis, allDevis);
        scores.criteria.delai = delaiScore;
        scores.total_score += delaiScore.value * 0.2;

        // 3. Score conditions (15 points max)
        const conditionsScore = this._scorePaymentConditions(devis);
        scores.criteria.conditions = conditionsScore;
        scores.total_score += conditionsScore.value * 0.15;

        // 4. Score garanties (10 points max)
        const garantiesScore = this._scoreWarranties(devis);
        scores.criteria.garanties = garantiesScore;
        scores.total_score += garantiesScore.value * 0.1;

        // 5. Score historique fournisseur (15 points max)
        const historiqueScore = await this._scoreSupplierHistory(devis.fournisseur_id);
        scores.criteria.historique = historiqueScore;
        scores.total_score += historiqueScore.value * 0.15;

        // Normaliser le score entre 0 et 100
        scores.total_score = Math.round(Math.min(100, Math.max(0, scores.total_score)));

        return scores;
    }

    /**
     * Score basé sur le prix (meilleur prix = meilleur score)
     */
    _scorePrice(devis, allDevis) {
        if (allDevis.length === 1) {
            return { value: 80, reason: 'Seul devis disponible' };
        }

        const prices = allDevis.map(d => d.total_ttc).sort((a, b) => a - b);
        const minPrice = prices[0];
        const maxPrice = prices[prices.length - 1];
        const priceRange = maxPrice - minPrice;

        if (priceRange === 0) {
            return { value: 80, reason: 'Tous les prix sont identiques' };
        }

        const devisPrice = devis.total_ttc;
        const priceRatio = (maxPrice - devisPrice) / priceRange;
        const score = 20 + (priceRatio * 60); // Entre 20 et 80

        let reason = '';
        if (devisPrice === minPrice) {
            reason = 'Meilleur prix';
        } else if (devisPrice <= minPrice * 1.1) {
            reason = 'Prix très compétitif (≤10% du meilleur)';
        } else if (devisPrice <= minPrice * 1.2) {
            reason = 'Prix compétitif (≤20% du meilleur)';
        } else {
            reason = 'Prix élevé';
        }

        return { value: Math.round(score), reason };
    }

    /**
     * Score basé sur le délai de livraison
     */
    _scoreDeliveryTime(devis, allDevis) {
        if (!devis.delai_livraison) {
            return { value: 50, reason: 'Délai non spécifié' };
        }

        const delais = allDevis
            .filter(d => d.delai_livraison)
            .map(d => d.delai_livraison)
            .sort((a, b) => a - b);

        if (delais.length === 0) {
            return { value: 50, reason: 'Aucun délai spécifié' };
        }

        const minDelai = delais[0];
        const maxDelai = delais[delais.length - 1];
        const delaiRange = maxDelai - minDelai;

        if (delaiRange === 0) {
            return { value: 80, reason: 'Délai optimal' };
        }

        const devisDelai = devis.delai_livraison;
        const delaiRatio = (maxDelai - devisDelai) / delaiRange;
        const score = 40 + (delaiRatio * 40); // Entre 40 et 80

        let reason = '';
        if (devisDelai === minDelai) {
            reason = 'Délai le plus rapide';
        } else if (devisDelai <= minDelai * 1.2) {
            reason = 'Délai très rapide';
        } else if (devisDelai <= minDelai * 1.5) {
            reason = 'Délai acceptable';
        } else {
            reason = 'Délai long';
        }

        return { value: Math.round(score), reason };
    }

    /**
     * Score basé sur les conditions de paiement
     */
    _scorePaymentConditions(devis) {
        if (!devis.conditions_paiement) {
            return { value: 50, reason: 'Conditions non spécifiées' };
        }

        const conditions = devis.conditions_paiement.toLowerCase();
        let score = 50;
        let reason = 'Conditions standards';

        // Conditions favorables
        if (conditions.includes('30 jours') || conditions.includes('30j')) {
            score = 80;
            reason = 'Conditions favorables (30 jours)';
        } else if (conditions.includes('45 jours') || conditions.includes('45j')) {
            score = 70;
            reason = 'Conditions acceptables (45 jours)';
        } else if (conditions.includes('60 jours') || conditions.includes('60j')) {
            score = 60;
            reason = 'Conditions moyennes (60 jours)';
        } else if (conditions.includes('comptant') || conditions.includes('à la livraison')) {
            score = 40;
            reason = 'Paiement comptant ou à la livraison';
        } else if (conditions.includes('avance') || conditions.includes('acompte')) {
            score = 30;
            reason = 'Paiement d\'avance requis';
        }

        return { value: score, reason };
    }

    /**
     * Score basé sur les garanties
     */
    _scoreWarranties(devis) {
        if (!devis.garanties) {
            return { value: 50, reason: 'Aucune garantie spécifiée' };
        }

        const garanties = devis.garanties.toLowerCase();
        let score = 50;
        let reason = 'Garanties standards';

        if (garanties.includes('2 ans') || garanties.includes('24 mois')) {
            score = 90;
            reason = 'Garantie longue (2 ans)';
        } else if (garanties.includes('1 an') || garanties.includes('12 mois')) {
            score = 70;
            reason = 'Garantie standard (1 an)';
        } else if (garanties.includes('6 mois')) {
            score = 60;
            reason = 'Garantie courte (6 mois)';
        } else if (garanties.includes('certif') || garanties.includes('iso')) {
            score = 80;
            reason = 'Certifications mentionnées';
        }

        return { value: score, reason };
    }

    /**
     * Score basé sur l'historique du fournisseur
     */
    async _scoreSupplierHistory(fournisseurId) {
        if (!fournisseurId) {
            return { value: 50, reason: 'Fournisseur non identifié' };
        }

        try {
            // Compter les devis acceptés du fournisseur
            const [accepted] = await pool.execute(
                'SELECT COUNT(*) as count FROM devis WHERE fournisseur_id = ? AND statut = "accepte"',
                [fournisseurId]
            );

            // Compter les devis refusés
            const [refused] = await pool.execute(
                'SELECT COUNT(*) as count FROM devis WHERE fournisseur_id = ? AND statut = "refuse"',
                [fournisseurId]
            );

            const acceptedCount = accepted[0].count;
            const refusedCount = refused[0].count;
            const total = acceptedCount + refusedCount;

            if (total === 0) {
                return { value: 50, reason: 'Nouveau fournisseur' };
            }

            const acceptanceRate = acceptedCount / total;
            const score = 30 + (acceptanceRate * 50); // Entre 30 et 80

            let reason = '';
            if (acceptanceRate >= 0.8) {
                reason = `Excellent historique (${Math.round(acceptanceRate * 100)}% acceptés)`;
            } else if (acceptanceRate >= 0.6) {
                reason = `Bon historique (${Math.round(acceptanceRate * 100)}% acceptés)`;
            } else if (acceptanceRate >= 0.4) {
                reason = `Historique moyen (${Math.round(acceptanceRate * 100)}% acceptés)`;
            } else {
                reason = `Historique faible (${Math.round(acceptanceRate * 100)}% acceptés)`;
            }

            return { value: Math.round(score), reason };
        } catch (error) {
            console.error('Erreur calcul historique fournisseur:', error);
            return { value: 50, reason: 'Erreur calcul historique' };
        }
    }

    /**
     * Détecte les anomalies dans les devis
     */
    _detectAnomalies(devis, scores) {
        const anomalies = [];

        // Anomalie 1: Prix anormalement bas
        const prices = devis.map(d => d.total_ttc).sort((a, b) => a - b);
        const minPrice = prices[0];
        const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

        devis.forEach(d => {
            if (d.total_ttc < minPrice * 0.7 && prices.length > 1) {
                anomalies.push({
                    type: 'prix_trop_bas',
                    devis_id: d.id,
                    severity: 'warning',
                    message: `Prix anormalement bas (${((d.total_ttc / avgPrice) * 100).toFixed(0)}% de la moyenne) - Risque qualité`,
                    devis_numero: d.numero,
                    fournisseur_nom: d.fournisseur_nom
                });
            }

            // Anomalie 2: Prix anormalement haut
            if (d.total_ttc > avgPrice * 1.5 && prices.length > 1) {
                anomalies.push({
                    type: 'prix_trop_haut',
                    devis_id: d.id,
                    severity: 'info',
                    message: `Prix élevé (${((d.total_ttc / avgPrice) * 100).toFixed(0)}% de la moyenne)`,
                    devis_numero: d.numero,
                    fournisseur_nom: d.fournisseur_nom
                });
            }

            // Anomalie 3: Incohérence prix unitaire vs total
            if (d.lignes && d.lignes.length > 0) {
                const calculatedTotal = d.lignes.reduce((sum, l) => {
                    const prix = l.prix_unitaire_ht * l.quantite;
                    const remise = prix * (l.remise || 0) / 100;
                    const ht = prix - remise;
                    const tva = ht * (l.tva_taux || 20) / 100;
                    return sum + ht + tva;
                }, 0);

                const diff = Math.abs(calculatedTotal - d.total_ttc);
                if (diff > d.total_ttc * 0.05) { // Plus de 5% de différence
                    anomalies.push({
                        type: 'incoherence_calcul',
                        devis_id: d.id,
                        severity: 'error',
                        message: `Incohérence détectée entre prix unitaires et total (différence: ${diff.toFixed(2)} GNF)`,
                        devis_numero: d.numero,
                        fournisseur_nom: d.fournisseur_nom
                    });
                }
            }
        });

        return anomalies;
    }

    /**
     * Génère des recommandations basées sur l'analyse
     */
    _generateRecommendations(devis, scores) {
        const recommendations = [];

        // Recommandation 1: Meilleur devis global
        const bestDevis = scores[0];
        recommendations.push({
            type: 'best_overall',
            devis_id: bestDevis.devis_id,
            priority: 'high',
            message: `Meilleur devis global: ${bestDevis.fournisseur_nom} (Score: ${bestDevis.total_score}/100)`,
            details: {
                score: bestDevis.total_score,
                prix: devis.find(d => d.id === bestDevis.devis_id).total_ttc,
                fournisseur: bestDevis.fournisseur_nom
            }
        });

        // Recommandation 2: Meilleur rapport qualité/prix
        const bestValue = scores
            .map(s => ({
                ...s,
                value_ratio: s.total_score / (devis.find(d => d.id === s.devis_id).total_ttc / 1000)
            }))
            .sort((a, b) => b.value_ratio - a.value_ratio)[0];

        if (bestValue.devis_id !== bestDevis.devis_id) {
            recommendations.push({
                type: 'best_value',
                devis_id: bestValue.devis_id,
                priority: 'medium',
                message: `Meilleur rapport qualité/prix: ${bestValue.fournisseur_nom}`,
                details: {
                    score: bestValue.total_score,
                    prix: devis.find(d => d.id === bestValue.devis_id).total_ttc
                }
            });
        }

        return recommendations;
    }

    /**
     * Trouve la meilleure combinaison (peut mixer plusieurs fournisseurs)
     */
    _findBestCombination(devis, scores) {
        // Pour l'instant, retourne le meilleur devis unique
        // Peut être étendu pour mixer les meilleures lignes de différents devis
        const bestDevis = scores[0];
        const devisData = devis.find(d => d.id === bestDevis.devis_id);

        return {
            type: 'single_supplier',
            devis_ids: [bestDevis.devis_id],
            total_score: bestDevis.total_score,
            total_price: devisData.total_ttc,
            suppliers: [bestDevis.fournisseur_nom],
            recommendation: `Recommandation: ${bestDevis.fournisseur_nom} avec un score de ${bestDevis.total_score}/100`
        };
    }

    /**
     * Sauvegarde l'analyse dans le cache
     */
    async _saveAnalysis(rfqId, analysis) {
        try {
            await pool.execute(
                `INSERT INTO ai_analyses (rfq_id, type_analyse, resultat, date_creation)
                 VALUES (?, 'quote_analysis', ?, NOW())
                 ON DUPLICATE KEY UPDATE resultat = ?, date_modification = NOW()`,
                [rfqId, JSON.stringify(analysis), JSON.stringify(analysis)]
            );
        } catch (error) {
            // Si la table n'existe pas encore, on ignore l'erreur
            console.warn('Impossible de sauvegarder l\'analyse:', error.message);
        }
    }
}

module.exports = new QuoteAnalyzer();

