const express = require('express');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { validateId } = require('../middleware/validation');
const router = express.Router();

router.use(authenticate);

// Récupérer toutes les notifications de l'utilisateur connecté
router.get('/', async (req, res) => {
    try {
        const { lu, limit = 50 } = req.query;
        const userId = req.user.id;

        let query = `
            SELECT n.*, 
                   u.nom as utilisateur_nom, u.prenom as utilisateur_prenom
            FROM notifications n
            LEFT JOIN utilisateurs u ON n.utilisateur_id = u.id
            WHERE n.utilisateur_id = $1
        `;
        const params = [userId];
        let paramIndex = 2;

        if (lu !== undefined) {
            query += ` AND n.lu = $${paramIndex}`;
            params.push(lu === 'true' ? 1 : 0);
            paramIndex++;
        }

        // LIMIT doit être interpolé directement, pas via paramètre préparé
        const limitNum = parseInt(limit) || 50;
        query += ` ORDER BY n.date_creation DESC LIMIT ${limitNum}`;

        const [notifications] = await pool.execute(query, params);
        res.json(notifications);
    } catch (error) {
        console.error('Erreur récupération notifications:', error);
        res.status(500).json({ error: error.message });
    }
});

// Compter les notifications non lues
router.get('/unread-count', async (req, res) => {
    try {
        const userId = req.user.id;
        const [result] = await pool.execute(
            'SELECT COUNT(*) as count FROM notifications WHERE utilisateur_id = $1 AND lu = FALSE',
            [userId]
        );
        res.json({ count: result[0].count || 0 });
    } catch (error) {
        console.error('Erreur comptage notifications:', error);
        res.status(500).json({ error: error.message });
    }
});

// Marquer une notification comme lue
router.patch('/:id/read', validateId, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Vérifier que la notification appartient à l'utilisateur
        const [notifications] = await pool.execute(
            'SELECT id FROM notifications WHERE id = $1 AND utilisateur_id = $2',
            [id, userId]
        );

        if (notifications.length === 0) {
            return res.status(404).json({ error: 'Notification non trouvée' });
        }

        await pool.execute(
            'UPDATE notifications SET lu = TRUE WHERE id = $1',
            [id]
        );

        res.json({ message: 'Notification marquée comme lue' });
    } catch (error) {
        console.error('Erreur marquage notification:', error);
        res.status(500).json({ error: error.message });
    }
});

// Marquer toutes les notifications comme lues
router.patch('/read-all', async (req, res) => {
    try {
        const userId = req.user.id;

        await pool.execute(
            'UPDATE notifications SET lu = TRUE WHERE utilisateur_id = $1 AND lu = FALSE',
            [userId]
        );

        res.json({ message: 'Toutes les notifications ont été marquées comme lues' });
    } catch (error) {
        console.error('Erreur marquage toutes notifications:', error);
        res.status(500).json({ error: error.message });
    }
});

// Supprimer une notification
router.delete('/:id', validateId, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Vérifier que la notification appartient à l'utilisateur
        const [notifications] = await pool.execute(
            'SELECT id FROM notifications WHERE id = $1 AND utilisateur_id = $2',
            [id, userId]
        );

        if (notifications.length === 0) {
            return res.status(404).json({ error: 'Notification non trouvée' });
        }

        await pool.execute('DELETE FROM notifications WHERE id = $1', [id]);

        res.json({ message: 'Notification supprimée' });
    } catch (error) {
        console.error('Erreur suppression notification:', error);
        res.status(500).json({ error: error.message });
    }
});

// Créer une notification (utilisé par d'autres routes)
async function createNotification(userId, typeNotification, titre, message, typeDocument = null, documentId = null) {
    try {
        await pool.execute(
            'INSERT INTO notifications (utilisateur_id, type_notification, titre, message, type_document, document_id) VALUES ($1, $2, $3, $4, $5, $6)',
            [userId, typeNotification, titre, message, typeDocument, documentId]
        );
    } catch (error) {
        console.error('Erreur création notification:', error);
        throw error;
    }
}

// Notifier tous les admins et superviseurs
async function notifyAdminsAndSupervisors(typeNotification, titre, message, typeDocument = null, documentId = null) {
    try {
        // Récupérer tous les utilisateurs avec rôle admin ou superviseur (syntaxe PostgreSQL)
        const [users] = await pool.execute(
            'SELECT id FROM utilisateurs WHERE role IN ($1, $2) AND actif = TRUE',
            ['admin', 'superviseur']
        );
        
        // Créer une notification pour chaque admin/superviseur
        for (const user of users) {
            await createNotification(user.id, typeNotification, titre, message, typeDocument, documentId);
        }
        
        console.log(`✅ Notifications créées pour ${users.length} admin(s)/superviseur(s)`);
        return users.length;
    } catch (error) {
        console.error('❌ Erreur notification admins/superviseurs:', error);
        throw error;
    }
}

// Exporter les fonctions pour utilisation dans d'autres routes
module.exports = { router, createNotification, notifyAdminsAndSupervisors };

