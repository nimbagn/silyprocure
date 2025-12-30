const express = require('express');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { validateEntreprise, validateId } = require('../middleware/validation');
const router = express.Router();

router.use(authenticate);

// Liste des entreprises
router.get('/', async (req, res) => {
    try {
        const { type, search } = req.query;
        let query = 'SELECT * FROM entreprises WHERE 1=1';
        const params = [];

        if (type) {
            query += ' AND type_entreprise = ?';
            params.push(type);
        }

        if (search) {
            query += ' AND (nom LIKE ? OR raison_sociale LIKE ? OR rccm LIKE ? OR siret LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        query += ' ORDER BY nom';

        const [entreprises] = await pool.execute(query, params);
        res.json(entreprises);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Détails d'une entreprise avec relations
router.get('/:id', validateId, async (req, res) => {
    try {
        const { id } = req.params;

        const [entreprises] = await pool.execute('SELECT * FROM entreprises WHERE id = ?', [id]);
        if (entreprises.length === 0) {
            return res.status(404).json({ error: 'Entreprise non trouvée' });
        }

        const entreprise = entreprises[0];

        // Récupérer les adresses
        const [adresses] = await pool.execute('SELECT * FROM adresses WHERE entreprise_id = ?', [id]);
        entreprise.adresses = adresses;

        // Récupérer les contacts
        const [contacts] = await pool.execute('SELECT * FROM contacts WHERE entreprise_id = ?', [id]);
        entreprise.contacts = contacts;

        // Récupérer les coordonnées bancaires
        const [coordonnees] = await pool.execute('SELECT * FROM coordonnees_bancaires WHERE entreprise_id = ?', [id]);
        entreprise.coordonnees_bancaires = coordonnees;

        res.json(entreprise);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Créer une entreprise
router.post('/', validateEntreprise, async (req, res) => {
    try {
        const { 
            nom, raison_sociale, rccm, numero_contribuable, capital_social, forme_juridique, secteur_activite,
            siret, tva_intracommunautaire, type_entreprise, email, telephone, site_web, notes 
        } = req.body;

        const [result] = await pool.execute(
            `INSERT INTO entreprises (nom, raison_sociale, rccm, numero_contribuable, capital_social, forme_juridique, secteur_activite,
             siret, tva_intracommunautaire, type_entreprise, email, telephone, site_web, notes) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                nom, 
                raison_sociale || null, 
                rccm || null,
                numero_contribuable || null,
                capital_social || null,
                forme_juridique || null,
                secteur_activite || null,
                siret || null, 
                tva_intracommunautaire || null, 
                type_entreprise, 
                email || null, 
                telephone || null, 
                site_web || null, 
                notes || null
            ]
        );

        res.status(201).json({ id: result.insertId, message: 'Entreprise créée avec succès' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Mettre à jour une entreprise
router.put('/:id', validateId, validateEntreprise, async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            nom, raison_sociale, rccm, numero_contribuable, capital_social, forme_juridique, secteur_activite,
            siret, tva_intracommunautaire, email, telephone, site_web, actif, notes 
        } = req.body;

        await pool.execute(
            `UPDATE entreprises SET nom = ?, raison_sociale = ?, rccm = ?, numero_contribuable = ?, capital_social = ?, 
             forme_juridique = ?, secteur_activite = ?, siret = ?, tva_intracommunautaire = ?, email = ?, 
             telephone = ?, site_web = ?, actif = ?, notes = ? WHERE id = ?`,
            [
                nom, raison_sociale, rccm || null, numero_contribuable || null, capital_social || null,
                forme_juridique || null, secteur_activite || null, siret, tva_intracommunautaire, 
                email, telephone, site_web, actif !== undefined ? actif : 1, notes, id
            ]
        );

        res.json({ message: 'Entreprise mise à jour avec succès' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Supprimer une entreprise
router.delete('/:id', validateId, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Vérifier si l'entreprise est utilisée
        const [rfqs] = await pool.execute('SELECT COUNT(*) as count FROM rfq WHERE destinataire_id = ?', [id]);
        const [commandes] = await pool.execute('SELECT COUNT(*) as count FROM commandes WHERE fournisseur_id = ?', [id]);
        
        if (rfqs[0].count > 0 || commandes[0].count > 0) {
            return res.status(400).json({ 
                error: 'Impossible de supprimer cette entreprise car elle est utilisée dans des documents' 
            });
        }
        
        // Supprimer les relations
        await pool.execute('DELETE FROM adresses WHERE entreprise_id = ?', [id]);
        await pool.execute('DELETE FROM contacts WHERE entreprise_id = ?', [id]);
        await pool.execute('DELETE FROM coordonnees_bancaires WHERE entreprise_id = ?', [id]);
        
        // Supprimer l'entreprise
        await pool.execute('DELETE FROM entreprises WHERE id = ?', [id]);
        
        res.json({ message: 'Entreprise supprimée avec succès' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

