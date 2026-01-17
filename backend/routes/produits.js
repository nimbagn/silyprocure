const express = require('express');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { validateProduit, validateId, validatePagination } = require('../middleware/validation');
const router = express.Router();

router.use(authenticate);

// Liste des produits avec pagination
router.get('/', validatePagination, async (req, res) => {
    try {
        // #region agent log
        const fs = require('fs');
        const path = require('path');
        const logPath = path.join(__dirname, '../../.cursor/debug.log');
        const debugLog = (location, message, data) => {
            try {
                fs.appendFileSync(logPath, JSON.stringify({ location, message, data, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) + '\n');
            } catch (e) {
                console.log(`[DEBUG] ${location}: ${message}`, data);
            }
        };
        debugLog('produits.js:10', 'Endpoint /api/produits appelé', { query: req.query });
        // #endregion
        
        const { categorie_id, search, page = 1, limit = 20 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;

        let query = `
            SELECT p.*, c.libelle as categorie_libelle, e.nom as fournisseur_nom, e.id as fournisseur_id
            FROM produits p
            LEFT JOIN categories c ON p.categorie_id = c.id
            LEFT JOIN entreprises e ON p.fournisseur_id = e.id
            WHERE 1=1
        `;
        let countQuery = 'SELECT COUNT(*) as total FROM produits p WHERE 1=1';
        const params = [];
        const countParams = [];

        if (categorie_id) {
            query += ' AND p.categorie_id = ?';
            countQuery += ' AND p.categorie_id = ?';
            params.push(categorie_id);
            countParams.push(categorie_id);
        }

        if (search) {
            query += ' AND (p.reference LIKE ? OR p.libelle LIKE ?)';
            countQuery += ' AND (p.reference LIKE ? OR p.libelle LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm);
            countParams.push(searchTerm, searchTerm);
        }

        // LIMIT et OFFSET : MySQL ne supporte pas les placeholders pour LIMIT/OFFSET
        // Utiliser des valeurs directes sécurisées (déjà parsées en entiers)
        const safeLimit = Math.max(1, Math.min(parseInt(limitNum) || 20, 100)); // Entre 1 et 100
        const safeOffset = Math.max(0, parseInt(offset) || 0); // Minimum 0
        query += ` ORDER BY p.libelle LIMIT ${safeLimit} OFFSET ${safeOffset}`;
        // Ne pas ajouter limitNum et offset aux params car ils sont maintenant dans la requête directement
        
        // #region agent log
        debugLog('produits.js:45', 'Requête SQL construite', { 
            query: query.replace(/\s+/g, ' ').trim(), 
            paramsCount: params.length, 
            params: params,
            limitNum,
            offset,
            questionMarksCount: (query.match(/\?/g) || []).length
        });
        // #endregion

        const [produitsRows] = await pool.execute(query, params);
        const produits = produitsRows;
        
        // #region agent log
        debugLog('produits.js:50', 'Requête produits exécutée', { produitsCount: produits?.length || 0 });
        // #endregion
        
        const [countRows] = await pool.execute(countQuery, countParams);
        const countResult = countRows;
        const total = countResult[0]?.total || 0;
        
        // #region agent log
        debugLog('produits.js:55', 'Requête count exécutée', { total });
        // #endregion

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
        // #region agent log
        const fs = require('fs');
        const path = require('path');
        const logPath = path.join(__dirname, '../../.cursor/debug.log');
        try {
            fs.appendFileSync(logPath, JSON.stringify({ 
                location: 'produits.js:65', 
                message: 'Erreur dans endpoint /produits', 
                data: { errorMessage: error.message, errorStack: error.stack?.substring(0, 500) }, 
                timestamp: Date.now(), 
                sessionId: 'debug-session', 
                runId: 'run1', 
                hypothesisId: 'A' 
            }) + '\n');
        } catch (e) {
            console.error('Erreur /api/produits:', error);
        }
        // #endregion
        console.error('❌ Erreur /api/produits:', error);
        res.status(500).json({ error: error.message });
    }
});

// Liste des catégories (DOIT être AVANT la route /:id pour éviter les conflits)
router.get('/categories', async (req, res) => {
    try {
        const [categories] = await pool.execute(
            'SELECT * FROM categories WHERE actif = ? ORDER BY libelle',
            [true]
        );
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Créer un produit
router.post('/', validateProduit, async (req, res) => {
    try {
        const { reference, libelle, categorie_id, prix_unitaire_ht, unite, stock_disponible, tva_taux, description, caracteristiques_techniques, fournisseur_id } = req.body;

        // Validation déjà effectuée par le middleware
        const prix = parseFloat(prix_unitaire_ht);

        // Gérer stock_disponible : NULL si non fourni, sinon la valeur
        const stockValue = (stock_disponible !== undefined && stock_disponible !== null && stock_disponible !== '') 
            ? parseInt(stock_disponible) 
            : null;

        const [result] = await pool.execute(
            'INSERT INTO produits (reference, libelle, categorie_id, prix_unitaire_ht, unite, stock_disponible, tva_taux, description, caracteristiques_techniques, fournisseur_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                reference, 
                libelle, 
                parseInt(categorie_id), 
                prix, 
                unite || 'unité', 
                stockValue, 
                parseFloat(tva_taux) || 20, 
                description || null, 
                caracteristiques_techniques || null,
                fournisseur_id || null
            ]
        );

        console.log('Produit créé avec ID:', result.insertId);
        res.status(201).json({ id: result.insertId, message: 'Produit créé avec succès' });
    } catch (error) {
        console.error('Erreur création produit:', error);
        res.status(500).json({ error: error.message });
    }
});

// Détails d'un produit
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [produitsRows] = await pool.execute(
            `SELECT p.*, c.libelle as categorie_libelle, e.nom as fournisseur_nom, e.id as fournisseur_id
             FROM produits p
             LEFT JOIN categories c ON p.categorie_id = c.id
             LEFT JOIN entreprises e ON p.fournisseur_id = e.id
             WHERE p.id = ?`,
            [id]
        );
        const produits = produitsRows;

        if (produits.length === 0) {
            return res.status(404).json({ error: 'Produit non trouvé' });
        }

        res.json(produits[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Mettre à jour un produit
router.put('/:id', validateId, validateProduit, async (req, res) => {
    try {
        const { id } = req.params;
        const { reference, libelle, categorie_id, prix_unitaire_ht, unite, stock_disponible, tva_taux, description, caracteristiques_techniques, fournisseur_id } = req.body;

        // Gérer stock_disponible : NULL si non fourni, sinon la valeur
        const stockValue = (stock_disponible !== undefined && stock_disponible !== null && stock_disponible !== '') 
            ? parseInt(stock_disponible) 
            : null;

        await pool.execute(
            `UPDATE produits SET 
                reference = ?, libelle = ?, categorie_id = ?, prix_unitaire_ht = ?, unite = ?, 
                stock_disponible = ?, tva_taux = ?, description = ?, caracteristiques_techniques = ?, fournisseur_id = ?
             WHERE id = ?`,
            [reference, libelle, categorie_id, prix_unitaire_ht, unite || 'unité', stockValue, parseFloat(tva_taux) || 20, description || null, caracteristiques_techniques || null, fournisseur_id || null, id]
        );

        res.json({ message: 'Produit mis à jour avec succès' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Supprimer un produit
router.delete('/:id', validateId, async (req, res) => {
    try {
        const { id } = req.params;
        await pool.execute('DELETE FROM produits WHERE id = ?', [id]);
        res.json({ message: 'Produit supprimé avec succès' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

