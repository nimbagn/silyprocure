const express = require('express');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { validateId, validateFournisseurId, validatePagination, validateProduit } = require('../middleware/validation');
const router = express.Router();

router.use(authenticate);

// Liste des produits d'un fournisseur spécifique
router.get('/fournisseur/:fournisseur_id', validateFournisseurId, validatePagination, async (req, res) => {
    try {
        const { fournisseur_id } = req.params;
        const { categorie_id, search, page = 1, limit = 20 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;

        let query = `
            SELECT p.*, c.libelle as categorie_libelle, e.nom as fournisseur_nom
            FROM produits p
            LEFT JOIN categories c ON p.categorie_id = c.id
            LEFT JOIN entreprises e ON p.fournisseur_id = e.id
            WHERE p.fournisseur_id = ?
        `;
        let countQuery = 'SELECT COUNT(*) as total FROM produits p WHERE p.fournisseur_id = ?';
        const params = [fournisseur_id];
        const countParams = [fournisseur_id];

        if (categorie_id) {
            query += ' AND p.categorie_id = ?';
            countQuery += ' AND p.categorie_id = ?';
            params.push(categorie_id);
            countParams.push(categorie_id);
        }

        if (search) {
            query += ' AND (p.reference LIKE ? OR p.libelle LIKE ? OR p.reference_fournisseur LIKE ?)';
            countQuery += ' AND (p.reference LIKE ? OR p.libelle LIKE ? OR p.reference_fournisseur LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
            countParams.push(searchTerm, searchTerm, searchTerm);
        }

        query += ` ORDER BY p.libelle LIMIT ${limitNum} OFFSET ${offset}`;

        const [produits] = await pool.execute(query, params);
        const [countResult] = await pool.execute(countQuery, countParams);
        const total = countResult[0].total;

        res.json({
            data: produits,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: total,
                pages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Créer un produit pour un fournisseur
router.post('/fournisseur/:fournisseur_id', validateFournisseurId, validateProduit, async (req, res) => {
    try {
        const { fournisseur_id } = req.params;
        const {
            reference, reference_fournisseur, libelle, categorie_id, prix_unitaire_ht, prix_fournisseur,
            unite, tva_taux, description, disponible, delai_livraison_jours, quantite_minimale
        } = req.body;

        // Validation
        if (!reference || !libelle || !categorie_id) {
            return res.status(400).json({ 
                error: 'Les champs référence, libellé et catégorie sont obligatoires' 
            });
        }

        // Vérifier que l'entreprise est bien un fournisseur
        const [entreprises] = await pool.execute(
            'SELECT id, type_entreprise FROM entreprises WHERE id = ? AND type_entreprise = ?',
            [fournisseur_id, 'fournisseur']
        );

        if (entreprises.length === 0) {
            return res.status(404).json({ error: 'Fournisseur non trouvé' });
        }

        // Vérifier l'unicité de la référence pour ce fournisseur
        const [existing] = await pool.execute(
            'SELECT id FROM produits WHERE fournisseur_id = ? AND reference = ?',
            [fournisseur_id, reference]
        );

        if (existing.length > 0) {
            return res.status(400).json({ 
                error: 'Un produit avec cette référence existe déjà pour ce fournisseur' 
            });
        }

        const [result] = await pool.execute(
            `INSERT INTO produits (reference, reference_fournisseur, libelle, categorie_id, fournisseur_id, 
             prix_unitaire_ht, prix_fournisseur, unite, tva_taux, description, disponible, 
             delai_livraison_jours, quantite_minimale) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                reference,
                reference_fournisseur || null,
                libelle,
                parseInt(categorie_id),
                parseInt(fournisseur_id),
                prix_unitaire_ht ? parseFloat(prix_unitaire_ht) : null,
                prix_fournisseur ? parseFloat(prix_fournisseur) : null,
                unite || 'unité',
                parseFloat(tva_taux) || 18,
                description || null,
                disponible !== undefined ? disponible : true,
                delai_livraison_jours ? parseInt(delai_livraison_jours) : null,
                quantite_minimale ? parseFloat(quantite_minimale) : null
            ]
        );

        res.status(201).json({ 
            id: result.insertId, 
            message: 'Produit créé avec succès pour le fournisseur' 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Mettre à jour un produit fournisseur
router.put('/fournisseur/:fournisseur_id/:id', validateFournisseurId, validateId, validateProduit, async (req, res) => {
    try {
        const { fournisseur_id, id } = req.params;
        const {
            reference, reference_fournisseur, libelle, categorie_id, prix_unitaire_ht, prix_fournisseur,
            unite, tva_taux, description, disponible, delai_livraison_jours, quantite_minimale
        } = req.body;

        // Vérifier que le produit appartient au fournisseur
        const [produits] = await pool.execute(
            'SELECT id FROM produits WHERE id = ? AND fournisseur_id = ?',
            [id, fournisseur_id]
        );

        if (produits.length === 0) {
            return res.status(404).json({ error: 'Produit non trouvé pour ce fournisseur' });
        }

        await pool.execute(
            `UPDATE produits SET 
                reference = ?, reference_fournisseur = ?, libelle = ?, categorie_id = ?,
                prix_unitaire_ht = ?, prix_fournisseur = ?, unite = ?, tva_taux = ?,
                description = ?, disponible = ?, delai_livraison_jours = ?, quantite_minimale = ?
             WHERE id = ? AND fournisseur_id = ?`,
            [
                reference,
                reference_fournisseur || null,
                libelle,
                parseInt(categorie_id),
                prix_unitaire_ht ? parseFloat(prix_unitaire_ht) : null,
                prix_fournisseur ? parseFloat(prix_fournisseur) : null,
                unite || 'unité',
                parseFloat(tva_taux) || 18,
                description || null,
                disponible !== undefined ? disponible : true,
                delai_livraison_jours ? parseInt(delai_livraison_jours) : null,
                quantite_minimale ? parseFloat(quantite_minimale) : null,
                id,
                fournisseur_id
            ]
        );

        res.json({ message: 'Produit mis à jour avec succès' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Supprimer un produit fournisseur
router.delete('/fournisseur/:fournisseur_id/:id', validateFournisseurId, validateId, async (req, res) => {
    try {
        const { fournisseur_id, id } = req.params;

        // Vérifier que le produit appartient au fournisseur
        const [produits] = await pool.execute(
            'SELECT id FROM produits WHERE id = ? AND fournisseur_id = ?',
            [id, fournisseur_id]
        );

        if (produits.length === 0) {
            return res.status(404).json({ error: 'Produit non trouvé pour ce fournisseur' });
        }

        await pool.execute('DELETE FROM produits WHERE id = ? AND fournisseur_id = ?', [id, fournisseur_id]);

        res.json({ message: 'Produit supprimé avec succès' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

