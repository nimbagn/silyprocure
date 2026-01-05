const express = require('express');
const multer = require('multer');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const path = require('path');
const fs = require('fs');
const router = express.Router();

router.use(authenticate);

// Créer le dossier uploads/fichiers s'il n'existe pas
const fichiersDir = path.join(__dirname, '../../uploads/fichiers');
if (!fs.existsSync(fichiersDir)) {
    fs.mkdirSync(fichiersDir, { recursive: true });
}

// Configuration Multer pour l'upload de fichiers génériques
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const typeDoc = req.params.type_document || 'general';
        const typeDir = path.join(fichiersDir, typeDoc);
        if (!fs.existsSync(typeDir)) {
            fs.mkdirSync(typeDir, { recursive: true });
        }
        cb(null, typeDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const baseName = path.basename(file.originalname, ext);
        // Nettoyer le nom de fichier
        const cleanName = baseName.replace(/[^a-zA-Z0-9_-]/g, '_');
        cb(null, `${cleanName}-${uniqueSuffix}${ext}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
    fileFilter: (req, file, cb) => {
        // Autoriser tous les types de fichiers courants
        const allowedMimes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel', // .xls
            'application/msword', // .doc
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
            'text/plain', 'text/csv',
            'application/zip', 'application/x-zip-compressed'
        ];
        
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Type de fichier non autorisé: ${file.mimetype}. Types autorisés: images, PDF, Excel, Word, texte, ZIP`));
        }
    }
});

// Upload un fichier pour un document
router.post('/:type_document/:document_id', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Aucun fichier fourni' });
        }

        const { type_document, document_id } = req.params;
        
        // Valider document_id
        const docIdNum = parseInt(document_id);
        if (isNaN(docIdNum) || docIdNum < 1) {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: 'ID document invalide' });
        }
        const { description } = req.body;

        // Valider le type de document
        const validTypes = ['rfq', 'devis', 'commande', 'facture', 'demande_devis'];
        if (!validTypes.includes(type_document)) {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: `Type de document invalide. Types autorisés: ${validTypes.join(', ')}` });
        }

        // Vérifier que le document existe
        const tables = {
            'rfq': 'rfq',
            'devis': 'devis',
            'commande': 'commandes',
            'facture': 'factures',
            'demande_devis': 'demandes_devis'
        };
        const table = tables[type_document];
        
        const [documents] = await pool.execute(`SELECT id FROM ${table} WHERE id = $1`, [document_id]);
        if (documents.length === 0) {
            fs.unlinkSync(req.file.path);
            return res.status(404).json({ error: 'Document non trouvé' });
        }

        // Enregistrer le fichier en base
        const cheminRelatif = path.relative(path.join(__dirname, '../../uploads'), req.file.path);
        
        const [result] = await pool.execute(
            'INSERT INTO documents_joints (type_document, document_id, nom_fichier, chemin_fichier, taille_octets, type_mime, description, upload_par_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [type_document, document_id, req.file.originalname, cheminRelatif, req.file.size, req.file.mimetype, description || null, req.user.id]
        );

        res.status(201).json({
            id: result.insertId,
            nom_fichier: req.file.originalname,
            taille_fichier: req.file.size,
            type_mime: req.file.mimetype,
            message: 'Fichier uploadé avec succès'
        });
    } catch (error) {
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        console.error('Erreur upload fichier:', error);
        res.status(500).json({ error: error.message || 'Erreur lors de l\'upload du fichier' });
    }
});

// Récupérer les fichiers joints d'une demande de devis (route publique)
router.get('/demande_devis/:document_id', async (req, res) => {
    try {
        const { document_id } = req.params;
        const docIdNum = parseInt(document_id);
        
        if (isNaN(docIdNum) || docIdNum < 1) {
            return res.status(400).json({ error: 'ID document invalide' });
        }

        const [fichiers] = await pool.execute(
            `SELECT id, nom_fichier, chemin_fichier, taille_octets as taille_fichier, type_mime, description, date_upload
             FROM documents_joints
             WHERE type_document = 'demande_devis' AND document_id = $1
             ORDER BY date_upload DESC`,
            [document_id]
        );

        res.json(fichiers);
    } catch (error) {
        console.error('Erreur récupération fichiers demande:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des fichiers' });
    }
});

// Récupérer les fichiers joints d'un document
router.get('/:type_document/:document_id', async (req, res) => {
    try {
        const { type_document, document_id } = req.params;
        
        // Valider le type de document
        const validTypes = ['rfq', 'devis', 'commande', 'facture', 'demande_devis'];
        if (!validTypes.includes(type_document)) {
            return res.status(400).json({ error: `Type de document invalide. Types autorisés: ${validTypes.join(', ')}` });
        }
        
        // Valider document_id
        const docIdNum = parseInt(document_id);
        if (isNaN(docIdNum) || docIdNum < 1) {
            return res.status(400).json({ error: 'ID document invalide' });
        }

        const [fichiers] = await pool.execute(
            `SELECT f.*, f.taille_octets as taille_fichier, u.nom as uploader_nom, u.prenom as uploader_prenom
             FROM documents_joints f
             LEFT JOIN utilisateurs u ON f.upload_par_id = u.id
             WHERE f.type_document = $1 AND f.document_id = $2
             ORDER BY f.date_upload DESC`,
            [type_document, document_id]
        );

        res.json(fichiers);
    } catch (error) {
        console.error('Erreur récupération fichiers:', error);
        res.status(500).json({ error: error.message });
    }
});

// Télécharger un fichier
router.get('/download/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Valider id
        const fileIdNum = parseInt(id);
        if (isNaN(fileIdNum) || fileIdNum < 1) {
            return res.status(400).json({ error: 'ID fichier invalide' });
        }

        const [fichiers] = await pool.execute(
            'SELECT *, taille_octets as taille_fichier FROM documents_joints WHERE id = $1',
            [id]
        );

        if (fichiers.length === 0) {
            return res.status(404).json({ error: 'Fichier non trouvé' });
        }

        const fichier = fichiers[0];
        const filePath = path.join(__dirname, '../../uploads', fichier.chemin_fichier);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Fichier introuvable sur le serveur' });
        }

        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fichier.nom_fichier)}"`);
        res.setHeader('Content-Type', fichier.type_mime || 'application/octet-stream');
        res.sendFile(path.resolve(filePath));
    } catch (error) {
        console.error('Erreur téléchargement fichier:', error);
        res.status(500).json({ error: error.message });
    }
});

// Supprimer un fichier
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Valider id
        const fileIdNum = parseInt(id);
        if (isNaN(fileIdNum) || fileIdNum < 1) {
            return res.status(400).json({ error: 'ID fichier invalide' });
        }
        const userId = req.user.id;

        const [fichiers] = await pool.execute(
            'SELECT *, taille_octets as taille_fichier FROM documents_joints WHERE id = $1',
            [id]
        );

        if (fichiers.length === 0) {
            return res.status(404).json({ error: 'Fichier non trouvé' });
        }

        const fichier = fichiers[0];

        // Vérifier que l'utilisateur est l'uploader ou un admin
        const user = req.user;
        if (fichier.upload_par_id !== userId && user.role !== 'admin' && user.role !== 'superviseur') {
            return res.status(403).json({ error: 'Vous n\'avez pas le droit de supprimer ce fichier' });
        }

        // Supprimer le fichier physique
        const filePath = path.join(__dirname, '../../uploads', fichier.chemin_fichier);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Supprimer l'enregistrement en base
        await pool.execute('DELETE FROM documents_joints WHERE id = $1', [id]);

        res.json({ message: 'Fichier supprimé avec succès' });
    } catch (error) {
        console.error('Erreur suppression fichier:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

