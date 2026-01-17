const express = require('express');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { validateId } = require('../middleware/validation');
const { generateRFQPDF, generateDevisPDF, generateCommandePDF, generateFacturePDF } = require('../utils/pdfGenerator');
const path = require('path');
const fs = require('fs');
const router = express.Router();

router.use(authenticate);

// Créer le dossier uploads/pdf s'il n'existe pas
const pdfDir = path.join(__dirname, '../../uploads/pdf');
if (!fs.existsSync(pdfDir)) {
    fs.mkdirSync(pdfDir, { recursive: true });
}

// Générer PDF pour une RFQ
router.get('/rfq/:id', validateId, async (req, res) => {
    try {
        const { id } = req.params;

        // Récupérer la RFQ avec ses lignes
        const [rfqs] = await pool.execute(
            `SELECT r.*, 
                    e1.nom as emetteur_nom,
                    e2.nom as destinataire_nom
             FROM rfq r
             LEFT JOIN entreprises e1 ON r.emetteur_id = e1.id
             LEFT JOIN entreprises e2 ON r.destinataire_id = e2.id
             WHERE r.id = ?`,
            [id]
        );

        if (rfqs.length === 0) {
            return res.status(404).json({ error: 'RFQ non trouvée' });
        }

        const rfq = rfqs[0];

        // Récupérer les lignes
        const [lignes] = await pool.execute(
            'SELECT * FROM rfq_lignes WHERE rfq_id = ? ORDER BY ordre',
            [id]
        );
        rfq.lignes = lignes;

        // Générer le PDF
        const filename = `RFQ-${rfq.numero || id}-${Date.now()}.pdf`;
        const outputPath = path.join(pdfDir, filename);
        
        await generateRFQPDF(rfq, outputPath);

        // Envoyer le PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.sendFile(outputPath);
    } catch (error) {
        console.error('Erreur génération PDF RFQ:', error);
        res.status(500).json({ error: 'Erreur lors de la génération du PDF' });
    }
});

// Générer PDF pour un Devis
router.get('/devis/:id', validateId, async (req, res) => {
    try {
        const { id } = req.params;

        // Récupérer le devis avec ses lignes et informations complètes
        const [devisList] = await pool.execute(
            `SELECT d.*, 
                    e.nom as fournisseur_nom,
                    e.telephone as fournisseur_telephone,
                    e.email as fournisseur_email,
                    ae.adresse_ligne1 as fournisseur_adresse,
                    ae.ville as fournisseur_ville,
                    c.nom as client_nom,
                    c.telephone as client_telephone,
                    c.email as client_email,
                    ac.adresse_ligne1 as client_adresse,
                    ac.ville as client_ville
             FROM devis d
             LEFT JOIN entreprises e ON d.fournisseur_id = e.id
             LEFT JOIN adresses ae ON e.id = ae.entreprise_id AND ae.type_adresse = 'siege'
             LEFT JOIN entreprises c ON d.client_id = c.id
             LEFT JOIN adresses ac ON c.id = ac.entreprise_id AND ac.type_adresse = 'siege'
             WHERE d.id = ?`,
            [id]
        );

        if (devisList.length === 0) {
            return res.status(404).json({ error: 'Devis non trouvé' });
        }

        const devis = devisList[0];

        // Récupérer les lignes
        const [lignes] = await pool.execute(
            'SELECT * FROM devis_lignes WHERE devis_id = ? ORDER BY ordre',
            [id]
        );
        devis.lignes = lignes;

        // Générer le PDF
        const filename = `Devis-${devis.numero || id}-${Date.now()}.pdf`;
        const outputPath = path.join(pdfDir, filename);
        
        await generateDevisPDF(devis, outputPath);

        // Envoyer le PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.sendFile(outputPath);
    } catch (error) {
        console.error('Erreur génération PDF Devis:', error);
        res.status(500).json({ error: 'Erreur lors de la génération du PDF' });
    }
});

// Générer PDF pour une Commande
router.get('/commande/:id', validateId, async (req, res) => {
    try {
        const { id } = req.params;

        // Récupérer la commande avec ses lignes et informations complètes
        const [commandes] = await pool.execute(
            `SELECT c.*, 
                    e.nom as fournisseur_nom,
                    e.telephone as fournisseur_telephone,
                    e.email as fournisseur_email,
                    a.adresse_ligne1 as fournisseur_adresse,
                    a.ville as fournisseur_ville,
                    al.adresse_ligne1 as adresse_livraison,
                    al.adresse_ligne2 as adresse_livraison_ligne2,
                    al.ville as ville_livraison,
                    al.code_postal as code_postal_livraison,
                    al.pays as pays_livraison
             FROM commandes c
             LEFT JOIN entreprises e ON c.fournisseur_id = e.id
             LEFT JOIN adresses a ON e.id = a.entreprise_id AND a.type_adresse = 'siege'
             LEFT JOIN adresses al ON c.adresse_livraison_id = al.id
             WHERE c.id = ?`,
            [id]
        );

        if (commandes.length === 0) {
            return res.status(404).json({ error: 'Commande non trouvée' });
        }

        const commande = commandes[0];

        // #region agent log
        console.log('🔍 PDF Commande - Données récupérées:', {
            id: commande.id,
            numero: commande.numero,
            adresse_livraison: commande.adresse_livraison,
            ville_livraison: commande.ville_livraison,
            contact_livraison: commande.contact_livraison,
            telephone_livraison: commande.telephone_livraison,
            instructions_livraison: commande.instructions_livraison ? 'présent' : 'absent'
        });
        // #endregion

        // Récupérer les lignes
        const [lignes] = await pool.execute(
            'SELECT * FROM commande_lignes WHERE commande_id = ? ORDER BY ordre',
            [id]
        );
        commande.lignes = lignes;

        // Générer le PDF
        const filename = `Commande-${commande.numero || id}-${Date.now()}.pdf`;
        const outputPath = path.join(pdfDir, filename);
        
        await generateCommandePDF(commande, outputPath);

        // #region agent log
        console.log('🔍 PDF Commande - Requête reçue:', {
            id,
            query: req.query,
            accept: req.headers.accept,
            authorization: req.headers.authorization ? 'présent' : 'absent'
        });
        // #endregion
        
        // Déterminer si c'est une prévisualisation ou un téléchargement
        const isPreview = req.query.preview === 'true' || req.headers.accept?.includes('text/html');
        
        // #region agent log
        console.log('🔍 PDF Commande - isPreview:', isPreview);
        // #endregion

        // Envoyer le PDF
        res.setHeader('Content-Type', 'application/pdf');
        if (isPreview) {
            // Pour la prévisualisation, utiliser 'inline' au lieu de 'attachment'
            res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
        } else {
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        }
        
        // #region agent log
        console.log('🔍 PDF Commande - Envoi du fichier:', outputPath);
        // #endregion
        
        res.sendFile(outputPath);
    } catch (error) {
        console.error('Erreur génération PDF Commande:', error);
        res.status(500).json({ error: 'Erreur lors de la génération du PDF' });
    }
});

// Générer PDF pour une Facture (sans afficher les prix d'achat ni la marge)
router.get('/facture/:id', validateId, async (req, res) => {
    try {
        const { id } = req.params;

        // Récupérer la facture avec ses lignes et informations complètes
        const [factures] = await pool.execute(
            `SELECT f.*, 
                    e1.nom as facturier_nom,
                    a1.adresse_ligne1 as facturier_adresse,
                    a1.ville as facturier_ville,
                    e2.nom as client_nom,
                    e2.telephone as client_telephone,
                    e2.email as client_email,
                    a2.adresse_ligne1 as client_adresse,
                    a2.ville as client_ville
             FROM factures f
             LEFT JOIN entreprises e1 ON f.facturier_id = e1.id
             LEFT JOIN adresses a1 ON e1.id = a1.entreprise_id AND a1.type_adresse = 'siege'
             LEFT JOIN entreprises e2 ON f.client_id = e2.id
             LEFT JOIN adresses a2 ON e2.id = a2.entreprise_id AND a2.type_adresse = 'siege'
             WHERE f.id = ?`,
            [id]
        );

        if (factures.length === 0) {
            return res.status(404).json({ error: 'Facture non trouvée' });
        }

        const facture = factures[0];

        // Récupérer les lignes (sans prix_achat_ht ni marge_appliquee pour le client)
        const [lignes] = await pool.execute(
            'SELECT id, produit_id, reference, description, quantite, unite, prix_unitaire_ht, remise, total_ht, tva_taux, ordre FROM facture_lignes WHERE facture_id = ? ORDER BY ordre',
            [id]
        );
        facture.lignes = lignes;

        // Générer le PDF
        const filename = `Facture-${facture.numero || id}-${Date.now()}.pdf`;
        const outputPath = path.join(pdfDir, filename);
        
        await generateFacturePDF(facture, outputPath);

        // Envoyer le PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.sendFile(outputPath);
    } catch (error) {
        console.error('Erreur génération PDF Facture:', error);
        res.status(500).json({ error: 'Erreur lors de la génération du PDF' });
    }
});

module.exports = router;

