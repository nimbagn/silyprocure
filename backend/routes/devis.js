const express = require('express');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { validateDevis, validateId } = require('../middleware/validation');
const { createNotification, notifyAdminsAndSupervisors } = require('./notifications');
const { enregistrerInteraction } = require('../utils/historiqueClient');
const router = express.Router();

router.use(authenticate);

// Liste des devis
router.get('/', async (req, res) => {
    try {
        const { rfq_id, statut, fournisseur_id } = req.query;
        let query = `
            SELECT d.*, 
                   r.numero as rfq_numero,
                   e.nom as fournisseur_nom
            FROM devis d
            LEFT JOIN rfq r ON d.rfq_id = r.id
            LEFT JOIN entreprises e ON d.fournisseur_id = e.id
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;

        if (rfq_id) {
            query += ` AND d.rfq_id = $${paramIndex}`;
            params.push(rfq_id);
            paramIndex++;
        }

        if (statut) {
            query += ` AND d.statut = $${paramIndex}`;
            params.push(statut);
            paramIndex++;
        }

        if (fournisseur_id) {
            query += ` AND d.fournisseur_id = $${paramIndex}`;
            params.push(fournisseur_id);
            paramIndex++;
        }

        query += ' ORDER BY d.date_emission DESC';

        const [devis] = await pool.execute(query, params);
        res.json(devis);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Détails d'un devis
router.get('/:id', validateId, async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🔵 GET /api/devis/:id - ID:', id, 'User:', req.user?.id, 'Role:', req.user?.role);

        const [devis] = await pool.execute(
            `SELECT d.*, 
                    r.numero as rfq_numero,
                    e.nom as fournisseur_nom
             FROM devis d
             LEFT JOIN rfq r ON d.rfq_id = r.id
             LEFT JOIN entreprises e ON d.fournisseur_id = e.id
             WHERE d.id = $1`,
            [id]
        );

        if (devis.length === 0) {
            console.error('❌ Devis non trouvé:', id);
            return res.status(404).json({ error: 'Devis non trouvé' });
        }

        const devisData = devis[0];
        console.log('✅ Devis trouvé:', devisData.numero, 'Statut:', devisData.statut);

        // Récupérer les lignes
        const [lignes] = await pool.execute(
            'SELECT * FROM devis_lignes WHERE devis_id = $1 ORDER BY ordre',
            [id]
        );
        devisData.lignes = lignes;
        console.log('✅ Lignes récupérées:', lignes.length);

        res.json(devisData);
    } catch (error) {
        console.error('❌ Erreur GET /api/devis/:id:', error);
        res.status(500).json({ error: error.message });
    }
});

// Créer un devis
router.post('/', validateDevis, async (req, res) => {
    try {
        const {
            numero, rfq_id, fournisseur_id, contact_fournisseur_id,
            date_emission, date_validite, delai_livraison,
            remise_globale, conditions_paiement, garanties, certifications,
            notes, lignes
        } = req.body;

        // Récupérer le fournisseur depuis la RFQ si non fourni
        let finalFournisseurId = fournisseur_id;
        if (!finalFournisseurId && rfq_id) {
            const [rfqs] = await pool.execute('SELECT destinataire_id FROM rfq WHERE id = $1', [rfq_id]);
            if (rfqs.length > 0) {
                finalFournisseurId = rfqs[0].destinataire_id;
            }
        }

        // Calculer les totaux
        let total_ht = 0;
        let total_tva = 0;
        let total_ttc = 0;

        if (lignes && lignes.length > 0) {
            for (const ligne of lignes) {
                const prix_ht = ligne.prix_unitaire_ht * ligne.quantite;
                const remise = prix_ht * (ligne.remise || 0) / 100;
                const ligne_ht = prix_ht - remise;
                const ligne_tva = ligne_ht * (ligne.tva_taux || 20) / 100;
                total_ht += ligne_ht;
                total_tva += ligne_tva;
            }
            total_ht = total_ht * (1 - (remise_globale || 0) / 100);
            total_tva = total_tva * (1 - (remise_globale || 0) / 100);
            total_ttc = total_ht + total_tva;
        }

        const [result] = await pool.execute(
            `INSERT INTO devis (numero, rfq_id, fournisseur_id, contact_fournisseur_id,
              date_emission, date_validite, delai_livraison, remise_globale,
              total_ht, total_tva, total_ttc, conditions_paiement, garanties,
              certifications, notes, statut)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'envoye') RETURNING id`,
            [
                numero, rfq_id, finalFournisseurId, contact_fournisseur_id,
                date_emission, date_validite, delai_livraison, remise_globale || 0,
                total_ht, total_tva, total_ttc, conditions_paiement, garanties,
                certifications, notes
            ]
        );

        const devis_id = result.rows && result.rows[0] ? result.rows[0].id : (result.insertId || result[0]?.id);

        // Insérer les lignes
        if (lignes && lignes.length > 0) {
            for (const ligne of lignes) {
                const prix_ht = ligne.prix_unitaire_ht * ligne.quantite;
                const remise = prix_ht * (ligne.remise || 0) / 100;
                const total_ht_ligne = prix_ht - remise;

                await pool.execute(
                    'INSERT INTO devis_lignes (devis_id, rfq_ligne_id, produit_id, reference, description, quantite, unite, prix_unitaire_ht, remise, total_ht, tva_taux, ordre) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)',
                    [devis_id, ligne.rfq_ligne_id, ligne.produit_id, ligne.reference, ligne.description, ligne.quantite, ligne.unite || 'unité', ligne.prix_unitaire_ht, ligne.remise || 0, total_ht_ligne, ligne.tva_taux || 20, ligne.ordre || 0]
                );
            }
        }

        // Mettre à jour le statut de la RFQ
        if (rfq_id) {
            await pool.execute('UPDATE rfq SET statut = $1 WHERE id = $2', ['en_cours', rfq_id]);
            
            // Déclencher la détection d'anomalies en arrière-plan (non bloquant)
            const anomalyDetector = require('../services/ai/anomalyDetector');
            anomalyDetector.detectDevisAnomalies(devis_id).catch(err => {
                console.warn('Erreur détection anomalies (non bloquante):', err.message);
            });
            
            // Notifier l'émetteur de la RFQ qu'un devis a été reçu
            try {
                const [rfqs] = await pool.execute('SELECT emetteur_id FROM rfq WHERE id = $1', [rfq_id]);
                if (rfqs.length > 0 && rfqs[0].emetteur_id) {
                    const [fournisseurs] = await pool.execute('SELECT nom FROM entreprises WHERE id = $1', [finalFournisseurId]);
                    const fournisseurNom = fournisseurs.length > 0 ? fournisseurs[0].nom : 'Fournisseur';
                    
                    await createNotification(
                        rfqs[0].emetteur_id,
                        'devis_reçu',
                        'Nouveau devis reçu',
                        `Un devis a été reçu de ${fournisseurNom} pour la RFQ ${numero || rfq_id}`,
                        'devis',
                        devis_id
                    );
                }
                
                // Notifier aussi tous les admins/superviseurs
                const [fournisseurs] = await pool.execute('SELECT nom FROM entreprises WHERE id = $1', [finalFournisseurId]);
                const fournisseurNom = fournisseurs.length > 0 ? fournisseurs[0].nom : 'Fournisseur';
                
                await notifyAdminsAndSupervisors(
                    'devis_reçu',
                    `Nouveau devis reçu - ${numero || 'Devis'}`,
                    `Un devis a été reçu de ${fournisseurNom} pour la RFQ ${rfq_id ? `RFQ-${rfq_id}` : 'N/A'}. Montant TTC: ${total_ttc.toFixed(2)} GNF`,
                    'devis',
                    devis_id
                );
            } catch (error) {
                console.error('Erreur création notification devis:', error);
            }
        }

        res.status(201).json({ id: devis_id, message: 'Devis créé avec succès' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Mettre à jour un devis (seulement si statut = brouillon)
router.put('/:id', validateId, validateDevis, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Vérifier que le devis est en brouillon
        const [devis] = await pool.execute('SELECT statut FROM devis WHERE id = $1', [id]);
        if (devis.length === 0) {
            return res.status(404).json({ error: 'Devis non trouvé' });
        }
        if (devis[0].statut !== 'brouillon') {
            return res.status(400).json({ error: 'Seuls les devis en brouillon peuvent être modifiés' });
        }

        const {
            date_emission, date_validite, delai_livraison,
            remise_globale, conditions_paiement, garanties, certifications,
            notes, lignes
        } = req.body;

        // Calculer les totaux
        let total_ht = 0;
        let total_tva = 0;
        let total_ttc = 0;

        if (lignes && lignes.length > 0) {
            for (const ligne of lignes) {
                const montant_ligne = ligne.prix_unitaire_ht * ligne.quantite;
                const remise_ligne = montant_ligne * (ligne.remise || 0) / 100;
                const montant_apres_remise = montant_ligne - remise_ligne;
                total_ht += montant_apres_remise;
            }
        }

        // Appliquer remise globale
        if (remise_globale) {
            total_ht = total_ht * (1 - remise_globale / 100);
        }

        // Calculer TVA (supposons 20% par défaut, à ajuster selon les lignes)
        total_tva = total_ht * 0.20;
        total_ttc = total_ht + total_tva;

        // Mettre à jour le devis
        await pool.execute(
            `UPDATE devis SET 
                date_emission = $1, date_validite = $2, delai_livraison = $3,
                remise_globale = $4, total_ht = $5, total_tva = $6, total_ttc = $7,
                conditions_paiement = $8, garanties = $9, certifications = $10, notes = $11
             WHERE id = $12`,
            [
                date_emission, date_validite, delai_livraison,
                remise_globale || 0, total_ht, total_tva, total_ttc,
                conditions_paiement, garanties, certifications, notes, id
            ]
        );

        // Supprimer les anciennes lignes
        await pool.execute('DELETE FROM devis_lignes WHERE devis_id = $1', [id]);

        // Insérer les nouvelles lignes
        if (lignes && lignes.length > 0) {
            for (const ligne of lignes) {
                await pool.execute(
                    'INSERT INTO devis_lignes (devis_id, rfq_ligne_id, reference, description, quantite, unite, prix_unitaire_ht, remise, tva_taux, ordre) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
                    [id, ligne.rfq_ligne_id, ligne.reference, ligne.description, ligne.quantite, ligne.unite, ligne.prix_unitaire_ht, ligne.remise || 0, ligne.tva_taux || 20, ligne.ordre || 0]
                );
            }
        }

        res.json({ message: 'Devis mis à jour avec succès' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Mettre à jour le statut d'un devis
router.patch('/:id/statut', validateId, async (req, res) => {
    try {
        const { id } = req.params;
        const { statut } = req.body;

        console.log('🔵 PATCH /devis/:id/statut - ID:', id, 'Statut:', statut, 'User:', req.user?.id, 'Role:', req.user?.role);

        // Valider le statut
        const statutsValides = ['brouillon', 'envoye', 'accepte', 'refuse', 'expire'];
        if (!statut || !statutsValides.includes(statut)) {
            console.error('❌ Statut invalide:', statut, 'Statuts valides:', statutsValides);
            return res.status(400).json({ 
                error: 'Statut invalide', 
                statutsValides: statutsValides 
            });
        }

        // Vérifier que le devis existe et récupérer les infos
        const [devis] = await pool.execute(
            `SELECT d.*, dd.client_id, dd.reference as demande_reference 
             FROM devis d 
             LEFT JOIN demandes_devis dd ON d.demande_devis_id = dd.id 
             WHERE d.id = $1`, 
            [id]
        );
        if (devis.length === 0) {
            console.error('❌ Devis non trouvé:', id);
            return res.status(404).json({ error: 'Devis non trouvé' });
        }

        const devisData = devis[0];
        console.log('✅ Devis trouvé:', devisData.numero, 'Statut actuel:', devisData.statut);

        // Mettre à jour le statut
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/4b4f730e-c02b-49d5-b562-4d5fc3dd49d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'devis.js:321',message:'Before UPDATE statut',data:{devisId:id,statut,userId:req.user?.id,userRole:req.user?.role},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        await pool.execute('UPDATE devis SET statut = $1 WHERE id = $2', [statut, id]);
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/4b4f730e-c02b-49d5-b562-4d5fc3dd49d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'devis.js:323',message:'After UPDATE statut',data:{devisId:id,statut,success:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        console.log('✅ Statut mis à jour:', statut);

        // Enregistrer dans l'historique du client si le devis est lié à une demande client
        if (devisData.client_id && (statut === 'accepte' || statut === 'refuse')) {
            try {
                await enregistrerInteraction({
                    client_id: devisData.client_id,
                    type_interaction: statut === 'accepte' ? 'devis_accepte' : 'devis_refuse',
                    reference_document: devisData.numero || devisData.demande_reference,
                    document_id: id,
                    description: `Devis ${statut === 'accepte' ? 'accepté' : 'refusé'} - ${devisData.numero || 'N°' + id}`,
                    utilisateur_id: req.user?.id || null,
                    metadata: {
                        devis_id: id,
                        montant_ttc: devisData.total_ttc || null,
                        statut_avant: devisData.statut
                    }
                });
            } catch (err) {
                console.error('Erreur enregistrement historique devis:', err);
            }
        }

        res.json({ message: 'Statut mis à jour avec succès' });
    } catch (error) {
        console.error('Erreur mise à jour statut devis:', error);
        res.status(500).json({ error: error.message });
    }
});

// Créer un devis consolidé pour le client depuis plusieurs devis fournisseurs
router.post('/create-for-client', authenticate, async (req, res) => {
    try {
        const { 
            demande_devis_id, 
            devis_fournisseurs, // Array de { devis_id, lignes_selectionnees: [ligne_ids] }
            client_id, // ID de l'entreprise client
            marge_pourcentage, // Pourcentage de marge à appliquer
            date_emission,
            date_validite,
            delai_livraison,
            conditions_paiement,
            notes
        } = req.body;

        // Validation
        if (!devis_fournisseurs || !Array.isArray(devis_fournisseurs) || devis_fournisseurs.length === 0) {
            return res.status(400).json({ error: 'Veuillez sélectionner au moins un devis fournisseur' });
        }

        if (!client_id) {
            return res.status(400).json({ error: 'ID client requis' });
        }

        // Récupérer la marge active si non fournie
        let marge = marge_pourcentage || 20;
        if (!marge_pourcentage) {
            try {
                const [marges] = await pool.execute(
                    'SELECT pourcentage FROM marges_commerciales WHERE actif = TRUE ORDER BY id DESC LIMIT 1'
                );
                if (marges.length > 0) {
                    marge = marges[0].pourcentage;
                }
            } catch (e) {
                // Utiliser la marge par défaut
            }
        }

        // Récupérer les informations de la demande client si disponible
        let demandeInfo = null;
        if (demande_devis_id) {
            const [demandes] = await pool.execute(
                'SELECT * FROM demandes_devis WHERE id = $1',
                [demande_devis_id]
            );
            if (demandes.length > 0) {
                demandeInfo = demandes[0];
            }
        }

        // Générer le numéro de devis
        const year = new Date().getFullYear();
        const prefix = `DEV-CLIENT-${year}-`;
        const [lastDevis] = await pool.execute(
            `SELECT numero FROM devis WHERE numero LIKE $1 ORDER BY numero DESC LIMIT 1`,
            [`${prefix}%`]
        );
        let nextNumber = 1;
        if (lastDevis.length > 0) {
            const lastNum = lastDevis[0].numero;
            const lastSeq = parseInt(lastNum.split('-')[3]) || 0;
            nextNumber = lastSeq + 1;
        }
        const numero = `${prefix}${String(nextNumber).padStart(4, '0')}`;

        // Collecter toutes les lignes sélectionnées depuis les devis fournisseurs
        const lignesConsolidees = [];
        let total_achat_ht = 0; // Total d'achat (prix fournisseur avant majoration)

        for (const devisFournisseur of devis_fournisseurs) {
            const { devis_id, lignes_selectionnees } = devisFournisseur;

            // Récupérer le devis fournisseur
            const [devis] = await pool.execute(
                'SELECT * FROM devis WHERE id = $1',
                [devis_id]
            );

            if (devis.length === 0) {
                continue; // Ignorer ce devis
            }

            // Récupérer les lignes du devis
            const [lignes] = await pool.execute(
                'SELECT * FROM devis_lignes WHERE devis_id = $1 ORDER BY ordre',
                [devis_id]
            );

            // Si lignes_selectionnees est fourni, filtrer les lignes
            const lignesAFusionner = lignes_selectionnees && lignes_selectionnees.length > 0
                ? lignes.filter(l => lignes_selectionnees.includes(l.id))
                : lignes; // Sinon, prendre toutes les lignes

            // Ajouter les lignes avec le prix d'achat (prix fournisseur)
            for (const ligne of lignesAFusionner) {
                const prix_achat_ht = ligne.prix_unitaire_ht;
                const prix_achat_total = prix_achat_ht * ligne.quantite;
                total_achat_ht += prix_achat_total;

                // Calculer le prix de vente avec marge
                const prix_vente_ht = prix_achat_ht * (1 + marge / 100);

                lignesConsolidees.push({
                    reference: ligne.reference,
                    description: ligne.description,
                    quantite: ligne.quantite,
                    unite: ligne.unite,
                    prix_unitaire_ht: prix_vente_ht, // Prix avec marge
                    prix_achat_ht: prix_achat_ht, // Prix fournisseur (pour référence interne)
                    remise: ligne.remise || 0,
                    tva_taux: ligne.tva_taux || 20,
                    ordre: lignesConsolidees.length
                });
            }
        }

        if (lignesConsolidees.length === 0) {
            return res.status(400).json({ error: 'Aucune ligne sélectionnée' });
        }

        // Calculer les totaux
        let total_ht = 0;
        let total_tva = 0;
        let total_ttc = 0;
        let marge_totale = 0;

        for (const ligne of lignesConsolidees) {
            const prix_ht = ligne.prix_unitaire_ht * ligne.quantite;
            const remise = prix_ht * (ligne.remise || 0) / 100;
            const ligne_ht = prix_ht - remise;
            const ligne_tva = ligne_ht * (ligne.tva_taux || 20) / 100;
            
            total_ht += ligne_ht;
            total_tva += ligne_tva;
            
            // Calculer la marge pour cette ligne
            const prix_achat_total = ligne.prix_achat_ht * ligne.quantite;
            marge_totale += (ligne_ht - prix_achat_total);
        }

        total_ttc = total_ht + total_tva;

        // Récupérer l'entreprise de l'utilisateur connecté (facturier)
        const facturier_id = req.user.entreprise_id || client_id; // Fallback sur client_id si pas d'entreprise

        // Créer le devis client
        const [devisRows2, devisResult2] = await pool.execute(
            `INSERT INTO devis (numero, rfq_id, fournisseur_id, demande_devis_id, date_emission, date_validite,
              delai_livraison, remise_globale, total_ht, total_tva, total_ttc,
              conditions_paiement, garanties, certifications, notes, statut)
             VALUES ($1, NULL, $2, $3, $4, $5, $6, 0, $7, $8, $9, $10, NULL, NULL, $11, 'envoye') RETURNING id`,
            [
                numero,
                client_id, // fournisseur_id = client_id (pour le devis client)
                demande_devis_id || null,
                date_emission || new Date().toISOString().split('T')[0],
                date_validite || null,
                delai_livraison || null,
                total_ht,
                total_tva,
                total_ttc,
                conditions_paiement || null,
                notes || null
            ]
        );

        const devis_id = devisResult2.rows && devisResult2.rows[0] ? devisResult2.rows[0].id : (devisResult2.insertId || devisResult2[0]?.id);

        // Insérer les lignes (sans prix_achat_ht ni marge_appliquee dans devis_lignes - ce sont des champs de facture)
        for (const ligne of lignesConsolidees) {
            const prix_ht = ligne.prix_unitaire_ht * ligne.quantite;
            const remise = prix_ht * (ligne.remise || 0) / 100;
            const total_ht_ligne = prix_ht - remise;

            await pool.execute(
                'INSERT INTO devis_lignes (devis_id, reference, description, quantite, unite, prix_unitaire_ht, remise, total_ht, tva_taux, ordre) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
                [devis_id, ligne.reference, ligne.description, ligne.quantite, ligne.unite || 'unité', ligne.prix_unitaire_ht, ligne.remise || 0, total_ht_ligne, ligne.tva_taux || 20, ligne.ordre]
            );
        }

        // Mettre à jour le statut de la demande si elle existe
        if (demande_devis_id) {
            await pool.execute(
                'UPDATE demandes_devis SET statut = $1 WHERE id = $2',
                ['traitee', demande_devis_id]
            );
        }

        // Créer une notification
        await createNotification(req.user.id, 'devis_client_cree', `Devis client ${numero} créé depuis la comparaison de devis fournisseurs`, 'devis', devis_id);

        res.status(201).json({
            id: devis_id,
            numero: numero,
            message: 'Devis client créé avec succès',
            total_ht: total_ht,
            total_ttc: total_ttc,
            marge_totale: marge_totale,
            marge_pourcentage: marge
        });

    } catch (error) {
        console.error('Erreur création devis client:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

