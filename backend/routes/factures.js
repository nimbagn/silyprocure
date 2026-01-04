const express = require('express');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { validateFacture, validateId } = require('../middleware/validation');
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

        if (type) {
            query += ' AND f.type_facture = ?';
            params.push(type);
        }

        if (statut) {
            query += ' AND f.statut = ?';
            params.push(statut);
        }

        if (client_id) {
            query += ' AND f.client_id = ?';
            params.push(client_id);
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
             WHERE f.id = ?`,
            [id]
        );

        if (factures.length === 0) {
            return res.status(404).json({ error: 'Facture non trouvée' });
        }

        const facture = factures[0];

        // Récupérer les lignes
        const [lignes] = await pool.execute(
            'SELECT * FROM facture_lignes WHERE facture_id = ? ORDER BY ordre',
            [id]
        );
        facture.lignes = lignes;

        // Récupérer les paiements
        const [paiements] = await pool.execute(
            'SELECT * FROM paiements WHERE facture_id = ? ORDER BY date_paiement',
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

// Créer une facture depuis une commande avec majoration
router.post('/from-commande/:commande_id', validateId, async (req, res) => {
    try {
        const { commande_id } = req.params;
        const { marge_pourcentage, client_id, date_emission, date_echeance, conditions_paiement, delai_paiement_jours, mode_paiement } = req.body;

        // Récupérer la commande avec ses lignes
        const [commandes] = await pool.execute(
            `SELECT c.*, e.nom as fournisseur_nom
             FROM commandes c
             LEFT JOIN entreprises e ON c.fournisseur_id = e.id
             WHERE c.id = ?`,
            [commande_id]
        );

        if (commandes.length === 0) {
            return res.status(404).json({ error: 'Commande non trouvée' });
        }

        const commande = commandes[0];

        // Récupérer les lignes de la commande
        const [lignesCommande] = await pool.execute(
            'SELECT * FROM commande_lignes WHERE commande_id = ? ORDER BY ordre',
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

        // Préparer les lignes de facture avec majoration
        const lignesFacture = lignesCommande.map(ligne => {
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

        // Générer le numéro de facture
        const numero = `FAC-${new Date().getFullYear()}-${Date.now()}`;

        // Récupérer l'entreprise facturier (votre entreprise)
        // Pour l'instant, on utilise l'ID 1 par défaut, à adapter selon votre logique
        const facturier_id = req.user.entreprise_id || 1;

        // Créer la facture
        const [result] = await pool.execute(
            `INSERT INTO factures (numero, type_facture, date_emission, date_echeance,
              facturier_id, client_id, commande_id,
              total_ht, total_tva, total_ttc, total_achat_ht, marge_totale, reste_a_payer,
              conditions_paiement, delai_paiement_jours, mode_paiement, statut)
             VALUES (?, 'facture', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'brouillon')`,
            [numero, date_emission || new Date().toISOString().split('T')[0], date_echeance,
             facturier_id, client_id, commande_id,
             total_ht, total_tva, total_ttc, total_achat_ht, marge_totale, total_ttc,
             conditions_paiement, delai_paiement_jours || 30, mode_paiement]
        );

        const facture_id = result.insertId;

        // Enregistrer dans l'historique du client
        if (client_id) {
            try {
                // Vérifier si c'est un client de la table clients (pas juste une entreprise)
                const [clientData] = await pool.execute(
                    'SELECT id FROM clients WHERE id = ?',
                    [client_id]
                );
                
                if (clientData.length > 0) {
                    await enregistrerInteraction({
                        client_id: client_id,
                        type_interaction: 'facture_generee',
                        reference_document: numero,
                        document_id: facture_id,
                        description: `Facture générée pour la commande ${commande.numero || commande_id}`,
                        utilisateur_id: req.user?.id || null,
                        metadata: {
                            facture_id: facture_id,
                            commande_id: commande_id,
                            montant_ttc: total_ttc || null
                        }
                    });
                } else {
                    // Si pas dans clients, essayer de trouver via commande -> devis -> demande_devis
                    const [commandeData] = await pool.execute(
                        `SELECT dd.client_id 
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
                            description: `Facture générée pour la commande ${commande.numero || commande_id}`,
                            utilisateur_id: req.user?.id || null,
                            metadata: {
                                facture_id: facture_id,
                                commande_id: commande_id,
                                montant_ttc: total_ttc || null
                            }
                        });
                    }
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
                'INSERT INTO facture_lignes (facture_id, produit_id, reference, description, quantite, unite, prix_unitaire_ht, prix_achat_ht, remise, total_ht, tva_taux, marge_appliquee, ordre) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [facture_id, ligne.produit_id, ligne.reference, ligne.description, ligne.quantite, ligne.unite || 'unité', ligne.prix_unitaire_ht, ligne.prix_achat_ht, ligne.remise || 0, total_ht_ligne, ligne.tva_taux || 20, ligne.marge_appliquee, ligne.ordre || 0]
            );
        }

        res.status(201).json({ 
            id: facture_id, 
            numero: numero,
            total_ht: total_ht,
            total_ttc: total_ttc,
            total_achat_ht: total_achat_ht,
            marge_totale: marge_totale,
            marge_pourcentage: marge,
            message: 'Facture créée avec succès avec majoration de ' + marge + '%'
        });
    } catch (error) {
        console.error('Erreur création facture depuis commande:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

