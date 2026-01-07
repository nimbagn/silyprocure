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

        // Récupérer le devis avec ses lignes
        const [devisList] = await pool.execute(
            `SELECT d.*, 
                    e.nom as fournisseur_nom
             FROM devis d
             LEFT JOIN entreprises e ON d.fournisseur_id = e.id
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

        // Récupérer la commande avec ses lignes
        const [commandes] = await pool.execute(
            `SELECT c.*, 
                    e.nom as fournisseur_nom
             FROM commandes c
             LEFT JOIN entreprises e ON c.fournisseur_id = e.id
             WHERE c.id = $1`,
            [id]
        );

        if (commandes.length === 0) {
            return res.status(404).json({ error: 'Commande non trouvée' });
        }

        const commande = commandes[0];

        // Récupérer les lignes
        const [lignes] = await pool.execute(
            'SELECT * FROM commande_lignes WHERE commande_id = $1 ORDER BY ordre',
            [id]
        );
        commande.lignes = lignes;

        // Générer le PDF
        const filename = `Commande-${commande.numero || id}-${Date.now()}.pdf`;
        const outputPath = path.join(pdfDir, filename);
        
        await generateCommandePDF(commande, outputPath);

        // Envoyer le PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
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

        // Récupérer la facture avec ses lignes
        const [factures] = await pool.execute(
            `SELECT f.*, 
                    e1.nom as facturier_nom,
                    e2.nom as client_nom
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

