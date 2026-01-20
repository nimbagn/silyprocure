const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const pool = require('../config/database');
const { authenticate, requireRole } = require('../middleware/auth');
const { validateEntreprise, validateId } = require('../middleware/validation');
const messageProService = require('../services/messagepro');
const { notifyInscriptionEntreprise } = require('../utils/whatsappNotifications');
const router = express.Router();

router.use(authenticate);

// =====================================================
// Upload logo entreprise (admin/superviseur)
// Stockage: /uploads/entreprises/:id/logo.(png|jpg|webp)
// =====================================================
const ALLOWED_MIME = new Map([
  ['image/png', '.png'],
  ['image/jpeg', '.jpg'],
  ['image/webp', '.webp'],
]);

const uploadEntrepriseLogo = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const { id } = req.params;
      const dir = path.join(__dirname, '../../uploads/entreprises', String(id));
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const ext = ALLOWED_MIME.get(file.mimetype) || path.extname(file.originalname).toLowerCase() || '.png';
      cb(null, `logo${ext}`);
    },
  }),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      return cb(new Error('Format non supporté. Utilisez PNG, JPG ou WEBP.'));
    }
    cb(null, true);
  },
});

router.post(
  '/:id/logo',
  requireRole('admin', 'superviseur'),
  validateId,
  uploadEntrepriseLogo.single('logo'),
  async (req, res) => {
    try {
      const { id } = req.params;
      if (!req.file) {
        return res.status(400).json({ error: 'Fichier logo manquant (champ "logo")' });
      }

      // URL publique (express.static sur /uploads)
      const logoUrl = `/uploads/entreprises/${id}/${req.file.filename}`;

      await pool.execute('UPDATE entreprises SET logo_url = ? WHERE id = ?', [logoUrl, id]);
      res.json({ message: 'Logo mis à jour', logo_url: logoUrl });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.delete(
  '/:id/logo',
  requireRole('admin', 'superviseur'),
  validateId,
  async (req, res) => {
    try {
      const { id } = req.params;

      const [rows] = await pool.execute('SELECT logo_url FROM entreprises WHERE id = ?', [id]);
      const current = rows && rows[0] ? rows[0].logo_url : null;

      await pool.execute('UPDATE entreprises SET logo_url = ? WHERE id = ?', [null, id]);

      // Nettoyer le fichier si stocké localement
      if (current && typeof current === 'string' && current.startsWith(`/uploads/entreprises/${id}/`)) {
        const rel = current.replace(/^\/uploads\//, '');
        const filePath = path.join(__dirname, '../../uploads', rel);
        try {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        } catch (_) {
          // ignore
        }
      }

      res.json({ message: 'Logo supprimé' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Liste des entreprises
router.get('/', async (req, res) => {
    try {
        const { type, type_entreprise, search, limit, actif } = req.query;
        // Accepter 'type' ou 'type_entreprise' pour compatibilité
        const typeFilter = type || type_entreprise;
        
        let query = 'SELECT * FROM entreprises WHERE 1=1';
        const params = [];

        let paramIndex = 1;
        
        // Filtrer par type d'entreprise
        if (typeFilter) {
            query += ` AND type_entreprise = $${paramIndex}`;
            params.push(typeFilter);
            paramIndex++;
        }
        
        // Filtrer par statut actif (par défaut, ne retourner que les actifs)
        if (actif !== undefined && actif !== '') {
            const actifValue = actif === 'true' || actif === '1' || actif === 1;
            query += ` AND actif = $${paramIndex}`;
            params.push(actifValue);
            paramIndex++;
        } else {
            // Par défaut, ne retourner que les entreprises actives
            query += ` AND actif = $${paramIndex}`;
            params.push(true);
            paramIndex++;
        }

        if (search) {
            const searchTerm = `%${search}%`;
            query += ` AND (nom LIKE $${paramIndex} OR raison_sociale LIKE $${paramIndex + 1} OR rccm LIKE $${paramIndex + 2} OR siret LIKE $${paramIndex + 3})`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
            paramIndex += 4;
        }

        query += ' ORDER BY nom';

        if (limit) {
            const limitNum = parseInt(limit, 10);
            if (!isNaN(limitNum) && limitNum > 0) {
                query += ` LIMIT ${limitNum}`;
            }
        }

        try {
        const [entreprises] = await pool.execute(query, params);
        res.json(entreprises);
        } catch (sqlError) {
            console.error('Erreur SQL lors de la récupération des entreprises:', sqlError.message);
            res.status(500).json({ error: 'Erreur lors de la récupération des entreprises', details: sqlError.message });
        }
    } catch (error) {
        console.error('Erreur GET /api/entreprises:', error);
        res.status(500).json({ error: error.message });
    }
});

// Détails d'une entreprise avec relations
router.get('/:id', validateId, async (req, res) => {
    try {
        const { id } = req.params;

        const [entreprises] = await pool.execute('SELECT * FROM entreprises WHERE id = $1', [id]);
        if (entreprises.length === 0) {
            return res.status(404).json({ error: 'Entreprise non trouvée' });
        }

        const entreprise = entreprises[0];

        // Récupérer les adresses
        const [adresses] = await pool.execute('SELECT * FROM adresses WHERE entreprise_id = $1', [id]);
        entreprise.adresses = adresses;

        // Récupérer les contacts
        const [contacts] = await pool.execute('SELECT * FROM contacts WHERE entreprise_id = $1', [id]);
        entreprise.contacts = contacts;

        // Récupérer les coordonnées bancaires
        const [coordonnees] = await pool.execute('SELECT * FROM coordonnees_bancaires WHERE entreprise_id = $1', [id]);
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
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING id`,
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

        const entrepriseId = result.rows && result.rows[0] ? result.rows[0].id : (result.insertId || result[0]?.id);

        // Récupérer l'entreprise créée pour la notification
        const [entreprises] = await pool.execute('SELECT * FROM entreprises WHERE id = $1', [entrepriseId]);
        const entreprise = entreprises && entreprises.length > 0 ? entreprises[0] : null;

        // Envoyer une notification WhatsApp (en arrière-plan)
        if (entreprise && (type_entreprise === 'fournisseur' || type_entreprise === 'acheteur')) {
            notifyInscriptionEntreprise(entreprise, type_entreprise).catch(err => {
                console.error('Erreur notification WhatsApp inscription entreprise:', err);
            });
        }

        res.status(201).json({ id: entrepriseId, message: 'Entreprise créée avec succès' });
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
            `UPDATE entreprises SET nom = $1, raison_sociale = $2, rccm = $3, numero_contribuable = $4, capital_social = $5, 
             forme_juridique = $6, secteur_activite = $7, siret = $8, tva_intracommunautaire = $9, email = $10, 
             telephone = $11, site_web = $12, actif = $13, notes = $14 WHERE id = $15`,
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
        const [rfqs] = await pool.execute('SELECT COUNT(*) as count FROM rfq WHERE destinataire_id = $1', [id]);
        const [commandes] = await pool.execute('SELECT COUNT(*) as count FROM commandes WHERE fournisseur_id = $1', [id]);
        
        if (rfqs[0].count > 0 || commandes[0].count > 0) {
            return res.status(400).json({ 
                error: 'Impossible de supprimer cette entreprise car elle est utilisée dans des documents' 
            });
        }
        
        // Supprimer les relations
        await pool.execute('DELETE FROM adresses WHERE entreprise_id = $1', [id]);
        await pool.execute('DELETE FROM contacts WHERE entreprise_id = $1', [id]);
        await pool.execute('DELETE FROM coordonnees_bancaires WHERE entreprise_id = $1', [id]);
        
        // Supprimer l'entreprise
        await pool.execute('DELETE FROM entreprises WHERE id = $1', [id]);
        
        res.json({ message: 'Entreprise supprimée avec succès' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Envoie un message WhatsApp de bienvenue à un nouveau fournisseur
 */
async function sendWelcomeWhatsAppToSupplier(nomEntreprise, telephone) {
    try {
        // Assurer que le secret est chargé
        await messageProService.loadSecret();

        if (!messageProService.secret) {
            console.warn('⚠️  MESSAGEPRO_SECRET non configuré. WhatsApp de bienvenue non envoyé.');
            return false;
        }

        // Récupérer le compte WhatsApp à utiliser
        let whatsappAccount = process.env.MESSAGEPRO_WHATSAPP_ACCOUNT;
        
        // Si aucun compte configuré, essayer de récupérer le premier compte disponible
        if (!whatsappAccount) {
            try {
                const accounts = await messageProService.getWhatsAppAccounts(1, 1);
                if (accounts && accounts.length > 0) {
                    whatsappAccount = accounts[0].unique || accounts[0].id;
                    console.log(`📱 Utilisation du compte WhatsApp: ${whatsappAccount}`);
                } else {
                    console.warn('⚠️  Aucun compte WhatsApp disponible pour envoyer le message de bienvenue');
                    return false;
                }
            } catch (error) {
                console.error('❌ Erreur récupération comptes WhatsApp:', error);
                return false;
            }
        }

        // Préparer le message de bienvenue
        const message = `🚢 *SilyProcure*\n\nBonjour ${nomEntreprise},\n\nNous sommes ravis de vous informer que votre entreprise a été répertoriée dans notre base de données de fournisseurs.\n\n📋 *Prochaines étapes:*\nVous recevrez très bientôt des notifications ou des demandes de devis pour des opportunités d'affaires correspondant à votre secteur d'activité.\n\n💼 *SilyProcure* est une plateforme de gestion des achats qui connecte les entreprises avec des fournisseurs de qualité.\n\nNous vous remercions de votre confiance et restons à votre disposition pour toute question.\n\nCordialement,\nL'équipe SilyProcure`;

        // Options pour Message Pro
        const options = {
            type: 'text',
            priority: 1 // Priorité normale
        };

        // Envoyer le WhatsApp via Message Pro
        const result = await messageProService.sendWhatsApp(whatsappAccount, telephone, message, options);
        
        console.log('✅ WhatsApp de bienvenue envoyé au fournisseur:', nomEntreprise, 'via', telephone);
        return true;
    } catch (error) {
        console.error('❌ Erreur envoi WhatsApp de bienvenue:', error);
        return false;
    }
}

module.exports = router;

