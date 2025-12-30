const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { validateId } = require('../middleware/validation');
const path = require('path');
const fs = require('fs');
const router = express.Router();

router.use(authenticate);

// Configuration Multer pour l'upload de fichiers Excel
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads/excel');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'devis-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter: (req, file, cb) => {
        const allowedExtensions = ['.xlsx', '.xls'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedExtensions.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Seuls les fichiers Excel (.xlsx, .xls) sont autorisés'));
        }
    }
});

// Exporter une RFQ en Excel
router.get('/rfq/:id', validateId, async (req, res) => {
    try {
        const { id } = req.params;

        // Récupérer la RFQ avec ses lignes
        const [rfqs] = await pool.execute(
            `SELECT r.*, 
                    e1.nom as emetteur_nom, e1.email as emetteur_email,
                    e2.nom as destinataire_nom, e2.email as destinataire_email
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

        // Créer un nouveau workbook
        const workbook = XLSX.utils.book_new();

        // Feuille 1 : Informations générales
        const infoData = [
            ['DEMANDE DE DEVIS (RFQ)', ''],
            ['', ''],
            ['Numéro RFQ', rfq.numero || ''],
            ['Date d\'émission', rfq.date_emission ? new Date(rfq.date_emission).toLocaleDateString('fr-FR') : ''],
            ['Date limite de réponse', rfq.date_limite_reponse ? new Date(rfq.date_limite_reponse).toLocaleDateString('fr-FR') : ''],
            ['', ''],
            ['ÉMETTEUR', ''],
            ['Nom', rfq.emetteur_nom || ''],
            ['Email', rfq.emetteur_email || ''],
            ['', ''],
            ['DESTINATAIRE', ''],
            ['Nom', rfq.destinataire_nom || ''],
            ['Email', rfq.destinataire_email || ''],
            ['', ''],
            ['Description', rfq.description || ''],
            ['', ''],
            ['Conditions de livraison', rfq.conditions_paiement || ''],
            ['Incoterms', rfq.incoterms || ''],
        ];

        const infoSheet = XLSX.utils.aoa_to_sheet(infoData);
        XLSX.utils.book_append_sheet(workbook, infoSheet, 'Informations');

        // Feuille 2 : Lignes de devis à remplir
        const lignesData = [
            ['Référence', 'Description', 'Quantité', 'Unité', 'Prix unitaire HT', 'Remise %', 'TVA %', 'Total HT', 'Total TTC'],
        ];

        lignes.forEach((ligne, index) => {
            lignesData.push([
                ligne.reference || '',
                ligne.description || '',
                ligne.quantite || 0,
                ligne.unite || 'unité',
                '', // Prix unitaire HT - à remplir par le fournisseur
                '', // Remise % - à remplir par le fournisseur
                20, // TVA % - par défaut 20%
                '', // Total HT - calculé
                '', // Total TTC - calculé
            ]);
        });

        // Ajouter des lignes vides pour permettre au fournisseur d'ajouter des lignes
        for (let i = 0; i < 5; i++) {
            lignesData.push(['', '', '', '', '', '', 20, '', '']);
        }

        const lignesSheet = XLSX.utils.aoa_to_sheet(lignesData);
        
        // Définir la largeur des colonnes
        lignesSheet['!cols'] = [
            { wch: 15 }, // Référence
            { wch: 40 }, // Description
            { wch: 10 }, // Quantité
            { wch: 10 }, // Unité
            { wch: 15 }, // Prix unitaire HT
            { wch: 10 }, // Remise %
            { wch: 10 }, // TVA %
            { wch: 15 }, // Total HT
            { wch: 15 }, // Total TTC
        ];

        XLSX.utils.book_append_sheet(workbook, lignesSheet, 'Lignes de devis');

        // Générer le fichier Excel en mémoire
        const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        // Envoyer le fichier
        const filename = `RFQ-${rfq.numero || id}-${Date.now()}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(excelBuffer);
    } catch (error) {
        console.error('Erreur génération Excel RFQ:', error);
        res.status(500).json({ error: 'Erreur lors de la génération du fichier Excel' });
    }
});

// Importer un devis depuis un fichier Excel retourné par un fournisseur externe
router.post('/import-devis/:rfq_id', validateId, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Aucun fichier fourni' });
        }

        const { rfq_id } = req.params;

        // Vérifier que la RFQ existe
        const [rfqs] = await pool.execute(
            `SELECT r.*, e.id as fournisseur_id, e.nom as fournisseur_nom
             FROM rfq r
             LEFT JOIN entreprises e ON r.destinataire_id = e.id
             WHERE r.id = ?`,
            [rfq_id]
        );

        if (rfqs.length === 0) {
            fs.unlinkSync(req.file.path);
            return res.status(404).json({ error: 'RFQ non trouvée' });
        }

        const rfq = rfqs[0];

        // Lire le fichier Excel
        const workbook = XLSX.readFile(req.file.path);
        
        // Chercher la feuille "Lignes de devis"
        let sheetName = workbook.SheetNames.find(name => 
            name.toLowerCase().includes('ligne') || name.toLowerCase().includes('devis')
        ) || workbook.SheetNames[1] || workbook.SheetNames[0];

        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (data.length < 2) {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: 'Le fichier Excel ne contient pas assez de données' });
        }

        // Récupérer les lignes de la RFQ pour faire le mapping
        const [rfqLignes] = await pool.execute(
            'SELECT * FROM rfq_lignes WHERE rfq_id = ? ORDER BY ordre',
            [rfq_id]
        );

        // Parser les données Excel
        // En-tête attendu : Référence, Description, Quantité, Unité, Prix unitaire HT, Remise %, TVA %, Total HT, Total TTC
        const lignes = [];
        const errors = [];

        // Trouver la ligne d'en-tête
        let headerRowIndex = 0;
        for (let i = 0; i < Math.min(5, data.length); i++) {
            if (data[i] && data[i].some(cell => cell && (cell.toString().toLowerCase().includes('référence') || cell.toString().toLowerCase().includes('reference')))) {
                headerRowIndex = i;
                break;
            }
        }

        const headerRow = data[headerRowIndex] || [];
        const refIndex = headerRow.findIndex(h => h && (h.toString().toLowerCase().includes('référence') || h.toString().toLowerCase().includes('reference')));
        const descIndex = headerRow.findIndex(h => h && (h.toString().toLowerCase().includes('description') || h.toString().toLowerCase().includes('desc')));
        const qteIndex = headerRow.findIndex(h => h && (h.toString().toLowerCase().includes('quantité') || h.toString().toLowerCase().includes('quantite') || h.toString().toLowerCase().includes('qte')));
        const prixIndex = headerRow.findIndex(h => h && (h.toString().toLowerCase().includes('prix') && h.toString().toLowerCase().includes('unitaire')));
        const remiseIndex = headerRow.findIndex(h => h && (h.toString().toLowerCase().includes('remise')));
        const tvaIndex = headerRow.findIndex(h => h && (h.toString().toLowerCase().includes('tva')));

        // Parser les lignes de données
        for (let i = headerRowIndex + 1; i < data.length; i++) {
            const row = data[i];
            if (!row || row.every(cell => !cell || cell.toString().trim() === '')) continue;

            const reference = refIndex >= 0 ? (row[refIndex] || '').toString().trim() : '';
            const description = descIndex >= 0 ? (row[descIndex] || '').toString().trim() : '';
            const quantite = qteIndex >= 0 ? parseFloat(row[qteIndex]) || 1 : 1;
            const prixUnitaire = prixIndex >= 0 ? parseFloat(row[prixIndex]) || 0 : 0;
            const remise = remiseIndex >= 0 ? parseFloat(row[remiseIndex]) || 0 : 0;
            const tva = tvaIndex >= 0 ? parseFloat(row[tvaIndex]) || 20 : 20;

            if (!reference && !description) continue; // Ligne vide

            // Trouver la ligne RFQ correspondante par référence ou description
            let rfqLigne = rfqLignes.find(l => 
                (l.reference && l.reference === reference) || 
                (l.description && l.description.includes(description)) ||
                (description && l.description && l.description.includes(description))
            ) || rfqLignes[lignes.length]; // Fallback sur l'ordre

            if (!rfqLigne) {
                errors.push(`Ligne ${i + 1}: Aucune ligne RFQ correspondante trouvée`);
                continue;
            }

            if (prixUnitaire <= 0) {
                errors.push(`Ligne ${i + 1}: Prix unitaire manquant ou invalide`);
                continue;
            }

            lignes.push({
                rfq_ligne_id: rfqLigne.id,
                quantite: quantite,
                unite: rfqLigne.unite || 'unité',
                prix_unitaire_ht: prixUnitaire,
                remise: remise,
                tva_taux: tva,
                description: description || rfqLigne.description,
                reference: reference || rfqLigne.reference,
                ordre: lignes.length
            });
        }

        if (lignes.length === 0) {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ 
                error: 'Aucune ligne valide trouvée dans le fichier Excel',
                details: errors
            });
        }

        // Récupérer les données du formulaire (si fournies)
        const { numero, date_emission, date_validite, delai_livraison, remise_globale, 
                conditions_paiement, garanties, certifications, notes } = req.body;

        // Calculer les totaux
        let total_ht = 0;
        let total_tva = 0;
        let total_ttc = 0;

        for (const ligne of lignes) {
            const prix_ht = ligne.prix_unitaire_ht * ligne.quantite;
            const remise = prix_ht * (ligne.remise || 0) / 100;
            const ligne_ht = prix_ht - remise;
            const ligne_tva = ligne_ht * (ligne.tva_taux || 20) / 100;
            total_ht += ligne_ht;
            total_tva += ligne_tva;
        }

        const remiseGlobaleValue = parseFloat(remise_globale) || 0;
        total_ht = total_ht * (1 - remiseGlobaleValue / 100);
        total_tva = total_tva * (1 - remiseGlobaleValue / 100);
        total_ttc = total_ht + total_tva;

        // Créer le devis
        const [result] = await pool.execute(
            `INSERT INTO devis (numero, rfq_id, fournisseur_id, date_emission, date_validite, 
              delai_livraison, remise_globale, total_ht, total_tva, total_ttc, 
              conditions_paiement, garanties, certifications, notes, statut)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'envoye')`,
            [
                numero || `DEV-${rfq.numero || rfq_id}-${Date.now()}`,
                rfq_id,
                rfq.fournisseur_id,
                date_emission || new Date().toISOString().split('T')[0],
                date_validite || null,
                delai_livraison ? parseInt(delai_livraison) : null,
                remiseGlobaleValue,
                total_ht,
                total_tva,
                total_ttc,
                conditions_paiement || null,
                garanties || null,
                certifications || null,
                notes || null
            ]
        );

        const devis_id = result.insertId;

        // Insérer les lignes
        for (const ligne of lignes) {
            const prix_ht = ligne.prix_unitaire_ht * ligne.quantite;
            const remise = prix_ht * (ligne.remise || 0) / 100;
            const total_ht_ligne = prix_ht - remise;

            await pool.execute(
                'INSERT INTO devis_lignes (devis_id, rfq_ligne_id, produit_id, reference, description, quantite, unite, prix_unitaire_ht, remise, total_ht, tva_taux, ordre) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [devis_id, ligne.rfq_ligne_id, null, ligne.reference, ligne.description, ligne.quantite, ligne.unite, ligne.prix_unitaire_ht, ligne.remise || 0, total_ht_ligne, ligne.tva_taux || 20, ligne.ordre || 0]
            );
        }

        // Mettre à jour le statut de la RFQ
        await pool.execute('UPDATE rfq SET statut = ? WHERE id = ?', ['en_cours', rfq_id]);

        // Supprimer le fichier après traitement
        fs.unlinkSync(req.file.path);

        res.status(201).json({
            id: devis_id,
            message: 'Devis importé avec succès',
            lignes_importees: lignes.length,
            erreurs: errors.length,
            details_erreurs: errors.length > 0 ? errors : undefined
        });
    } catch (error) {
        // Supprimer le fichier en cas d'erreur
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        console.error('Erreur import devis Excel:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

