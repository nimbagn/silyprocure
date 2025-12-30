const pool = require('../../config/database');

/**
 * Service de détection d'anomalies
 * Détecte les anomalies dans les devis, prix, ou processus
 */
class AnomalyDetector {
    /**
     * Détecte les anomalies dans un devis
     * @param {number} devisId - ID du devis
     * @returns {Promise<array>} Liste des anomalies détectées
     */
    async detectDevisAnomalies(devisId) {
        try {
            // Récupérer le devis avec ses lignes
            const [devis] = await pool.execute(
                `SELECT d.*, e.nom as fournisseur_nom
                 FROM devis d
                 LEFT JOIN entreprises e ON d.fournisseur_id = e.id
                 WHERE d.id = ?`,
                [devisId]
            );

            if (devis.length === 0) {
                throw new Error('Devis non trouvé');
            }

            const devisData = devis[0];

            // Récupérer les lignes
            const [lignes] = await pool.execute(
                'SELECT * FROM devis_lignes WHERE devis_id = ? ORDER BY ordre',
                [devisId]
            );
            devisData.lignes = lignes;

            const anomalies = [];

            // 1. Vérifier la cohérence des calculs
            anomalies.push(...this._checkCalculationConsistency(devisData));

            // 2. Détecter les prix anormaux
            anomalies.push(...await this._detectPriceAnomalies(devisData));

            // 3. Vérifier les conditions de paiement inhabituelles
            anomalies.push(...this._checkPaymentConditions(devisData));

            // 4. Détecter les patterns suspects
            anomalies.push(...await this._detectSuspiciousPatterns(devisData));

            // Sauvegarder les anomalies
            await this._saveAnomalies(anomalies, 'devis', devisId);

            return anomalies;
        } catch (error) {
            console.error('Erreur détection anomalies devis:', error);
            throw error;
        }
    }

    /**
     * Vérifie la cohérence des calculs
     */
    _checkCalculationConsistency(devis) {
        const anomalies = [];

        if (!devis.lignes || devis.lignes.length === 0) {
            return anomalies;
        }

        // Calculer le total depuis les lignes
        let calculatedTotalHT = 0;
        let calculatedTotalTVA = 0;

        for (const ligne of devis.lignes) {
            const prix = ligne.prix_unitaire_ht * ligne.quantite;
            const remise = prix * (ligne.remise || 0) / 100;
            const ht = prix - remise;
            const tva = ht * (ligne.tva_taux || 20) / 100;

            calculatedTotalHT += ht;
            calculatedTotalTVA += tva;
        }

        // Appliquer la remise globale
        calculatedTotalHT = calculatedTotalHT * (1 - (devis.remise_globale || 0) / 100);
        calculatedTotalTVA = calculatedTotalTVA * (1 - (devis.remise_globale || 0) / 100);
        const calculatedTotalTTC = calculatedTotalHT + calculatedTotalTVA;

        // Vérifier les différences
        const diffHT = Math.abs(calculatedTotalHT - devis.total_ht);
        const diffTVA = Math.abs(calculatedTotalTVA - devis.total_tva);
        const diffTTC = Math.abs(calculatedTotalTTC - devis.total_ttc);

        const tolerance = 0.01; // Tolérance de 0.01 (arrondis)

        if (diffHT > tolerance) {
            anomalies.push({
                type: 'incoherence_calcul_ht',
                severity: 'error',
                message: `Incohérence dans le calcul du total HT. Calculé: ${calculatedTotalHT.toFixed(2)}, Enregistré: ${devis.total_ht.toFixed(2)} (différence: ${diffHT.toFixed(2)})`,
                details: {
                    calculated: calculatedTotalHT,
                    recorded: devis.total_ht,
                    difference: diffHT
                }
            });
        }

        if (diffTVA > tolerance) {
            anomalies.push({
                type: 'incoherence_calcul_tva',
                severity: 'error',
                message: `Incohérence dans le calcul de la TVA. Calculé: ${calculatedTotalTVA.toFixed(2)}, Enregistré: ${devis.total_tva.toFixed(2)} (différence: ${diffTVA.toFixed(2)})`,
                details: {
                    calculated: calculatedTotalTVA,
                    recorded: devis.total_tva,
                    difference: diffTVA
                }
            });
        }

        if (diffTTC > tolerance) {
            anomalies.push({
                type: 'incoherence_calcul_ttc',
                severity: 'error',
                message: `Incohérence dans le calcul du total TTC. Calculé: ${calculatedTotalTTC.toFixed(2)}, Enregistré: ${devis.total_ttc.toFixed(2)} (différence: ${diffTTC.toFixed(2)})`,
                details: {
                    calculated: calculatedTotalTTC,
                    recorded: devis.total_ttc,
                    difference: diffTTC
                }
            });
        }

        return anomalies;
    }

    /**
     * Détecte les prix anormaux
     */
    async _detectPriceAnomalies(devis) {
        const anomalies = [];

        if (!devis.rfq_id) {
            return anomalies;
        }

        // Récupérer tous les devis de la même RFQ
        const [otherDevis] = await pool.execute(
            `SELECT total_ttc FROM devis 
             WHERE rfq_id = ? AND id != ? AND statut != 'refuse'`,
            [devis.rfq_id, devis.id]
        );

        if (otherDevis.length === 0) {
            return anomalies;
        }

        const prices = otherDevis.map(d => d.total_ttc);
        const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);

        // Prix anormalement bas (< 70% de la moyenne)
        if (devis.total_ttc < avgPrice * 0.7) {
            anomalies.push({
                type: 'prix_trop_bas',
                severity: 'warning',
                message: `Prix anormalement bas: ${((devis.total_ttc / avgPrice) * 100).toFixed(0)}% de la moyenne. Risque de qualité ou d'erreur.`,
                details: {
                    devis_price: devis.total_ttc,
                    average_price: avgPrice,
                    min_price: minPrice,
                    max_price: maxPrice,
                    percentage: (devis.total_ttc / avgPrice) * 100
                }
            });
        }

        // Prix anormalement haut (> 150% de la moyenne)
        if (devis.total_ttc > avgPrice * 1.5) {
            anomalies.push({
                type: 'prix_trop_haut',
                severity: 'info',
                message: `Prix élevé: ${((devis.total_ttc / avgPrice) * 100).toFixed(0)}% de la moyenne. Vérifier la justification.`,
                details: {
                    devis_price: devis.total_ttc,
                    average_price: avgPrice,
                    min_price: minPrice,
                    max_price: maxPrice,
                    percentage: (devis.total_ttc / avgPrice) * 100
                }
            });
        }

        return anomalies;
    }

    /**
     * Vérifie les conditions de paiement inhabituelles
     */
    _checkPaymentConditions(devis) {
        const anomalies = [];

        if (!devis.conditions_paiement) {
            return anomalies;
        }

        const conditions = devis.conditions_paiement.toLowerCase();

        // Conditions très défavorables
        if (conditions.includes('100%') && conditions.includes('avance')) {
            anomalies.push({
                type: 'conditions_defavorables',
                severity: 'warning',
                message: 'Conditions de paiement très défavorables: 100% d\'avance requis',
                details: {
                    conditions: devis.conditions_paiement
                }
            });
        }

        // Conditions inhabituelles (plus de 90 jours)
        const joursMatch = conditions.match(/(\d+)\s*jours?/i);
        if (joursMatch) {
            const jours = parseInt(joursMatch[1]);
            if (jours > 90) {
                anomalies.push({
                    type: 'conditions_longues',
                    severity: 'info',
                    message: `Conditions de paiement très longues: ${jours} jours`,
                    details: {
                        conditions: devis.conditions_paiement,
                        jours: jours
                    }
                });
            }
        }

        return anomalies;
    }

    /**
     * Détecte les patterns suspects
     */
    async _detectSuspiciousPatterns(devis) {
        const anomalies = [];

        if (!devis.fournisseur_id) {
            return anomalies;
        }

        // Vérifier si ce fournisseur est toujours le plus cher ou le moins cher
        const [rfqDevis] = await pool.execute(
            `SELECT total_ttc FROM devis 
             WHERE rfq_id = ? AND statut != 'refuse'`,
            [devis.rfq_id]
        );

        if (rfqDevis.length < 2) {
            return anomalies;
        }

        const prices = rfqDevis.map(d => d.total_ttc).sort((a, b) => a - b);
        const devisPrice = devis.total_ttc;
        const isCheapest = devisPrice === prices[0];
        const isMostExpensive = devisPrice === prices[prices.length - 1];

        // Vérifier l'historique du fournisseur
        const [historique] = await pool.execute(
            `SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN total_ttc = (SELECT MIN(total_ttc) FROM devis d2 WHERE d2.rfq_id = devis.rfq_id) THEN 1 ELSE 0 END) as toujours_plus_cher,
                SUM(CASE WHEN total_ttc = (SELECT MAX(total_ttc) FROM devis d2 WHERE d2.rfq_id = devis.rfq_id) THEN 1 ELSE 0 END) as toujours_moins_cher
             FROM devis
             WHERE fournisseur_id = ? AND rfq_id IN (SELECT id FROM rfq)`,
            [devis.fournisseur_id]
        );

        if (historique.length > 0 && historique[0].total > 3) {
            const tauxPlusCher = historique[0].toujours_plus_cher / historique[0].total;
            const tauxMoinsCher = historique[0].toujours_moins_cher / historique[0].total;

            if (tauxPlusCher > 0.8) {
                anomalies.push({
                    type: 'pattern_toujours_plus_cher',
                    severity: 'info',
                    message: `Ce fournisseur est systématiquement le plus cher (${(tauxPlusCher * 100).toFixed(0)}% des cas)`,
                    details: {
                        taux: tauxPlusCher,
                        total: historique[0].total
                    }
                });
            }

            if (tauxMoinsCher > 0.8) {
                anomalies.push({
                    type: 'pattern_toujours_moins_cher',
                    severity: 'warning',
                    message: `Ce fournisseur est systématiquement le moins cher (${(tauxMoinsCher * 100).toFixed(0)}% des cas). Vérifier la qualité.`,
                    details: {
                        taux: tauxMoinsCher,
                        total: historique[0].total
                    }
                });
            }
        }

        return anomalies;
    }

    /**
     * Sauvegarde les anomalies dans la base de données
     */
    async _saveAnomalies(anomalies, entiteType, entiteId) {
        try {
            for (const anomaly of anomalies) {
                await pool.execute(
                    `INSERT INTO ai_anomalies 
                     (type_anomalie, entite_type, entite_id, severite, message, details, resolue, date_creation)
                     VALUES (?, ?, ?, ?, ?, ?, FALSE, NOW())
                     ON DUPLICATE KEY UPDATE 
                     message = VALUES(message),
                     details = VALUES(details),
                     severite = VALUES(severite)`,
                    [
                        anomaly.type,
                        entiteType,
                        entiteId,
                        anomaly.severity,
                        anomaly.message,
                        JSON.stringify(anomaly.details || {})
                    ]
                );
            }
        } catch (error) {
            // Si la table n'existe pas encore, on ignore l'erreur
            console.warn('Impossible de sauvegarder les anomalies:', error.message);
        }
    }
}

module.exports = new AnomalyDetector();

