const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate, requireRole } = require('../middleware/auth');
const { validateId } = require('../middleware/validation');
const { getHistoriqueClient } = require('../utils/historiqueClient');

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// Lister tous les clients avec statistiques
router.get('/', requireRole('admin', 'superviseur'), async (req, res) => {
    try {
        const { search, statut, page = 1, limit = 50 } = req.query;
        
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.max(1, Math.min(1000, parseInt(limit) || 50));
        const offset = (pageNum - 1) * limitNum;

        let query = `
            SELECT c.*,
                   COUNT(DISTINCT d.id) as total_demandes,
                   MAX(d.date_creation) as derniere_demande_date
            FROM clients c
            LEFT JOIN demandes_devis d ON c.id = d.client_id
            WHERE 1=1
        `;
        const params = [];

        if (search) {
            query += ' AND (c.nom LIKE ? OR c.email LIKE ? OR c.entreprise LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        if (statut) {
            query += ' AND c.statut = ?';
            params.push(statut);
        }

        query += ' GROUP BY c.id';
        query += ` ORDER BY c.date_derniere_demande DESC, c.nom ASC LIMIT ${limitNum} OFFSET ${offset}`;

        const [clients] = await pool.execute(query, params);

        // Compter le total
        let countQuery = 'SELECT COUNT(DISTINCT c.id) as total FROM clients c WHERE 1=1';
        const countParams = [];
        if (search) {
            countQuery += ' AND (c.nom LIKE ? OR c.email LIKE ? OR c.entreprise LIKE ?)';
            const searchTerm = `%${search}%`;
            countParams.push(searchTerm, searchTerm, searchTerm);
        }
        if (statut) {
            countQuery += ' AND c.statut = ?';
            countParams.push(statut);
        }
        const [countResult] = await pool.execute(countQuery, countParams);
        const total = countResult[0].total;

        res.json({
            clients,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        console.error('Erreur récupération clients:', error);
        res.status(500).json({ error: error.message });
    }
});

// Récupérer un client spécifique avec toutes ses demandes
router.get('/:id', requireRole('admin', 'superviseur'), validateId, async (req, res) => {
    try {
        const { id } = req.params;

        const [clients] = await pool.execute(
            'SELECT * FROM clients WHERE id = ?',
            [id]
        );

        if (clients.length === 0) {
            return res.status(404).json({ error: 'Client non trouvé' });
        }

        const client = clients[0];

        // Récupérer toutes les demandes de ce client
        const [demandes] = await pool.execute(
            `SELECT d.*, 
                    u.nom as traite_par_nom, 
                    u.prenom as traite_par_prenom
             FROM demandes_devis d
             LEFT JOIN utilisateurs u ON d.traite_par = u.id
             WHERE d.client_id = ?
             ORDER BY d.date_creation DESC`,
            [id]
        );

        client.demandes = demandes;

        // Récupérer l'historique complet des interactions
        const historique = await getHistoriqueClient(id);
        client.historique = historique;

        res.json(client);
    } catch (error) {
        console.error('Erreur récupération client:', error);
        res.status(500).json({ error: error.message });
    }
});

// Mettre à jour un client
router.patch('/:id', requireRole('admin', 'superviseur'), validateId, async (req, res) => {
    try {
        const { id } = req.params;
        const { nom, email, telephone, entreprise, adresse, ville, pays, secteur_activite, site_web, notes, statut } = req.body;

        const updates = [];
        const params = [];

        if (nom !== undefined) {
            updates.push('nom = ?');
            params.push(nom);
        }
        if (email !== undefined) {
            updates.push('email = ?');
            params.push(email);
        }
        if (telephone !== undefined) {
            updates.push('telephone = ?');
            params.push(telephone);
        }
        if (entreprise !== undefined) {
            updates.push('entreprise = ?');
            params.push(entreprise);
        }
        if (adresse !== undefined) {
            updates.push('adresse = ?');
            params.push(adresse);
        }
        if (ville !== undefined) {
            updates.push('ville = ?');
            params.push(ville);
        }
        if (pays !== undefined) {
            updates.push('pays = ?');
            params.push(pays);
        }
        if (secteur_activite !== undefined) {
            updates.push('secteur_activite = ?');
            params.push(secteur_activite);
        }
        if (site_web !== undefined) {
            updates.push('site_web = ?');
            params.push(site_web);
        }
        if (notes !== undefined) {
            updates.push('notes = ?');
            params.push(notes);
        }
        if (statut !== undefined) {
            updates.push('statut = ?');
            params.push(statut);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'Aucune donnée à mettre à jour' });
        }

        updates.push('date_modification = NOW()');
        params.push(id);

        await pool.execute(
            `UPDATE clients SET ${updates.join(', ')} WHERE id = ?`,
            params
        );

        res.json({ message: 'Client mis à jour avec succès' });
    } catch (error) {
        console.error('Erreur mise à jour client:', error);
        res.status(500).json({ error: error.message });
    }
});

// Récupérer l'historique d'un client
router.get('/:id/historique', requireRole('admin', 'superviseur'), validateId, async (req, res) => {
    try {
        const { id } = req.params;
        const { limit = 100 } = req.query;

        const historique = await getHistoriqueClient(id, parseInt(limit));
        res.json(historique);
    } catch (error) {
        console.error('Erreur récupération historique:', error);
        res.status(500).json({ error: error.message });
    }
});

// Statistiques des clients
router.get('/stats/overview', requireRole('admin', 'superviseur'), async (req, res) => {
    try {
        const [stats] = await pool.execute(`
            SELECT 
                COUNT(*) as total_clients,
                COUNT(CASE WHEN statut = 'actif' THEN 1 END) as clients_actifs,
                COUNT(CASE WHEN statut = 'prospect' THEN 1 END) as prospects,
                COUNT(CASE WHEN statut = 'inactif' THEN 1 END) as clients_inactifs,
                COUNT(CASE WHEN date_derniere_demande >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY) THEN 1 END) as clients_actifs_30j,
                COUNT(CASE WHEN date_derniere_demande >= DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY) THEN 1 END) as clients_actifs_90j,
                SUM(nombre_demandes) as total_demandes
            FROM clients
        `);

        res.json(stats[0]);
    } catch (error) {
        console.error('Erreur statistiques clients:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

