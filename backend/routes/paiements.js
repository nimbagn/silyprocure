const express = require('express');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { validateId } = require('../middleware/validation');
const { enregistrerInteraction } = require('../utils/historiqueClient');
const router = express.Router();

router.use(authenticate);

// Récupérer tous les paiements d'une facture
router.get('/facture/:facture_id', validateId, async (req, res) => {
    try {
        const { facture_id } = req.params;

        const [paiements] = await pool.execute(
            'SELECT * FROM paiements WHERE facture_id = ? ORDER BY date_paiement DESC',
            [facture_id]
        );

        res.json(paiements);
    } catch (error) {
        console.error('Erreur récupération paiements:', error);
        res.status(500).json({ error: error.message });
    }
});

// Créer un paiement
router.post('/', async (req, res) => {
    try {
        const { facture_id, montant, date_paiement, mode_paiement, reference_paiement, banque, notes } = req.body;

        // Validation
        if (!facture_id || !montant || !date_paiement || !mode_paiement) {
            return res.status(400).json({ error: 'facture_id, montant, date_paiement et mode_paiement sont requis' });
        }

        const montantNum = parseFloat(montant);
        if (isNaN(montantNum) || montantNum <= 0) {
            return res.status(400).json({ error: 'Le montant doit être un nombre positif' });
        }

        // Vérifier que la facture existe
        const [factures] = await pool.execute(
            'SELECT id, total_ttc, montant_regle, reste_a_payer FROM factures WHERE id = ?',
            [facture_id]
        );

        if (factures.length === 0) {
            return res.status(404).json({ error: 'Facture non trouvée' });
        }

        const facture = factures[0];

        // Vérifier que le montant ne dépasse pas le reste à payer
        const resteAPayer = parseFloat(facture.reste_a_payer || 0);
        if (montantNum > resteAPayer) {
            return res.status(400).json({ 
                error: `Le montant (${montantNum}) dépasse le reste à payer (${resteAPayer})` 
            });
        }

        // Insérer le paiement
        const [paiementRows, paiementResult] = await pool.execute(
            'INSERT INTO paiements (facture_id, montant, date_paiement, mode_paiement, reference_paiement, banque, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [facture_id, montantNum, date_paiement, mode_paiement, reference_paiement || null, banque || null, notes || null]
        );

        const paiement_id = paiementResult.insertId;

        // Mettre à jour la facture
        const nouveauMontantRegle = parseFloat(facture.montant_regle || 0) + montantNum;
        const nouveauResteAPayer = parseFloat(facture.total_ttc || 0) - nouveauMontantRegle;

        // Déterminer le nouveau statut
        let nouveauStatut = facture.statut;
        if (nouveauResteAPayer <= 0) {
            nouveauStatut = 'payee';
        } else if (nouveauMontantRegle > 0 && nouveauMontantRegle < parseFloat(facture.total_ttc || 0)) {
            nouveauStatut = 'partiellement_payee';
        }

        await pool.execute(
            'UPDATE factures SET montant_regle = ?, reste_a_payer = ?, statut = ? WHERE id = ?',
            [nouveauMontantRegle, nouveauResteAPayer, nouveauStatut, facture_id]
        );

        // Enregistrer dans l'historique du client si la facture est complètement payée
        if (nouveauStatut === 'payee') {
            try {
                const [factureData] = await pool.execute(
                    `SELECT f.numero, f.total_ttc, c.client_id, dd.client_id as demande_client_id
                     FROM factures f
                     LEFT JOIN commandes c ON f.commande_id = c.id
                     LEFT JOIN devis d ON c.devis_id = d.id
                     LEFT JOIN demandes_devis dd ON d.demande_devis_id = dd.id
                     WHERE f.id = ?`,
                    [facture_id]
                );
                
                if (factureData.length > 0) {
                    const clientId = factureData[0].client_id || factureData[0].demande_client_id;
                    if (clientId) {
                        await enregistrerInteraction({
                            client_id: clientId,
                            type_interaction: 'facture_payee',
                            reference_document: factureData[0].numero,
                            document_id: facture_id,
                            description: `Facture payée intégralement - ${factureData[0].numero}`,
                            utilisateur_id: req.user?.id || null,
                            metadata: {
                                facture_id: facture_id,
                                montant_ttc: factureData[0].total_ttc || null
                            }
                        });
                    }
                }
            } catch (err) {
                console.error('Erreur enregistrement historique paiement:', err);
            }
        }

        res.status(201).json({
            id: paiement_id,
            message: 'Paiement enregistré avec succès',
            nouveau_montant_regle: nouveauMontantRegle,
            nouveau_reste_a_payer: nouveauResteAPayer,
            nouveau_statut: nouveauStatut
        });
    } catch (error) {
        console.error('Erreur création paiement:', error);
        res.status(500).json({ error: error.message });
    }
});

// Modifier un paiement
router.put('/:id', validateId, async (req, res) => {
    try {
        const { id } = req.params;
        const { montant, date_paiement, mode_paiement, reference_paiement, banque, notes } = req.body;

        // Récupérer le paiement actuel
        const [paiements] = await pool.execute(
            'SELECT * FROM paiements WHERE id = ?',
            [id]
        );

        if (paiements.length === 0) {
            return res.status(404).json({ error: 'Paiement non trouvé' });
        }

        const ancienPaiement = paiements[0];
        const facture_id = ancienPaiement.facture_id;

        // Récupérer la facture
        const [factures] = await pool.execute(
            'SELECT id, total_ttc, montant_regle, reste_a_payer FROM factures WHERE id = ?',
            [facture_id]
        );

        if (factures.length === 0) {
            return res.status(404).json({ error: 'Facture non trouvée' });
        }

        const facture = factures[0];

        // Calculer le nouveau montant réglé (retirer l'ancien, ajouter le nouveau)
        const ancienMontant = parseFloat(ancienPaiement.montant);
        const nouveauMontant = parseFloat(montant || ancienPaiement.montant);
        const nouveauMontantRegle = parseFloat(facture.montant_regle || 0) - ancienMontant + nouveauMontant;
        const nouveauResteAPayer = parseFloat(facture.total_ttc || 0) - nouveauMontantRegle;

        if (nouveauResteAPayer < 0) {
            return res.status(400).json({ error: 'Le montant total des paiements ne peut pas dépasser le total TTC' });
        }

        // Déterminer le nouveau statut
        let nouveauStatut = facture.statut;
        if (nouveauResteAPayer <= 0) {
            nouveauStatut = 'payee';
        } else if (nouveauMontantRegle > 0 && nouveauMontantRegle < parseFloat(facture.total_ttc || 0)) {
            nouveauStatut = 'partiellement_payee';
        } else if (nouveauMontantRegle === 0) {
            nouveauStatut = 'en_attente';
        }

        // Mettre à jour le paiement
        await pool.execute(
            'UPDATE paiements SET montant = ?, date_paiement = ?, mode_paiement = ?, reference_paiement = ?, banque = ?, notes = ? WHERE id = ?',
            [
                nouveauMontant,
                date_paiement || ancienPaiement.date_paiement,
                mode_paiement || ancienPaiement.mode_paiement,
                reference_paiement !== undefined ? reference_paiement : ancienPaiement.reference_paiement,
                banque !== undefined ? banque : ancienPaiement.banque,
                notes !== undefined ? notes : ancienPaiement.notes,
                id
            ]
        );

        // Mettre à jour la facture
        await pool.execute(
            'UPDATE factures SET montant_regle = ?, reste_a_payer = ?, statut = ? WHERE id = ?',
            [nouveauMontantRegle, nouveauResteAPayer, nouveauStatut, facture_id]
        );

        res.json({
            message: 'Paiement modifié avec succès',
            nouveau_montant_regle: nouveauMontantRegle,
            nouveau_reste_a_payer: nouveauResteAPayer,
            nouveau_statut: nouveauStatut
        });
    } catch (error) {
        console.error('Erreur modification paiement:', error);
        res.status(500).json({ error: error.message });
    }
});

// Supprimer un paiement
router.delete('/:id', validateId, async (req, res) => {
    try {
        const { id } = req.params;

        // Récupérer le paiement
        const [paiements] = await pool.execute(
            'SELECT * FROM paiements WHERE id = ?',
            [id]
        );

        if (paiements.length === 0) {
            return res.status(404).json({ error: 'Paiement non trouvé' });
        }

        const paiement = paiements[0];
        const facture_id = paiement.facture_id;

        // Récupérer la facture
        const [factures] = await pool.execute(
            'SELECT id, total_ttc, montant_regle, reste_a_payer FROM factures WHERE id = ?',
            [facture_id]
        );

        if (factures.length === 0) {
            return res.status(404).json({ error: 'Facture non trouvée' });
        }

        const facture = factures[0];

        // Recalculer le montant réglé et le reste à payer
        const montantPaiement = parseFloat(paiement.montant);
        const nouveauMontantRegle = parseFloat(facture.montant_regle || 0) - montantPaiement;
        const nouveauResteAPayer = parseFloat(facture.total_ttc || 0) - nouveauMontantRegle;

        // Déterminer le nouveau statut
        let nouveauStatut = facture.statut;
        if (nouveauMontantRegle <= 0) {
            nouveauStatut = 'en_attente';
        } else if (nouveauMontantRegle < parseFloat(facture.total_ttc || 0)) {
            nouveauStatut = 'partiellement_payee';
        }

        // Supprimer le paiement
        await pool.execute('DELETE FROM paiements WHERE id = ?', [id]);

        // Mettre à jour la facture
        await pool.execute(
            'UPDATE factures SET montant_regle = ?, reste_a_payer = ?, statut = ? WHERE id = ?',
            [nouveauMontantRegle, nouveauResteAPayer, nouveauStatut, facture_id]
        );

        res.json({
            message: 'Paiement supprimé avec succès',
            nouveau_montant_regle: nouveauMontantRegle,
            nouveau_reste_a_payer: nouveauResteAPayer,
            nouveau_statut: nouveauStatut
        });
    } catch (error) {
        console.error('Erreur suppression paiement:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

