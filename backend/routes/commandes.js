const express = require('express');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { validateCommande, validateId } = require('../middleware/validation');
const { createNotification } = require('./notifications');
const { enregistrerInteraction } = require('../utils/historiqueClient');
const router = express.Router();

router.use(authenticate);

// Liste des commandes
router.get('/', async (req, res) => {
    try {
        const { type, statut, fournisseur_id } = req.query;
        let query = `
            SELECT c.*, 
                   u.nom as commandeur_nom, u.prenom as commandeur_prenom,
                   e.nom as fournisseur_nom
            FROM commandes c
            LEFT JOIN utilisateurs u ON c.commandeur_id = u.id
            LEFT JOIN entreprises e ON c.fournisseur_id = e.id
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;

        if (type) {
            query += ` AND c.type_commande = $${paramIndex}`;
            params.push(type);
            paramIndex++;
        }

        if (statut) {
            query += ` AND c.statut = $${paramIndex}`;
            params.push(statut);
            paramIndex++;
        }

        if (fournisseur_id) {
            query += ` AND c.fournisseur_id = $${paramIndex}`;
            params.push(fournisseur_id);
            paramIndex++;
        }

        query += ' ORDER BY c.date_commande DESC';

        const [commandes] = await pool.execute(query, params);
        res.json(commandes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Détails d'une commande
router.get('/:id', validateId, async (req, res) => {
    try {
        const { id } = req.params;

        const [commandes] = await pool.execute(
            `SELECT c.*, 
                    u.nom as commandeur_nom, u.prenom as commandeur_prenom,
                    e.nom as fournisseur_nom
             FROM commandes c
             LEFT JOIN utilisateurs u ON c.commandeur_id = u.id
             LEFT JOIN entreprises e ON c.fournisseur_id = e.id
             WHERE c.id = $1`,
            [id]
        );

        if (commandes.length === 0) {
            return res.status(404).json({ error: 'Commande non trouvée' });
        }

        const commande = commandes[0];
        
        // Récupérer le client (entreprise) et la référence de la demande depuis la demande de devis si disponible
        // commande -> devis -> demandes_devis -> clients -> entreprises
        if (commande.devis_id) {
            try {
                const usePostgreSQL = !!(process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql');
                const placeholder = usePostgreSQL ? '$1' : '?';
                
                let clientData = [];
                try {
                    // Essayer avec demande_devis_id direct
                    [clientData] = await pool.execute(
                        `SELECT cl.entreprise_id as client_entreprise_id, 
                                cl.id as client_id,
                                dd.id as demande_devis_id,
                                dd.reference as demande_reference,
                                dd.nom as demande_client_nom
                         FROM commandes c 
                         LEFT JOIN devis d ON c.devis_id = d.id 
                         LEFT JOIN demandes_devis dd ON d.demande_devis_id = dd.id
                         LEFT JOIN clients cl ON dd.client_id = cl.id
                         WHERE c.id = ${placeholder}`,
                        [id]
                    );
                } catch (err) {
                    // Si demande_devis_id n'existe pas, essayer via RFQ description
                    if (err.code === 'ER_BAD_FIELD_ERROR' && err.message.includes('demande_devis_id')) {
                        [clientData] = await pool.execute(
                            `SELECT cl.entreprise_id as client_entreprise_id, 
                                    cl.id as client_id,
                                    dd.id as demande_devis_id,
                                    dd.reference as demande_reference,
                                    dd.nom as demande_client_nom
                             FROM commandes c 
                             LEFT JOIN devis d ON c.devis_id = d.id 
                             LEFT JOIN rfq r ON d.rfq_id = r.id
                             LEFT JOIN demandes_devis dd ON r.description LIKE CONCAT('%[Demande: ', dd.reference, ']%') 
                                OR r.description LIKE CONCAT('%Demande: ', dd.reference, '%')
                                OR (dd.reference IS NOT NULL AND r.description LIKE CONCAT('%', dd.reference, '%'))
                             LEFT JOIN clients cl ON dd.client_id = cl.id
                             WHERE c.id = ${placeholder}
                             LIMIT 1`,
                            [id]
                        );
                    } else {
                        throw err;
                    }
                }
                
                if (clientData && clientData.length > 0) {
                    if (clientData[0].client_entreprise_id) {
                        commande.client_entreprise_id = clientData[0].client_entreprise_id;
                        commande.client_id = clientData[0].client_id;
                    }
                    if (clientData[0].demande_devis_id) {
                        commande.demande_devis_id = clientData[0].demande_devis_id;
                        commande.demande_reference = clientData[0].demande_reference;
                        commande.demande_client_nom = clientData[0].demande_client_nom;
                    }
                }
            } catch (err) {
                // Si les colonnes n'existent pas, ignorer silencieusement
                if (err.code !== 'ER_BAD_FIELD_ERROR') {
                    console.warn('⚠️ Erreur récupération client depuis commande:', err.message);
                }
            }
        }

        // Récupérer les lignes
        const [lignes] = await pool.execute(
            'SELECT * FROM commande_lignes WHERE commande_id = $1 ORDER BY ordre',
            [id]
        );
        commande.lignes = lignes;

        res.json(commande);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Créer une commande
router.post('/', validateCommande, async (req, res) => {
    try {
        const {
            numero, type_commande, date_commande, date_livraison_souhaitee,
            fournisseur_id, contact_fournisseur_id, devis_id, rfq_id,
            adresse_livraison_id, contact_livraison, telephone_livraison,
            heure_livraison, incoterms, mode_transport, instructions_livraison,
            conditions_paiement, delai_paiement_jours, mode_paiement,
            projet_id, centre_cout_id, budget_approuve, lignes
        } = req.body;

        const commandeur_id = req.user.id;
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/4b4f730e-c02b-49d5-b562-4d5fc3dd49d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'commandes.js:90',message:'POST /commandes - Entry',data:{numero,type_commande,fournisseur_id,devis_id,rfq_id,lignesCount:lignes?.length},timestamp:Date.now(),sessionId:'test-complet',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion

        // Vérifier si une commande existe déjà pour ce devis
        if (devis_id) {
            const usePostgreSQL = !!(process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql');
            const placeholder = usePostgreSQL ? '$1' : '?';
            
            try {
                const [existingCommandes] = await pool.execute(
                    `SELECT id, numero, statut FROM commandes WHERE devis_id = ${placeholder} LIMIT 1`,
                    [devis_id]
                );
                
                if (existingCommandes && existingCommandes.length > 0) {
                    const existingCommande = existingCommandes[0];
                    return res.status(409).json({ 
                        error: `Une commande existe déjà pour ce devis`,
                        existing_commande: {
                            id: existingCommande.id,
                            numero: existingCommande.numero,
                            statut: existingCommande.statut
                        },
                        message: `La commande ${existingCommande.numero} a déjà été créée pour ce devis.`
                    });
                }
            } catch (err) {
                // Si la colonne devis_id n'existe pas, continuer
                if (err.code !== 'ER_BAD_FIELD_ERROR') {
                    console.error('Erreur vérification commande existante:', err);
                }
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
            total_ttc = total_ht + total_tva;
        }

        console.log('🟦 Création commande - Données reçues:', {
            numero,
            type_commande,
            fournisseur_id,
            devis_id,
            rfq_id,
            lignes_count: lignes?.length || 0,
            total_ht,
            total_tva,
            total_ttc
        });

        // Convertir tous les undefined en null pour éviter les erreurs SQL
        const params = [
            numero || null,
            type_commande || null,
            date_commande || null,
            date_livraison_souhaitee || null,
            commandeur_id || null,
            fournisseur_id || null,
            contact_fournisseur_id || null,
            devis_id || null,
            rfq_id || null,
            adresse_livraison_id || null,
            contact_livraison || null,
            telephone_livraison || null,
            heure_livraison || null,
            incoterms || null,
            mode_transport || null,
            instructions_livraison || null,
            conditions_paiement || null,
            delai_paiement_jours || null,
            mode_paiement || null,
            projet_id || null,
            centre_cout_id || null,
            budget_approuve || null,
            total_ht || 0,
            total_tva || 0,
            total_ttc || 0
        ];

        const [commandeRows, commandeResult] = await pool.execute(
            `INSERT INTO commandes (numero, type_commande, date_commande, date_livraison_souhaitee,
              commandeur_id, fournisseur_id, contact_fournisseur_id, devis_id, rfq_id,
              adresse_livraison_id, contact_livraison, telephone_livraison, heure_livraison,
              incoterms, mode_transport, instructions_livraison, conditions_paiement,
              delai_paiement_jours, mode_paiement, projet_id, centre_cout_id, budget_approuve,
              total_ht, total_tva, total_ttc, statut)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, 'brouillon') RETURNING id`,
            params
        );

        console.log('🟦 Résultat insertion commande:', {
            rows: commandeRows?.length || 0,
            commandeResult_keys: Object.keys(commandeResult || {}),
            hasRows: !!(commandeResult?.rows && commandeResult.rows[0]),
            insertId: commandeResult?.insertId,
            firstRowId: commandeResult?.[0]?.id
        });

        const commande_id = commandeResult.rows && commandeResult.rows[0] ? commandeResult.rows[0].id : (commandeResult.insertId || commandeResult[0]?.id);
        
        console.log('✅ Commande créée avec ID:', commande_id);
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/4b4f730e-c02b-49d5-b562-4d5fc3dd49d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'commandes.js:156',message:'Commande créée avec succès',data:{commande_id,numero,total_ht,total_ttc,lignesCount:lignes?.length},timestamp:Date.now(),sessionId:'test-complet',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion

        // Enregistrer dans l'historique du client si la commande est liée à une demande client
        if (devis_id) {
            try {
                const usePostgreSQL = !!(process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql');
                const placeholder = usePostgreSQL ? '$1' : '?';
                
                // Vérifier si la colonne demande_devis_id existe dans la table devis
                // Si elle n'existe pas, on ne peut pas récupérer le client_id
                let devisData = [];
                try {
                    [devisData] = await pool.execute(
                        `SELECT dd.client_id, d.numero as devis_numero 
                         FROM devis d 
                         LEFT JOIN demandes_devis dd ON d.demande_devis_id = dd.id 
                         WHERE d.id = ${placeholder}`,
                        [devis_id]
                    );
                } catch (err) {
                    // Si la colonne demande_devis_id n'existe pas, ignorer silencieusement
                    if (err.code === 'ER_BAD_FIELD_ERROR' && err.message.includes('demande_devis_id')) {
                        console.log('⚠️ Colonne demande_devis_id non disponible, historique client ignoré');
                        devisData = [];
                    } else {
                        throw err;
                    }
                }
                
                if (devisData.length > 0 && devisData[0].client_id) {
                    await enregistrerInteraction({
                        client_id: devisData[0].client_id,
                        type_interaction: 'commande_creee',
                        reference_document: numero,
                        document_id: commande_id,
                        description: `Commande créée depuis le devis ${devisData[0].devis_numero || devis_id}`,
                        utilisateur_id: req.user?.id || null,
                        metadata: {
                            commande_id: commande_id,
                            devis_id: devis_id,
                            montant_ttc: total_ttc || null
                        }
                    });
                }
            } catch (err) {
                console.error('Erreur enregistrement historique commande:', err);
            }
        }

        // Insérer les lignes
        if (lignes && lignes.length > 0) {
            console.log(`🟦 Insertion de ${lignes.length} ligne(s) de commande`);
            for (let i = 0; i < lignes.length; i++) {
                const ligne = lignes[i];
                const prix_ht = ligne.prix_unitaire_ht * ligne.quantite;
                const remise = prix_ht * (ligne.remise || 0) / 100;
                const total_ht_ligne = prix_ht - remise;

                console.log(`🟦 Insertion ligne ${i + 1}/${lignes.length}:`, {
                    commande_id,
                    description: ligne.description?.substring(0, 50),
                    quantite: ligne.quantite,
                    prix_unitaire_ht: ligne.prix_unitaire_ht,
                    total_ht_ligne
                });

                await pool.execute(
                    'INSERT INTO commande_lignes (commande_id, produit_id, reference, description, quantite, unite, prix_unitaire_ht, remise, total_ht, tva_taux, ordre) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
                    [commande_id, ligne.produit_id, ligne.reference, ligne.description, ligne.quantite, ligne.unite || 'unité', ligne.prix_unitaire_ht, ligne.remise || 0, total_ht_ligne, ligne.tva_taux || 20, ligne.ordre || 0]
                );
            }
            console.log('✅ Toutes les lignes de commande ont été insérées');
        } else {
            console.warn('⚠️ Aucune ligne de commande à insérer');
        }

        // Notifier le fournisseur qu'une commande a été créée
        // Note: Pour l'instant, on notifie l'utilisateur connecté. 
        // Dans un système complet, on devrait trouver l'utilisateur lié au fournisseur
        try {
            await createNotification(
                commandeur_id,
                'commande_créée',
                'Commande créée',
                `Une nouvelle commande ${numero || commande_id} a été créée pour un montant de ${total_ttc} GNF`,
                'commande',
                commande_id
            );
        } catch (error) {
            console.error('Erreur création notification commande:', error);
        }

        res.status(201).json({ id: commande_id, message: 'Commande créée avec succès' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Mettre à jour le statut d'une commande
router.patch('/:id/statut', validateId, async (req, res) => {
    try {
        const { id } = req.params;
        const { statut } = req.body;

        // Valider le statut
        const statutsValides = ['brouillon', 'envoye', 'en_preparation', 'partiellement_livre', 'livre', 'annule'];
        if (!statut || !statutsValides.includes(statut)) {
            return res.status(400).json({ 
                error: 'Statut invalide', 
                statutsValides: statutsValides 
            });
        }

        // Vérifier que la commande existe et récupérer les infos
        const [commandes] = await pool.execute(
            `SELECT c.*, dd.client_id 
             FROM commandes c 
             LEFT JOIN devis d ON c.devis_id = d.id 
             LEFT JOIN demandes_devis dd ON d.demande_devis_id = dd.id 
             WHERE c.id = $1`,
            [id]
        );
        if (commandes.length === 0) {
            return res.status(404).json({ error: 'Commande non trouvée' });
        }

        const commandeData = commandes[0];

        // Mettre à jour le statut
        await pool.execute('UPDATE commandes SET statut = $1 WHERE id = $2', [statut, id]);

        // Enregistrer dans l'historique du client si la commande est livrée
        if (commandeData.client_id && statut === 'livre') {
            try {
                await enregistrerInteraction({
                    client_id: commandeData.client_id,
                    type_interaction: 'commande_livree',
                    reference_document: commandeData.numero,
                    document_id: id,
                    description: `Commande livrée - ${commandeData.numero}`,
                    utilisateur_id: req.user?.id || null,
                    metadata: {
                        commande_id: id,
                        montant_ttc: commandeData.total_ttc || null
                    }
                });
            } catch (err) {
                console.error('Erreur enregistrement historique livraison:', err);
            }
        }

        res.json({ message: 'Statut mis à jour avec succès' });
    } catch (error) {
        console.error('Erreur mise à jour statut commande:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

