const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { validateId, validateFournisseurId, validateProduit } = require('../middleware/validation');
const { parseExcelFile, validateAndTransformProducts, importProductsFromExcel } = require('../utils/excelParser');
const router = express.Router();

router.use(authenticate);

// Configuration Multer pour l'upload de fichiers Excel
const uploadDir = path.join(__dirname, '../../uploads/excel');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'catalogue-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter: (req, file, cb) => {
        const allowedExtensions = ['.xlsx', '.xls', '.csv'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedExtensions.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Format de fichier non supporté. Utilisez .xlsx, .xls ou .csv'));
        }
    }
});

// Liste des produits d'un fournisseur
router.get('/fournisseur/:fournisseurId', validateFournisseurId, async (req, res) => {
    try {
        const { fournisseurId } = req.params;
        const { search, disponible, categorie_id } = req.query;

        let query = `
            SELECT p.*, c.libelle as categorie_libelle, e.nom as fournisseur_nom
            FROM produits p
            LEFT JOIN categories c ON p.categorie_id = c.id
            LEFT JOIN entreprises e ON p.fournisseur_id = e.id
            WHERE p.fournisseur_id = ?
        `;
        const params = [fournisseurId];

        if (search) {
            query += ' AND (p.reference LIKE ? OR p.libelle LIKE ? OR p.description LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        if (disponible !== undefined) {
            query += ' AND p.disponible = ?';
            params.push(disponible === 'true' ? true : false);
        }

        if (categorie_id) {
            query += ' AND p.categorie_id = ?';
            params.push(categorie_id);
        }

        query += ' ORDER BY p.libelle';

        const [produitsRows] = await pool.execute(query, params);
        const produits = produitsRows;
        res.json(produits);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Upload et import Excel
router.post('/fournisseur/:fournisseurId/import-excel', validateFournisseurId, upload.single('file'), async (req, res) => {
    try {
        const { fournisseurId } = req.params;

        if (!req.file) {
            return res.status(400).json({ error: 'Aucun fichier fourni' });
        }

        // Vérifier que l'entreprise est un fournisseur
        const [entreprises] = await pool.execute(
            'SELECT id, type_entreprise FROM entreprises WHERE id = ?',
            [fournisseurId]
        );

        if (entreprises.length === 0) {
            // Supprimer le fichier uploadé
            fs.unlinkSync(req.file.path);
            return res.status(404).json({ error: 'Fournisseur non trouvé' });
        }

        if (entreprises[0].type_entreprise !== 'fournisseur') {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: 'Cette entreprise n\'est pas un fournisseur' });
        }

        // Parser le fichier Excel
        const excelData = parseExcelFile(req.file.path);
        
        if (excelData.length === 0) {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: 'Le fichier Excel est vide ou ne contient pas de données' });
        }

        // Valider et transformer les données
        const { produits, errors } = validateAndTransformProducts(excelData, fournisseurId);

        if (errors.length > 0 && produits.length === 0) {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({
                error: 'Erreurs de validation',
                details: errors
            });
        }

        // Importer les produits
        const results = await importProductsFromExcel(produits, fournisseurId);

        // Supprimer le fichier après traitement
        fs.unlinkSync(req.file.path);

        res.json({
            message: 'Import terminé',
            success: results.success,
            errors: results.errors,
            warnings: errors,
            total: excelData.length
        });
    } catch (error) {
        // Supprimer le fichier en cas d'erreur
        if (req.file && req.file.path) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (e) {
                // Ignorer l'erreur de suppression
            }
        }
        res.status(500).json({ error: error.message });
    }
});

// Créer un produit pour un fournisseur
router.post('/fournisseur/:fournisseurId/produits', validateFournisseurId, validateProduit, async (req, res) => {
    try {
        const { fournisseurId } = req.params;
        const {
            reference, reference_fournisseur, libelle, description, categorie_id,
            prix_fournisseur, unite, tva_taux, disponible, delai_livraison_jours, quantite_minimale
        } = req.body;

        // Vérifier que l'entreprise est un fournisseur
        const [entreprises] = await pool.execute(
            'SELECT id, type_entreprise FROM entreprises WHERE id = ?',
            [fournisseurId]
        );

        if (entreprises.length === 0 || entreprises[0].type_entreprise !== 'fournisseur') {
            return res.status(400).json({ error: 'Entreprise non trouvée ou n\'est pas un fournisseur' });
        }

        // Vérifier l'unicité de la référence pour ce fournisseur
        const [existing] = await pool.execute(
            'SELECT id FROM produits WHERE fournisseur_id = ? AND reference = ?',
            [fournisseurId, reference]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: 'Un produit avec cette référence existe déjà pour ce fournisseur' });
        }

        const [result] = await pool.execute(
            `INSERT INTO produits (
                reference, reference_fournisseur, libelle, description,
                categorie_id, fournisseur_id, prix_fournisseur, prix_unitaire_ht,
                unite, tva_taux, disponible, delai_livraison_jours, quantite_minimale
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                reference, reference_fournisseur || reference, libelle, description || null,
                categorie_id || null, fournisseurId, prix_fournisseur, prix_fournisseur,
                unite || 'unité', tva_taux || 18, disponible !== undefined ? disponible : true,
                delai_livraison_jours || null, quantite_minimale || null
            ]
        );

        res.status(201).json({
            id: result.insertId,
            message: 'Produit créé avec succès'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Mettre à jour un produit fournisseur
router.put('/fournisseur/:fournisseurId/produits/:produitId', validateFournisseurId, validateId, validateProduit, async (req, res) => {
    try {
        const { fournisseurId, produitId } = req.params;
        const {
            reference, reference_fournisseur, libelle, description, categorie_id,
            prix_fournisseur, unite, tva_taux, disponible, delai_livraison_jours, quantite_minimale
        } = req.body;

        // Vérifier que le produit appartient au fournisseur
        const [produits] = await pool.execute(
            'SELECT id FROM produits WHERE id = ? AND fournisseur_id = ?',
            [produitId, fournisseurId]
        );

        if (produits.length === 0) {
            return res.status(404).json({ error: 'Produit non trouvé pour ce fournisseur' });
        }

        await pool.execute(
            `UPDATE produits SET 
                reference = ?, reference_fournisseur = ?, libelle = ?, description = ?,
                categorie_id = ?, prix_fournisseur = ?, prix_unitaire_ht = ?,
                unite = ?, tva_taux = ?, disponible = ?,
                delai_livraison_jours = ?, quantite_minimale = ?
             WHERE id = ? AND fournisseur_id = ?`,
            [
                reference, reference_fournisseur || reference, libelle, description || null,
                categorie_id || null, prix_fournisseur, prix_fournisseur,
                unite || 'unité', tva_taux || 18, disponible !== undefined ? disponible : true,
                delai_livraison_jours || null, quantite_minimale || null,
                produitId, fournisseurId
            ]
        );

        res.json({ message: 'Produit mis à jour avec succès' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Supprimer un produit fournisseur
router.delete('/fournisseur/:fournisseurId/produits/:produitId', validateFournisseurId, validateId, async (req, res) => {
    try {
        const { fournisseurId, produitId } = req.params;

        // Vérifier que le produit appartient au fournisseur
        const [produits] = await pool.execute(
            'SELECT id FROM produits WHERE id = ? AND fournisseur_id = ?',
            [produitId, fournisseurId]
        );

        if (produits.length === 0) {
            return res.status(404).json({ error: 'Produit non trouvé pour ce fournisseur' });
        }

        await pool.execute('DELETE FROM produits WHERE id = ? AND fournisseur_id = ?', [produitId, fournisseurId]);

        res.json({ message: 'Produit supprimé avec succès' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Télécharger un template Excel
router.get('/template-excel', (req, res) => {
    const XLSX = require('xlsx');
    
    // Créer un workbook avec un template
    const wb = XLSX.utils.book_new();
    const wsData = [
        ['Référence', 'Libellé', 'Description', 'Prix HT (GNF)', 'Unité', 'TVA (%)', 'Catégorie', 'Réf. Fournisseur', 'Disponible', 'Délai (jours)', 'Qté Min'],
        ['REF-001', 'Exemple Produit 1', 'Description du produit', '100000', 'unité', '18', 'Matériel informatique', 'REF-001', 'Oui', '7', '1'],
        ['REF-002', 'Exemple Produit 2', 'Description du produit 2', '50000', 'unité', '18', 'Fournitures de bureau', 'REF-002', 'Oui', '5', '10']
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Catalogue');

    // Générer le buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="template-catalogue-fournisseur.xlsx"');
    res.send(buffer);
});

module.exports = router;

