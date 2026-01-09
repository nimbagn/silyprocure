const express = require('express');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { validateFacture, validateId, validateCommandeId } = require('../middleware/validation');
const { notifyClientFactureProforma, notifyClientFactureDefinitive } = require('../utils/whatsappNotifications');
const { createNotification } = require('./notifications');
const { enregistrerInteraction } = require('../utils/historiqueClient');
const router = express.Router();

router.use(authenticate);

// Liste des factures
router.get('/', async (req, res) => {
    try {
        const { type, statut, client_id } = req.query;
        let query = `
            SELECT f.*, 
                   e1.nom as facturier_nom,
                   e2.nom as client_nom
            FROM factures f
            LEFT JOIN entreprises e1 ON f.facturier_id = e1.id
            LEFT JOIN entreprises e2 ON f.client_id = e2.id
            WHERE 1=1
        `;
        const params = [];

        let paramIndex = 1;

        if (type) {
            query += ` AND f.type_facture = $${paramIndex}`;
            params.push(type);
            paramIndex++;
        }

        if (statut) {
            query += ` AND f.statut = $${paramIndex}`;
            params.push(statut);
            paramIndex++;
        }

        if (client_id) {
            query += ` AND f.client_id = $${paramIndex}`;
            params.push(client_id);
            paramIndex++;
        }

        query += ' ORDER BY f.date_emission DESC';

        const [factures] = await pool.execute(query, params);
        res.json(factures);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Détails d'une facture
router.get('/:id', validateId, async (req, res) => {
    try {
        const { id } = req.params;

        const [factures] = await pool.execute(
            `SELECT f.*, 
                    e1.nom as facturier_nom, e1.siret as facturier_siret,
                    e2.nom as client_nom, e2.siret as client_siret
             FROM factures f
             LEFT JOIN entreprises e1 ON f.facturier_id = e1.id
             LEFT JOIN entreprises e2 ON f.client_id = e2.id
             WHERE f.id = $1`,
            [id]
        );

        if (factures.length === 0) {
            return res.status(404).json({ error: 'Facture non trouvée' });
        }

        const facture = factures[0];

        // Récupérer les lignes
        const [lignes] = await pool.execute(
            'SELECT * FROM facture_lignes WHERE facture_id = $1 ORDER BY ordre',
            [id]
        );
        facture.lignes = lignes;

        // Récupérer les paiements
        const [paiements] = await pool.execute(
            'SELECT * FROM paiements WHERE facture_id = $1 ORDER BY date_paiement',
            [id]
        );
        facture.paiements = paiements;

        res.json(facture);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Créer une facture
router.post('/', validateFacture, async (req, res) => {
    try {
        const {
            numero, type_facture, date_emission, date_echeance,
            facturier_id, client_id, contact_client_id, commande_id, bl_id,
            adresse_facturation_id, conditions_paiement, delai_paiement_jours,
            mode_paiement, lignes
        } = req.body;

        // Calculer les totaux
        let total_ht = 0;
        let total_tva = 0;
        let total_ttc = 0;
        let total_achat_ht = 0; // Total d'achat (prix fournisseur avant majoration)
        let marge_totale = 0; // Marge totale générée

        if (lignes && lignes.length > 0) {
            for (const ligne of lignes) {
                // Prix d'achat (prix du fournisseur)
                const prix_achat_ht = ligne.prix_achat_ht || ligne.prix_unitaire_ht;
                const prix_achat_total = prix_achat_ht * ligne.quantite;
                total_achat_ht += prix_achat_total;
                
                // Prix de vente (après majoration si applicable)
                const prix_ht = ligne.prix_unitaire_ht * ligne.quantite;
                const remise = prix_ht * (ligne.remise || 0) / 100;
                const ligne_ht = prix_ht - remise;
                const ligne_tva = ligne_ht * (ligne.tva_taux || 20) / 100;
                total_ht += ligne_ht;
                total_tva += ligne_tva;
                
                // Calculer la marge pour cette ligne
                marge_totale += (ligne_ht - prix_achat_total);
            }
            total_ttc = total_ht + total_tva;
        }

        const [factureRows, factureResult] = await pool.execute(
            `INSERT INTO factures (numero, type_facture, date_emission, date_echeance,
              facturier_id, client_id, contact_client_id, commande_id, bl_id,
              adresse_facturation_id, total_ht, total_tva, total_ttc, total_achat_ht, marge_totale, reste_a_payer,
              conditions_paiement, delai_paiement_jours, mode_paiement, statut)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'brouillon')`,
            [numero, type_facture, date_emission, date_echeance,
             facturier_id, client_id, contact_client_id, commande_id, bl_id,
             adresse_facturation_id, total_ht, total_tva, total_ttc, total_achat_ht, marge_totale, total_ttc,
             conditions_paiement, delai_paiement_jours, mode_paiement]
        );

        const facture_id = factureResult.insertId;

        // Enregistrer dans l'historique du client si la facture est liée à une commande -> devis -> demande_devis
        if (commande_id) {
            try {
                const [commandeData] = await pool.execute(
                    `SELECT dd.client_id, c.numero as commande_numero 
                     FROM commandes c 
                     LEFT JOIN devis d ON c.devis_id = d.id 
                     LEFT JOIN demandes_devis dd ON d.demande_devis_id = dd.id 
                     WHERE c.id = ?`,
                    [commande_id]
                );
                
                if (commandeData.length > 0 && commandeData[0].client_id) {
                    await enregistrerInteraction({
                        client_id: commandeData[0].client_id,
                        type_interaction: 'facture_generee',
                        reference_document: numero,
                        document_id: facture_id,
                        description: `Facture générée pour la commande ${commandeData[0].commande_numero || commande_id}`,
                        utilisateur_id: req.user?.id || null,
                        metadata: {
                            facture_id: facture_id,
                            commande_id: commande_id,
                            montant_ttc: total_ttc || null
                        }
                    });
                }
            } catch (err) {
                console.error('Erreur enregistrement historique facture:', err);
            }
        }

        // Insérer les lignes
        if (lignes && lignes.length > 0) {
            for (const ligne of lignes) {
                const prix_ht = ligne.prix_unitaire_ht * ligne.quantite;
                const remise = prix_ht * (ligne.remise || 0) / 100;
                const total_ht_ligne = prix_ht - remise;
                const prix_achat_ht = ligne.prix_achat_ht || ligne.prix_unitaire_ht;
                const marge_appliquee = ligne.marge_appliquee || null;

                await pool.execute(
                    'INSERT INTO facture_lignes (facture_id, produit_id, reference, description, quantite, unite, prix_unitaire_ht, prix_achat_ht, remise, total_ht, tva_taux, marge_appliquee, ordre) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [facture_id, ligne.produit_id, ligne.reference, ligne.description, ligne.quantite, ligne.unite || 'unité', ligne.prix_unitaire_ht, prix_achat_ht, ligne.remise || 0, total_ht_ligne, ligne.tva_taux || 20, marge_appliquee, ligne.ordre || 0]
                );
            }
        }

        // Notifier le client qu'une facture a été créée
        // Note: Pour l'instant, on notifie l'utilisateur connecté.
        // Dans un système complet, on devrait trouver l'utilisateur lié au client
        try {
            await createNotification(
                req.user.id,
                'facture_créée',
                'Facture créée',
                `Une nouvelle facture ${numero || facture_id} a été créée pour un montant de ${total_ttc} GNF`,
                'facture',
                facture_id
            );
        } catch (error) {
            console.error('Erreur création notification facture:', error);
        }

        res.status(201).json({ id: facture_id, message: 'Facture créée avec succès' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Créer une facture PROFORMA depuis des devis comparés (après comparaison et ajout de marge)
router.post('/proforma-from-devis', authenticate, async (req, res) => {
    try {
        const { 
            demande_devis_id,
            devis_fournisseurs, // Array de { devis_id, lignes_selectionnees: [ligne_ids] }
            client_id, // ID de l'entreprise client
            marge_pourcentage,
            date_emission,
            date_echeance,
            conditions_paiement,
            delai_paiement_jours,
            mode_paiement
        } = req.body;

        console.log('🟦 Création facture proforma depuis devis comparés');
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/4b4f730e-c02b-49d5-b562-4d5fc3dd49d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'factures.js:221',message:'POST /proforma-from-devis - Entry',data:{demande_devis_id,client_id,devisCount:devis_fournisseurs?.length,marge_pourcentage},timestamp:Date.now(),sessionId:'test-complet',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion

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
            } catch (error) {
                marge = 20;
            }
        }

        console.log('🟦 Marge appliquée:', marge, '%');

        // Collecter toutes les lignes sélectionnées depuis les devis fournisseurs
        const lignesConsolidees = [];
        let total_achat_ht = 0;

        for (const devisFournisseur of devis_fournisseurs) {
            const { devis_id, lignes_selectionnees } = devisFournisseur;

            // Récupérer les lignes du devis
            const [lignes] = await pool.execute(
                'SELECT * FROM devis_lignes WHERE devis_id = $1 ORDER BY ordre',
                [devis_id]
            );

            // Filtrer les lignes si sélection spécifique
            const lignesAFusionner = lignes_selectionnees && lignes_selectionnees.length > 0
                ? lignes.filter(l => lignes_selectionnees.includes(l.id))
                : lignes;

            // Ajouter les lignes avec prix d'achat et prix de vente (avec marge)
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
                    prix_achat_ht: prix_achat_ht, // Prix fournisseur
                    remise: ligne.remise || 0,
                    tva_taux: ligne.tva_taux || 20,
                    marge_appliquee: marge,
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
        let marge_totale = 0;

        for (const ligne of lignesConsolidees) {
            const prix_ht = ligne.prix_unitaire_ht * ligne.quantite;
            const remise = prix_ht * (ligne.remise || 0) / 100;
            const ligne_ht = prix_ht - remise;
            const ligne_tva = ligne_ht * (ligne.tva_taux || 20) / 100;
            const ligne_achat_ht = ligne.prix_achat_ht * ligne.quantite;
            
            total_ht += ligne_ht;
            total_tva += ligne_tva;
            marge_totale += (ligne_ht - ligne_achat_ht);
        }

        const total_ttc = total_ht + total_tva;

        // Générer le numéro de facture proforma
        const numero = `PROFORMA-${new Date().getFullYear()}-${Date.now()}`;

        // Récupérer l'entreprise facturier
        const facturier_id = req.user.entreprise_id || 1;

        console.log('🟦 Création facture proforma:', {
            numero,
            client_id,
            total_ht,
            total_ttc,
            marge
        });

        // Créer la facture PROFORMA
        const [factureRows, factureResult] = await pool.execute(
            `INSERT INTO factures (numero, type_facture, date_emission, date_echeance,
              facturier_id, client_id, demande_devis_id,
              total_ht, total_tva, total_ttc, total_achat_ht, marge_totale, reste_a_payer,
              conditions_paiement, delai_paiement_jours, mode_paiement, statut)
             VALUES ($1, 'proforma', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'envoyee') RETURNING id`,
            [numero, 
             date_emission || new Date().toISOString().split('T')[0], 
             date_echeance,
             facturier_id, 
             client_id, 
             demande_devis_id || null,
             total_ht, 
             total_tva, 
             total_ttc, 
             total_achat_ht, 
             marge_totale, 
             total_ttc,
             conditions_paiement, 
             delai_paiement_jours || 30, 
             mode_paiement]
        );

        const facture_id = factureResult.rows && factureResult.rows[0] ? factureResult.rows[0].id : (factureResult.insertId || factureResult[0]?.id);
        
        console.log('✅ Facture proforma créée avec ID:', facture_id);

        // Insérer les lignes
        for (const ligne of lignesConsolidees) {
            const prix_ht = ligne.prix_unitaire_ht * ligne.quantite;
            const remise = prix_ht * (ligne.remise || 0) / 100;
            const total_ht_ligne = prix_ht - remise;

            await pool.execute(
                'INSERT INTO facture_lignes (facture_id, reference, description, quantite, unite, prix_unitaire_ht, prix_achat_ht, remise, total_ht, tva_taux, marge_appliquee, ordre) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)',
                [facture_id, ligne.reference, ligne.description, ligne.quantite, ligne.unite || 'unité', ligne.prix_unitaire_ht, ligne.prix_achat_ht, ligne.remise || 0, total_ht_ligne, ligne.tva_taux || 20, ligne.marge_appliquee, ligne.ordre || 0]
            );
        }

        // Enregistrer dans l'historique du client
        if (demande_devis_id) {
            try {
                const [demandeData] = await pool.execute(
                    'SELECT client_id FROM demandes_devis WHERE id = $1',
                    [demande_devis_id]
                );
                
                if (demandeData.length > 0 && demandeData[0].client_id) {
                    await enregistrerInteraction({
                        client_id: demandeData[0].client_id,
                        type_interaction: 'facture_proforma_generee',
                        reference_document: numero,
                        document_id: facture_id,
                        description: `Facture proforma générée depuis la comparaison de devis`,
                        utilisateur_id: req.user?.id || null,
                        metadata: {
                            facture_id: facture_id,
                            demande_devis_id: demande_devis_id,
                            montant_ttc: total_ttc || null,
                            type_facture: 'proforma'
                        }
                    });
                }
            } catch (err) {
                console.error('Erreur enregistrement historique facture:', err);
            }
        }

        console.log('✅ Facture proforma créée avec succès');

        // Notifier le client par WhatsApp (en arrière-plan)
        if (client_id) {
            const [client] = await pool.execute(
                'SELECT id, nom, email, telephone, type_entreprise FROM entreprises WHERE id = $1',
                [client_id]
            );
            if (client && client.length > 0) {
                notifyClientFactureProforma(
                    { id: facture_id, numero: numero, total_ttc: total_ttc },
                    client[0]
                ).catch(err => {
                    console.error('Erreur notification WhatsApp facture proforma:', err);
                });
            }
        }

        res.status(201).json({ 
            id: facture_id, 
            numero: numero,
            type_facture: 'proforma',
            total_ht: total_ht,
            total_ttc: total_ttc,
            total_achat_ht: total_achat_ht,
            marge_totale: marge_totale,
            marge_pourcentage: marge,
            message: 'Facture proforma créée avec succès avec majoration de ' + marge + '%'
        });
    } catch (error) {
        console.error('Erreur création facture proforma depuis devis:', error);
        res.status(500).json({ error: error.message });
    }
});

// Créer une facture PROFORMA depuis une commande livrée avec majoration (ancienne méthode - conservée pour compatibilité)
router.post('/proforma-from-commande/:commande_id', validateCommandeId, async (req, res) => {
    try {
        const { commande_id } = req.params;
        const { marge_pourcentage, date_emission, date_echeance, conditions_paiement, delai_paiement_jours, mode_paiement, client_id: client_id_param } = req.body;

        console.log('🟦 Création facture proforma depuis commande:', commande_id);
        console.log('🟦 Données reçues:', req.body);
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/4b4f730e-c02b-49d5-b562-4d5fc3dd49d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'factures.js:447',message:'POST /proforma-from-commande - Entry',data:{commande_id,client_id_param,marge_pourcentage},timestamp:Date.now(),sessionId:'test-complet',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion

        // Récupérer la commande avec ses lignes et le client_id via devis -> demande_devis
        // Note: On utilise client_id de demandes_devis, pas entreprise_id (qui peut ne pas exister)
        const [commandes] = await pool.execute(
            `SELECT c.*, e.nom as fournisseur_nom, dd.client_id, dd.id as demande_devis_id
             FROM commandes c
             LEFT JOIN entreprises e ON c.fournisseur_id = e.id
             LEFT JOIN devis d ON c.devis_id = d.id
             LEFT JOIN demandes_devis dd ON d.demande_devis_id = dd.id
             WHERE c.id = $1`,
            [commande_id]
        );

        if (commandes.length === 0) {
            console.error('❌ Commande non trouvée:', commande_id);
            return res.status(404).json({ error: 'Commande non trouvée' });
        }

        const commande = commandes[0];
        console.log('🟦 Commande trouvée:', {
            id: commande.id,
            numero: commande.numero,
            statut: commande.statut,
            devis_id: commande.devis_id,
            demande_devis_id: commande.demande_devis_id,
            client_id: commande.client_id
        });

        // Note: Dans le nouveau flux, la facture proforma est créée directement depuis les devis comparés.
        // Cette route est conservée pour compatibilité avec l'ancien flux.
        // On permet la création même si la commande n'est pas livrée, car cela peut être utile.

        // Récupérer le client_id (entreprise client)
        // Le client_id de demandes_devis pointe vers la table clients
        // On doit récupérer l'entreprise_id depuis la table clients
        // Si fourni en paramètre, l'utiliser en priorité
        let client_id = client_id_param;
        
        console.log('🟦 Tentative de récupération client_id:', {
            client_id_param: client_id_param,
            client_id_demande: commande.client_id,
            demande_devis_id: commande.demande_devis_id
        });
        
        if (!client_id && commande.client_id) {
            // Récupérer l'entreprise_id depuis la table clients
            try {
                const [clientData] = await pool.execute(
                    `SELECT entreprise_id FROM clients WHERE id = $1`,
                    [commande.client_id]
                );
                console.log('🟦 Résultat recherche entreprise via client:', clientData);
                if (clientData.length > 0 && clientData[0].entreprise_id) {
                    client_id = clientData[0].entreprise_id;
                }
            } catch (err) {
                console.warn('⚠️  Impossible de récupérer entreprise_id depuis clients:', err.message);
            }
        }
        
        if (!client_id) {
            // Essayer de trouver via demande_devis -> client -> entreprise
            try {
                const [clientData] = await pool.execute(
                    `SELECT cl.entreprise_id as client_id
                     FROM commandes c 
                     LEFT JOIN devis d ON c.devis_id = d.id 
                     LEFT JOIN demandes_devis dd ON d.demande_devis_id = dd.id
                     LEFT JOIN clients cl ON dd.client_id = cl.id
                     WHERE c.id = $1`,
                    [commande_id]
                );
                console.log('🟦 Résultat recherche client via demande_devis -> clients:', clientData);
                if (clientData.length > 0 && clientData[0].client_id) {
                    client_id = clientData[0].client_id;
                }
            } catch (err) {
                console.warn('⚠️  Erreur recherche client via demande_devis:', err.message);
            }
            
            if (!client_id) {
                // Si toujours pas de client_id, essayer de récupérer depuis la facture proforma liée si elle existe
                const [factureData] = await pool.execute(
                    `SELECT f.client_id 
                     FROM factures f 
                     WHERE f.commande_id = $1 AND f.type_facture = 'proforma' 
                     ORDER BY f.id DESC LIMIT 1`,
                    [commande_id]
                );
                if (factureData.length > 0 && factureData[0].client_id) {
                    client_id = factureData[0].client_id;
                    console.log('🟦 Client_id trouvé via facture proforma existante:', client_id);
                } else {
                    console.error('❌ Impossible de déterminer le client pour cette commande');
                    return res.status(400).json({ 
                        error: 'Impossible de déterminer le client pour cette commande. Veuillez créer la facture proforma depuis la comparaison de devis ou fournir un client_id.' 
                    });
                }
            }
        }

        console.log('🟦 Client ID trouvé:', client_id);

        // Utiliser les lignes_modifiees envoyées depuis le frontend si disponibles
        // Sinon, récupérer les lignes de la commande
        let lignesFacture = [];
        
        if (req.body.lignes_modifiees && Array.isArray(req.body.lignes_modifiees) && req.body.lignes_modifiees.length > 0) {
            console.log('🟦 Utilisation des lignes modifiées depuis le frontend:', req.body.lignes_modifiees.length);
            // Utiliser les lignes envoyées depuis le frontend (avec prix modifiés)
            lignesFacture = req.body.lignes_modifiees.map((ligne, index) => ({
                produit_id: null, // Pas de produit_id pour les lignes modifiées
                reference: ligne.reference || '',
                description: ligne.description || '',
                quantite: ligne.quantite || 0,
                unite: 'unité',
                prix_unitaire_ht: ligne.prix_vente_ht || 0, // Prix de vente (modifié par l'utilisateur)
                prix_achat_ht: ligne.prix_achat_ht || 0, // Prix d'achat (modifié par l'utilisateur)
                remise: 0,
                tva_taux: 20, // Par défaut
                marge_appliquee: ligne.marge || 20,
                ordre: index
            }));
        } else {
            // Fallback : récupérer les lignes de la commande
            console.log('🟦 Récupération des lignes depuis la commande');
            const [lignesCommande] = await pool.execute(
                'SELECT * FROM commande_lignes WHERE commande_id = $1 ORDER BY ordre',
                [commande_id]
            );

            if (lignesCommande.length === 0) {
                return res.status(400).json({ error: 'La commande n\'a pas de lignes' });
            }

            // Utiliser la marge fournie ou récupérer la marge active par défaut
            let marge = marge_pourcentage || 20;
            if (!marge_pourcentage) {
                try {
                    const [marges] = await pool.execute(
                        'SELECT pourcentage FROM marges_commerciales WHERE actif = TRUE ORDER BY id DESC LIMIT 1'
                    );
                    if (marges.length > 0) {
                        marge = marges[0].pourcentage;
                    }
                } catch (error) {
                    // Si la table n'existe pas, utiliser 20% par défaut
                    marge = 20;
                }
            }

            console.log('🟦 Marge appliquée:', marge, '%');

            // Préparer les lignes de facture avec majoration
            lignesFacture = lignesCommande.map(ligne => {
                const prix_achat_ht = ligne.prix_unitaire_ht; // Prix d'achat (du fournisseur)
                const prix_vente_ht = prix_achat_ht * (1 + marge / 100); // Prix de vente (après majoration)
                
                return {
                    produit_id: ligne.produit_id,
                    reference: ligne.reference,
                    description: ligne.description,
                    quantite: ligne.quantite,
                    unite: ligne.unite,
                    prix_unitaire_ht: prix_vente_ht, // Prix de vente
                    prix_achat_ht: prix_achat_ht, // Prix d'achat
                    remise: ligne.remise || 0,
                    tva_taux: ligne.tva_taux || 20,
                    marge_appliquee: marge,
                    ordre: ligne.ordre || 0
                };
            });
        }

        // Calculer les totaux
        let total_ht = 0;
        let total_tva = 0;
        let total_achat_ht = 0;
        let marge_totale = 0;

        for (const ligne of lignesFacture) {
            const prix_ht = ligne.prix_unitaire_ht * ligne.quantite;
            const remise = prix_ht * (ligne.remise || 0) / 100;
            const ligne_ht = prix_ht - remise;
            const ligne_tva = ligne_ht * (ligne.tva_taux || 20) / 100;
            const ligne_achat_ht = ligne.prix_achat_ht * ligne.quantite;
            
            total_ht += ligne_ht;
            total_tva += ligne_tva;
            total_achat_ht += ligne_achat_ht;
            marge_totale += (ligne_ht - ligne_achat_ht);
        }

        const total_ttc = total_ht + total_tva;

        // Générer le numéro de facture proforma
        const numero = `PROFORMA-${new Date().getFullYear()}-${Date.now()}`;

        // Récupérer l'entreprise facturier (votre entreprise)
        // Pour l'instant, on utilise l'ID 1 par défaut, à adapter selon votre logique
        const facturier_id = req.user.entreprise_id || 1;

        console.log('🟦 Création facture proforma:', {
            numero,
            client_id,
            commande_id,
            total_ht,
            total_ttc,
            marge
        });

        // Créer la facture PROFORMA (statut: envoyee pour indiquer qu'elle est envoyée au client)
        const [factureRows, factureResult] = await pool.execute(
            `INSERT INTO factures (numero, type_facture, date_emission, date_echeance,
              facturier_id, client_id, commande_id,
              total_ht, total_tva, total_ttc, total_achat_ht, marge_totale, reste_a_payer,
              conditions_paiement, delai_paiement_jours, mode_paiement, statut)
             VALUES ($1, 'proforma', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'envoyee') RETURNING id`,
            [numero, date_emission || new Date().toISOString().split('T')[0], date_echeance,
             facturier_id, client_id, commande_id,
             total_ht, total_tva, total_ttc, total_achat_ht, marge_totale, total_ttc,
             conditions_paiement, delai_paiement_jours || 30, mode_paiement]
        );

        const facture_id = factureResult.rows && factureResult.rows[0] ? factureResult.rows[0].id : (factureResult.insertId || factureResult[0]?.id);
        
        console.log('✅ Facture proforma créée avec ID:', facture_id);

        // Enregistrer dans l'historique du client
        if (client_id) {
            try {
                // Enregistrer dans l'historique du client (table clients)
                const [clientData] = await pool.execute(
                    `SELECT dd.client_id 
                     FROM commandes c 
                     LEFT JOIN devis d ON c.devis_id = d.id 
                     LEFT JOIN demandes_devis dd ON d.demande_devis_id = dd.id 
                     WHERE c.id = $1`,
                    [commande_id]
                );
                
                if (clientData.length > 0 && clientData[0].client_id) {
                    await enregistrerInteraction({
                        client_id: clientData[0].client_id,
                        type_interaction: 'facture_proforma_generee',
                        reference_document: numero,
                        document_id: facture_id,
                        description: `Facture proforma générée pour la commande ${commande.numero || commande_id}`,
                        utilisateur_id: req.user?.id || null,
                        metadata: {
                            facture_id: facture_id,
                            commande_id: commande_id,
                            montant_ttc: total_ttc || null,
                            type_facture: 'proforma'
                        }
                    });
                }
            } catch (err) {
                console.error('Erreur enregistrement historique facture:', err);
            }
        }

        // Insérer les lignes
        for (const ligne of lignesFacture) {
            const prix_ht = ligne.prix_unitaire_ht * ligne.quantite;
            const remise = prix_ht * (ligne.remise || 0) / 100;
            const total_ht_ligne = prix_ht - remise;

            await pool.execute(
                'INSERT INTO facture_lignes (facture_id, produit_id, reference, description, quantite, unite, prix_unitaire_ht, prix_achat_ht, remise, total_ht, tva_taux, marge_appliquee, ordre) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)',
                [facture_id, ligne.produit_id, ligne.reference, ligne.description, ligne.quantite, ligne.unite || 'unité', ligne.prix_unitaire_ht, ligne.prix_achat_ht, ligne.remise || 0, total_ht_ligne, ligne.tva_taux || 20, ligne.marge_appliquee, ligne.ordre || 0]
            );
        }

        console.log('✅ Facture proforma créée avec succès');

        res.status(201).json({ 
            id: facture_id, 
            numero: numero,
            type_facture: 'proforma',
            total_ht: total_ht,
            total_ttc: total_ttc,
            total_achat_ht: total_achat_ht,
            marge_totale: marge_totale,
            marge_pourcentage: marge,
            message: 'Facture proforma créée avec succès avec majoration de ' + marge + '%'
        });
    } catch (error) {
        console.error('Erreur création facture proforma depuis commande:', error);
        res.status(500).json({ error: error.message });
    }
});

// Valider une facture proforma et créer un bon de livraison + commande validée
router.post('/validate-proforma/:proforma_id', validateId, async (req, res) => {
    try {
        const { proforma_id } = req.params;
        const { date_livraison, transporteur_id, notes } = req.body;

        console.log('🟦 Validation facture proforma:', proforma_id);

        // Récupérer la facture proforma avec ses lignes
        const [proformas] = await pool.execute(
            `SELECT f.*, 
                    e1.nom as facturier_nom,
                    e2.nom as client_nom
             FROM factures f
             LEFT JOIN entreprises e1 ON f.facturier_id = e1.id
             LEFT JOIN entreprises e2 ON f.client_id = e2.id
             WHERE f.id = $1 AND f.type_facture = 'proforma'`,
            [proforma_id]
        );

        if (proformas.length === 0) {
            return res.status(404).json({ error: 'Facture proforma non trouvée' });
        }

        const proforma = proformas[0];

        // Vérifier que la proforma n'a pas déjà été validée
        if (proforma.statut === 'payee' || proforma.statut === 'annulee') {
            return res.status(400).json({ error: 'Cette facture proforma a déjà été traitée' });
        }

        // Récupérer les lignes de la proforma
        const [lignesProforma] = await pool.execute(
            'SELECT * FROM facture_lignes WHERE facture_id = $1 ORDER BY ordre',
            [proforma_id]
        );

        if (lignesProforma.length === 0) {
            return res.status(400).json({ error: 'La facture proforma n\'a pas de lignes' });
        }

        // Récupérer le client_id depuis la demande_devis si disponible
        let client_entreprise_id = proforma.client_id;
        if (proforma.demande_devis_id) {
            try {
                // Récupérer client_id depuis demandes_devis, puis entreprise_id depuis clients
                const [demandeData] = await pool.execute(
                    'SELECT client_id FROM demandes_devis WHERE id = $1',
                    [proforma.demande_devis_id]
                );
                if (demandeData.length > 0 && demandeData[0].client_id) {
                    const [clientData] = await pool.execute(
                        'SELECT entreprise_id FROM clients WHERE id = $1',
                        [demandeData[0].client_id]
                    );
                    if (clientData.length > 0 && clientData[0].entreprise_id) {
                        client_entreprise_id = clientData[0].entreprise_id;
                    }
                }
            } catch (err) {
                console.warn('⚠️  Erreur récupération entreprise_id depuis demande_devis:', err.message);
            }
        }

        // 1. Créer une commande validée par le client (basée sur la proforma)
        const numeroCommande = `BC-${new Date().getFullYear()}-${Date.now()}`;
        
        // Calculer les totaux pour la commande (basés sur les prix d'achat, pas les prix de vente)
        let total_ht_commande = 0;
        let total_tva_commande = 0;
        
        for (const ligne of lignesProforma) {
            const prix_achat_ht = ligne.prix_achat_ht || ligne.prix_unitaire_ht;
            const prix_ht = prix_achat_ht * ligne.quantite;
            const remise = prix_ht * (ligne.remise || 0) / 100;
            const ligne_ht = prix_ht - remise;
            const ligne_tva = ligne_ht * (ligne.tva_taux || 20) / 100;
            total_ht_commande += ligne_ht;
            total_tva_commande += ligne_tva;
        }
        const total_ttc_commande = total_ht_commande + total_tva_commande;

        // Créer la commande validée
        const [commandeRows, commandeResult] = await pool.execute(
            `INSERT INTO commandes (numero, type_commande, date_commande, date_livraison_souhaitee,
              commandeur_id, fournisseur_id, statut, total_ht, total_tva, total_ttc)
             VALUES ($1, 'BC', $2, $3, $4, $5, 'validee', $6, $7, $8) RETURNING id`,
            [numeroCommande,
             new Date().toISOString().split('T')[0],
             date_livraison || null,
             req.user.id,
             client_entreprise_id, // Le client devient le "fournisseur" dans la commande (logique interne)
             total_ht_commande,
             total_tva_commande,
             total_ttc_commande]
        );

        const commande_id = commandeResult.rows && commandeResult.rows[0] ? commandeResult.rows[0].id : (commandeResult.insertId || commandeResult[0]?.id);

        console.log('✅ Commande validée créée avec ID:', commande_id);

        // Insérer les lignes de commande (avec prix d'achat)
        for (const ligne of lignesProforma) {
            const prix_achat_ht = ligne.prix_achat_ht || ligne.prix_unitaire_ht;
            const prix_ht = prix_achat_ht * ligne.quantite;
            const remise = prix_ht * (ligne.remise || 0) / 100;
            const total_ht_ligne = prix_ht - remise;

            await pool.execute(
                'INSERT INTO commande_lignes (commande_id, reference, description, quantite, unite, prix_unitaire_ht, remise, total_ht, tva_taux, ordre) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
                [commande_id, ligne.reference, ligne.description, ligne.quantite, ligne.unite || 'unité', prix_achat_ht, ligne.remise || 0, total_ht_ligne, ligne.tva_taux || 20, ligne.ordre || 0]
            );
        }

        // 2. Créer le bon de livraison (BL)
        const numeroBL = `BL-${new Date().getFullYear()}-${Date.now()}`;
        
        const [blRows, blResult] = await pool.execute(
            `INSERT INTO bons_livraison (numero, commande_id, date_emission, date_livraison, transporteur_id, statut, notes)
             VALUES ($1, $2, $3, $4, $5, 'brouillon', $6) RETURNING id`,
            [numeroBL,
             commande_id,
             new Date().toISOString().split('T')[0],
             date_livraison || null,
             transporteur_id || null,
             notes || null]
        );

        const bl_id = blResult.rows && blResult.rows[0] ? blResult.rows[0].id : (blResult.insertId || blResult[0]?.id);

        console.log('✅ Bon de livraison créé avec ID:', bl_id);

        // Insérer les lignes du BL
        const [lignesCommande] = await pool.execute(
            'SELECT * FROM commande_lignes WHERE commande_id = $1 ORDER BY ordre',
            [commande_id]
        );

        for (const ligneCommande of lignesCommande) {
            await pool.execute(
                'INSERT INTO bl_lignes (bl_id, commande_ligne_id, quantite_livree, quantite_commandee, etat) VALUES ($1, $2, $3, $4, $5)',
                [bl_id, ligneCommande.id, ligneCommande.quantite, ligneCommande.quantite, 'conforme']
            );
        }

        // 3. Mettre à jour le statut de la proforma à "payee" (validée)
        await pool.execute(
            'UPDATE factures SET statut = $1 WHERE id = $2',
            ['payee', proforma_id]
        );

        // 4. Lier la proforma à la commande créée
        await pool.execute(
            'UPDATE factures SET commande_id = $1 WHERE id = $2',
            [commande_id, proforma_id]
        );

        // Enregistrer dans l'historique du client
        if (proforma.demande_devis_id) {
            try {
                const [demandeData] = await pool.execute(
                    'SELECT client_id FROM demandes_devis WHERE id = $1',
                    [proforma.demande_devis_id]
                );
                
                if (demandeData.length > 0 && demandeData[0].client_id) {
                    await enregistrerInteraction({
                        client_id: demandeData[0].client_id,
                        type_interaction: 'proforma_validee_bl_cree',
                        reference_document: numeroBL,
                        document_id: bl_id,
                        description: `Proforma validée - Bon de livraison ${numeroBL} et commande ${numeroCommande} créés`,
                        utilisateur_id: req.user?.id || null,
                        metadata: {
                            proforma_id: proforma_id,
                            commande_id: commande_id,
                            bl_id: bl_id,
                            montant_ttc: proforma.total_ttc || null
                        }
                    });
                }
            } catch (err) {
                console.error('Erreur enregistrement historique:', err);
            }
        }

        console.log('✅ Proforma validée, BL et commande créés avec succès');

        // Notifier le client de la livraison par WhatsApp (en arrière-plan)
        if (client_entreprise_id) {
            const [client] = await pool.execute(
                'SELECT id, nom, email, telephone, type_entreprise FROM entreprises WHERE id = $1',
                [client_entreprise_id]
            );
            if (client && client.length > 0) {
                const { notifyClientLivraison } = require('../utils/whatsappNotifications');
                notifyClientLivraison(
                    { id: bl_id, numero: numeroBL },
                    { id: commande_id, numero: numeroCommande },
                    client[0]
                ).catch(err => {
                    console.error('Erreur notification WhatsApp livraison:', err);
                });
            }
        }

        res.status(201).json({ 
            commande_id: commande_id,
            commande_numero: numeroCommande,
            bl_id: bl_id,
            bl_numero: numeroBL,
            proforma_id: proforma_id,
            message: 'Proforma validée, bon de livraison et commande créés avec succès'
        });
    } catch (error) {
        console.error('Erreur validation facture proforma:', error);
        res.status(500).json({ error: error.message });
    }
});

// Créer une facture définitive depuis un bon de livraison/commande validée
router.post('/definitive-from-bl/:bl_id', validateId, async (req, res) => {
    try {
        const { bl_id } = req.params;
        const { date_emission, date_echeance, conditions_paiement, delai_paiement_jours, mode_paiement } = req.body;

        console.log('🟦 Création facture définitive depuis BL:', bl_id);

        // Récupérer le BL avec la commande et la proforma
        const [bls] = await pool.execute(
            `SELECT bl.*, c.*, f.id as proforma_id, f.total_ht as proforma_total_ht, 
                    f.total_tva as proforma_total_tva, f.total_ttc as proforma_total_ttc,
                    f.total_achat_ht as proforma_total_achat_ht, f.marge_totale as proforma_marge_totale,
                    f.facturier_id, f.client_id as proforma_client_id, f.conditions_paiement as proforma_conditions,
                    f.delai_paiement_jours as proforma_delai, f.mode_paiement as proforma_mode,
                    f.date_echeance as proforma_date_echeance, f.demande_devis_id,
                    dd.client_id, cl.entreprise_id as client_entreprise_id
             FROM bons_livraison bl
             LEFT JOIN commandes c ON bl.commande_id = c.id
             LEFT JOIN factures f ON f.commande_id = c.id AND f.type_facture = 'proforma'
             LEFT JOIN demandes_devis dd ON f.demande_devis_id = dd.id
             LEFT JOIN clients cl ON dd.client_id = cl.id
             WHERE bl.id = $1`,
            [bl_id]
        );

        if (bls.length === 0) {
            return res.status(404).json({ error: 'Bon de livraison non trouvé' });
        }

        const bl = bls[0];
        const commande = bls[0];

        if (!bl.proforma_id) {
            return res.status(400).json({ error: 'Aucune facture proforma trouvée pour cette commande' });
        }

        // Récupérer les lignes de la proforma (avec prix de vente)
        const [lignesProforma] = await pool.execute(
            'SELECT * FROM facture_lignes WHERE facture_id = $1 ORDER BY ordre',
            [bl.proforma_id]
        );

        if (lignesProforma.length === 0) {
            return res.status(400).json({ error: 'La facture proforma n\'a pas de lignes' });
        }

        // Récupérer le client_id
        let client_id = bl.client_entreprise_id || bl.proforma_client_id;

        // Générer le numéro de facture définitive
        const numero = `FAC-${new Date().getFullYear()}-${Date.now()}`;

        // Créer la facture définitive (copie de la proforma avec prix de vente)
        const [factureRows, factureResult] = await pool.execute(
            `INSERT INTO factures (numero, type_facture, date_emission, date_echeance,
              facturier_id, client_id, commande_id, bl_id,
              total_ht, total_tva, total_ttc, total_achat_ht, marge_totale, reste_a_payer,
              conditions_paiement, delai_paiement_jours, mode_paiement, statut)
             VALUES ($1, 'facture', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'en_attente') RETURNING id`,
            [numero, 
             date_emission || new Date().toISOString().split('T')[0], 
             date_echeance || bl.proforma_date_echeance,
             bl.facturier_id, 
             client_id, 
             commande.id,
             bl_id,
             bl.proforma_total_ht, 
             bl.proforma_total_tva, 
             bl.proforma_total_ttc, 
             bl.proforma_total_achat_ht || 0, 
             bl.proforma_marge_totale || 0, 
             bl.proforma_total_ttc,
             conditions_paiement || bl.proforma_conditions, 
             delai_paiement_jours || bl.proforma_delai || 30, 
             mode_paiement || bl.proforma_mode]
        );

        const facture_id = factureResult.rows && factureResult.rows[0] ? factureResult.rows[0].id : (factureResult.insertId || factureResult[0]?.id);

        console.log('✅ Facture définitive créée avec ID:', facture_id);

        // Copier les lignes de la proforma vers la facture définitive
        for (const ligne of lignesProforma) {
            await pool.execute(
                'INSERT INTO facture_lignes (facture_id, produit_id, reference, description, quantite, unite, prix_unitaire_ht, prix_achat_ht, remise, total_ht, tva_taux, marge_appliquee, ordre) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)',
                [facture_id, ligne.produit_id, ligne.reference, ligne.description, ligne.quantite, ligne.unite, ligne.prix_unitaire_ht, ligne.prix_achat_ht || null, ligne.remise || 0, ligne.total_ht, ligne.tva_taux || 20, ligne.marge_appliquee || null, ligne.ordre || 0]
            );
        }

        // Enregistrer dans l'historique du client
        if (bl.client_id) {
            try {
                await enregistrerInteraction({
                    client_id: bl.client_id,
                    type_interaction: 'facture_definitive_generee',
                    reference_document: numero,
                    document_id: facture_id,
                    description: `Facture définitive générée depuis le bon de livraison ${bl.numero}`,
                    utilisateur_id: req.user?.id || null,
                    metadata: {
                        facture_id: facture_id,
                        bl_id: bl_id,
                        commande_id: commande.id,
                        montant_ttc: bl.proforma_total_ttc || null
                    }
                });
            } catch (err) {
                console.error('Erreur enregistrement historique facture définitive:', err);
            }
        }

        console.log('✅ Facture définitive créée avec succès');

        // Notifier le client par WhatsApp (en arrière-plan)
        if (client_id) {
            const [client] = await pool.execute(
                'SELECT id, nom, email, telephone, type_entreprise FROM entreprises WHERE id = $1',
                [client_id]
            );
            if (client && client.length > 0) {
                notifyClientFactureDefinitive(
                    { 
                        id: facture_id, 
                        numero: numero, 
                        total_ttc: bl.proforma_total_ttc,
                        reste_a_payer: bl.proforma_total_ttc,
                        date_echeance: date_echeance || bl.proforma_date_echeance
                    },
                    client[0]
                ).catch(err => {
                    console.error('Erreur notification WhatsApp facture définitive:', err);
                });
            }
        }

        res.status(201).json({ 
            id: facture_id, 
            numero: numero,
            type_facture: 'facture',
            bl_id: bl_id,
            commande_id: commande.id,
            total_ht: bl.proforma_total_ht,
            total_ttc: bl.proforma_total_ttc,
            message: 'Facture définitive créée avec succès depuis le bon de livraison'
        });
    } catch (error) {
        console.error('Erreur création facture définitive depuis BL:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

