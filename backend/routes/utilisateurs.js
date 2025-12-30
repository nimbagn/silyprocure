const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const { authenticate, requireRole } = require('../middleware/auth');
const { validateId } = require('../middleware/validation');
const router = express.Router();

// Tous les routes nécessitent une authentification
router.use(authenticate);

// Liste des utilisateurs
router.get('/', requireRole('admin'), async (req, res) => {
    try {
        const [users] = await pool.execute(
            'SELECT id, email, nom, prenom, telephone, fonction, departement, role, actif, date_creation FROM utilisateurs ORDER BY nom, prenom'
        );
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Détails d'un utilisateur
router.get('/:id', validateId, async (req, res) => {
    try {
        const { id } = req.params;
        const [users] = await pool.execute(
            'SELECT id, email, nom, prenom, telephone, fonction, departement, role, actif, date_creation, derniere_connexion FROM utilisateurs WHERE id = ?',
            [id]
        );
        if (users.length === 0) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }
        res.json(users[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Créer un utilisateur
router.post('/', requireRole('admin'), async (req, res) => {
    try {
        const { email, mot_de_passe, nom, prenom, telephone, fonction, departement, role } = req.body;
        
        // Vérifier si l'email existe déjà
        const [existing] = await pool.execute('SELECT id FROM utilisateurs WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Cet email est déjà utilisé' });
        }

        // Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(mot_de_passe, 10);

        const [result] = await pool.execute(
            'INSERT INTO utilisateurs (email, mot_de_passe, nom, prenom, telephone, fonction, departement, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [email, hashedPassword, nom, prenom, telephone || null, fonction || null, departement || null, role || 'viewer']
        );

        res.status(201).json({ id: result.insertId, message: 'Utilisateur créé avec succès' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Mettre à jour un utilisateur
router.put('/:id', validateId, async (req, res) => {
    try {
        const { id } = req.params;
        const { nom, prenom, telephone, fonction, departement, role, actif } = req.body;

        // Vérifier les permissions
        if (req.user.role !== 'admin' && req.user.id !== parseInt(id)) {
            return res.status(403).json({ error: 'Accès refusé' });
        }

        const updates = [];
        const values = [];

        if (nom) { updates.push('nom = ?'); values.push(nom); }
        if (prenom) { updates.push('prenom = ?'); values.push(prenom); }
        if (telephone !== undefined) { updates.push('telephone = ?'); values.push(telephone); }
        if (fonction) { updates.push('fonction = ?'); values.push(fonction); }
        if (departement) { updates.push('departement = ?'); values.push(departement); }
        if (role && req.user.role === 'admin') { updates.push('role = ?'); values.push(role); }
        if (actif !== undefined && req.user.role === 'admin') { updates.push('actif = ?'); values.push(actif); }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'Aucune donnée à mettre à jour' });
        }

        values.push(id);
        await pool.execute(
            `UPDATE utilisateurs SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        res.json({ message: 'Utilisateur mis à jour avec succès' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

