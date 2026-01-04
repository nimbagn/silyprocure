const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { validateId, validateFournisseurId } = require('../middleware/validation');
const path = require('path');
const fs = require('fs');
const router = express.Router();

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
        cb(null, 'produits-' + uniqueSuffix + path.extname(file.originalname));
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

// Upload et import de produits depuis Excel (nécessite authentification)
router.post('/produits/:fournisseur_id', authenticate, validateFournisseurId, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Aucun fichier fourni' });
        }

        const { fournisseur_id } = req.params;

        // Vérifier que l'entreprise est bien un fournisseur
        const [entreprises] = await pool.execute(
            'SELECT id, nom FROM entreprises WHERE id = ? AND type_entreprise = ?',
            [fournisseur_id, 'fournisseur']
        );

        if (entreprises.length === 0) {
            // Supprimer le fichier uploadé
            fs.unlinkSync(req.file.path);
            return res.status(404).json({ error: 'Fournisseur non trouvé' });
        }

        // Lire le fichier Excel
        const workbook = XLSX.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        if (data.length === 0) {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: 'Le fichier Excel est vide' });
        }

        // Récupérer les catégories pour mapping
        const [categories] = await pool.execute('SELECT id, libelle FROM categories WHERE actif = ?', [true]);
        const categorieMap = {};
        categories.forEach(cat => {
            categorieMap[cat.libelle.toLowerCase()] = cat.id;
        });

        const results = {
            success: 0,
            errors: 0,
            details: []
        };

        // Traiter chaque ligne
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            try {
                // Mapping des colonnes Excel (flexible)
                const reference = row['Référence'] || row['Reference'] || row['REF'] || row['ref'] || `PROD-${Date.now()}-${i}`;
                const reference_fournisseur = row['Référence Fournisseur'] || row['Reference Fournisseur'] || row['REF_FOURN'] || null;
                const libelle = row['Libellé'] || row['Libelle'] || row['Nom'] || row['Produit'] || row['Description'] || '';
                const categorie = row['Catégorie'] || row['Categorie'] || row['Category'] || null;
                const prix = parseFloat(row['Prix HT'] || row['Prix'] || row['Prix Unitaire'] || row['Prix_HT'] || 0);
                const prix_fournisseur = parseFloat(row['Prix Fournisseur'] || row['Prix_Fournisseur'] || prix || 0);
                const unite = row['Unité'] || row['Unite'] || row['Unit'] || 'unité';
                const tva = parseFloat(row['TVA'] || row['TVA %'] || 18);
                const description = row['Description'] || row['Desc'] || null;
                const disponible = row['Disponible'] !== undefined ? (row['Disponible'] === 'Oui' || row['Disponible'] === true || row['Disponible'] === 1) : true;
                const delai = row['Délai Livraison'] || row['Delai'] || row['Délai (jours)'] || null;
                const qte_min = row['Quantité Minimale'] || row['Qte Min'] || row['Qte_Min'] || null;

                if (!libelle || libelle.trim() === '') {
                    results.errors++;
                    results.details.push({
                        ligne: i + 2,
                        reference: reference,
                        erreur: 'Libellé manquant'
                    });
                    continue;
                }

                // Trouver la catégorie
                let categorie_id = null;
                if (categorie) {
                    const catLower = categorie.toLowerCase();
                    categorie_id = categorieMap[catLower] || null;
                    
                    // Si catégorie non trouvée, utiliser la première catégorie par défaut
                    if (!categorie_id && categories.length > 0) {
                        categorie_id = categories[0].id;
                    }
                } else if (categories.length > 0) {
                    categorie_id = categories[0].id;
                }

                // Vérifier si le produit existe déjà pour ce fournisseur
                const [existing] = await pool.execute(
                    'SELECT id FROM produits WHERE fournisseur_id = ? AND reference = ?',
                    [fournisseur_id, reference]
                );

                if (existing.length > 0) {
                    // Mettre à jour le produit existant
                    await pool.execute(
                        `UPDATE produits SET 
                            reference_fournisseur = ?, libelle = ?, categorie_id = ?,
                            prix_unitaire_ht = ?, prix_fournisseur = ?, unite = ?, tva_taux = ?,
                            description = ?, disponible = ?, delai_livraison_jours = ?, quantite_minimale = ?
                         WHERE id = ? AND fournisseur_id = ?`,
                        [
                            reference_fournisseur || null,
                            libelle,
                            categorie_id,
                            prix || null,
                            prix_fournisseur || null,
                            unite,
                            tva || 18,
                            description || null,
                            disponible,
                            delai ? parseInt(delai) : null,
                            qte_min ? parseFloat(qte_min) : null,
                            existing[0].id,
                            fournisseur_id
                        ]
                    );
                    results.success++;
                    results.details.push({
                        ligne: i + 2,
                        reference: reference,
                        action: 'Mis à jour'
                    });
                } else {
                    // Créer un nouveau produit
                    const [result] = await pool.execute(
                        `INSERT INTO produits (reference, reference_fournisseur, libelle, categorie_id, fournisseur_id,
                         prix_unitaire_ht, prix_fournisseur, unite, tva_taux, description, disponible,
                         delai_livraison_jours, quantite_minimale)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            reference,
                            reference_fournisseur || null,
                            libelle,
                            categorie_id,
                            parseInt(fournisseur_id),
                            prix || null,
                            prix_fournisseur || null,
                            unite,
                            tva || 18,
                            description || null,
                            disponible,
                            delai ? parseInt(delai) : null,
                            qte_min ? parseFloat(qte_min) : null
                        ]
                    );
                    results.success++;
                    results.details.push({
                        ligne: i + 2,
                        reference: reference,
                        action: 'Créé',
                        id: result.insertId
                    });
                }
            } catch (error) {
                results.errors++;
                results.details.push({
                    ligne: i + 2,
                    reference: row['Référence'] || row['Reference'] || 'N/A',
                    erreur: error.message
                });
            }
        }

        // Supprimer le fichier après traitement
        fs.unlinkSync(req.file.path);

        res.json({
            message: `Import terminé : ${results.success} produits importés, ${results.errors} erreurs`,
            results: results
        });
    } catch (error) {
        // Supprimer le fichier en cas d'erreur
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: error.message });
    }
});

// Télécharger un template Excel (accessible sans authentification)
router.get('/template', (req, res) => {
    try {
        // Créer un workbook avec un template
        const workbook = XLSX.utils.book_new();
        const templateData = [
            {
                'Référence': 'REF-001',
                'Référence Fournisseur': 'FOURN-REF-001',
                'Libellé': 'Nom du produit',
                'Catégorie': 'Matériel informatique',
                'Prix HT': 1000000,
                'Prix Fournisseur': 950000,
                'Unité': 'unité',
                'TVA %': 18,
                'Description': 'Description du produit',
                'Disponible': 'Oui',
                'Délai Livraison': 7,
                'Quantité Minimale': 1
            },
            {
                'Référence': 'REF-002',
                'Référence Fournisseur': 'FOURN-REF-002',
                'Libellé': 'Autre produit',
                'Catégorie': 'Fournitures de bureau',
                'Prix HT': 500000,
                'Prix Fournisseur': 450000,
                'Unité': 'unité',
                'TVA %': 18,
                'Description': 'Description',
                'Disponible': 'Oui',
                'Délai Livraison': 5,
                'Quantité Minimale': 10
            }
        ];

        const worksheet = XLSX.utils.json_to_sheet(templateData);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Produits');

        // Générer le fichier en mémoire
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=template-produits.xlsx');
        res.send(buffer);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

