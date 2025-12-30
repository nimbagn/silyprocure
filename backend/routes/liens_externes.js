const express = require('express');
const crypto = require('crypto');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { validateId } = require('../middleware/validation');
const router = express.Router();

// Vérifier que l'utilisateur est admin ou superviseur
function requireSupervisor(req, res, next) {
    const user = req.user;
    if (user.role === 'admin' || user.role === 'superviseur') {
        return next();
    }
    return res.status(403).json({ error: 'Accès réservé aux administrateurs et superviseurs' });
}

// ============================================
// ROUTES PUBLIQUES (sans authentification)
// ============================================

// Récupérer les informations d'une RFQ via un token (pour le formulaire public)
router.get('/rfq-by-token/:token', async (req, res) => {
    try {
        const { token } = req.params;

        // Récupérer le lien externe
        const [liens] = await pool.execute(
            `SELECT l.*, r.*, e.nom as fournisseur_nom, e.email as fournisseur_email
             FROM liens_externes l
             JOIN rfq r ON l.rfq_id = r.id
             JOIN entreprises e ON l.fournisseur_id = e.id
             WHERE l.token = ? AND l.utilise = FALSE`,
            [token]
        );

        if (liens.length === 0) {
            return res.status(404).json({ error: 'Lien invalide ou déjà utilisé' });
        }

        const lien = liens[0];

        // Vérifier l'expiration
        if (lien.date_expiration && new Date(lien.date_expiration) < new Date()) {
            return res.status(410).json({ error: 'Ce lien a expiré' });
        }

        // Récupérer les lignes de la RFQ
        const [lignes] = await pool.execute(
            'SELECT * FROM rfq_lignes WHERE rfq_id = ? ORDER BY ordre',
            [lien.rfq_id]
        );

        // Récupérer les informations de l'émetteur (utilisateur)
        const [emetteurs] = await pool.execute(
            `SELECT u.* FROM utilisateurs u
             JOIN rfq r ON u.id = r.emetteur_id
             WHERE r.id = ?`,
            [lien.rfq_id]
        );

        res.json({
            rfq: {
                id: lien.rfq_id,
                numero: lien.numero,
                date_emission: lien.date_emission,
                date_limite_reponse: lien.date_limite_reponse,
                description: lien.description,
                emetteur: emetteurs[0] || null,
                lignes: lignes
            },
            fournisseur: {
                id: lien.fournisseur_id,
                nom: lien.fournisseur_nom,
                email: lien.fournisseur_email
            },
            token: token
        });
    } catch (error) {
        console.error('Erreur récupération RFQ par token:', error);
        res.status(500).json({ error: error.message });
    }
});

// Soumettre un devis depuis le formulaire externe
router.post('/submit-devis-externe', async (req, res) => {
    try {
        const { token, devis_data } = req.body;

        // Vérifier le token
        const [liens] = await pool.execute(
            'SELECT * FROM liens_externes WHERE token = ? AND utilise = FALSE',
            [token]
        );

        if (liens.length === 0) {
            return res.status(404).json({ error: 'Lien invalide ou déjà utilisé' });
        }

        const lien = liens[0];

        // Vérifier l'expiration
        if (lien.date_expiration && new Date(lien.date_expiration) < new Date()) {
            return res.status(410).json({ error: 'Ce lien a expiré' });
        }

        // Créer le devis (similaire à la route normale mais sans authentification)
        const {
            numero, date_emission, date_validite, delai_livraison,
            remise_globale, conditions_paiement, garanties, certifications,
            notes, lignes
        } = devis_data;

        // Fonction pour générer un numéro de devis unique
        async function generateUniqueDevisNumber(baseNumero) {
            let finalNumero = baseNumero || `DEV-${Date.now()}`;
            let counter = 1;
            
            // Vérifier si le numéro existe déjà
            while (true) {
                const [existing] = await pool.execute(
                    'SELECT id FROM devis WHERE numero = ?',
                    [finalNumero]
                );
                
                if (existing.length === 0) {
                    return finalNumero; // Numéro unique trouvé
                }
                
                // Si le numéro existe, ajouter un suffixe
                finalNumero = `${baseNumero || `DEV-${Date.now()}`}-${counter}`;
                counter++;
                
                // Sécurité : éviter une boucle infinie
                if (counter > 1000) {
                    finalNumero = `DEV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                    break;
                }
            }
            
            return finalNumero;
        }

        // Générer un numéro unique si nécessaire
        const finalNumero = await generateUniqueDevisNumber(numero);

        // Calculer les totaux
        let total_ht = 0;
        let total_tva = 0;
        let total_ttc = 0;

        if (lignes && lignes.length > 0) {
            for (const ligne of lignes) {
                const prix_ht = ligne.prix_unitaire_ht * ligne.quantite;
                const remise = prix_ht * (ligne.remise || 0) / 100;
                const ligne_ht = prix_ht - remise;
                const ligne_tva = ligne_ht * (ligne.tva_taux || 20) / 100;
                total_ht += ligne_ht;
                total_tva += ligne_tva;
            }
            total_ht = total_ht * (1 - (remise_globale || 0) / 100);
            total_tva = total_tva * (1 - (remise_globale || 0) / 100);
            total_ttc = total_ht + total_tva;
        }

        // Insérer le devis (convertir undefined en null)
        const devisParams = [
            finalNumero,
            lien.rfq_id,
            lien.fournisseur_id,
            date_emission || null,
            date_validite || null,
            delai_livraison || null,
            remise_globale || 0,
            total_ht || 0,
            total_tva || 0,
            total_ttc || 0,
            conditions_paiement || null,
            garanties || null,
            certifications || null,
            notes || null
        ];

        const [result] = await pool.execute(
            `INSERT INTO devis (numero, rfq_id, fournisseur_id, date_emission, date_validite, 
              delai_livraison, remise_globale, total_ht, total_tva, total_ttc, 
              conditions_paiement, garanties, certifications, notes, statut)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'envoye')`,
            devisParams
        );

        const devis_id = result.insertId;

        // Insérer les lignes (convertir undefined en null)
        if (lignes && lignes.length > 0) {
            for (const ligne of lignes) {
                const prix_ht = ligne.prix_unitaire_ht * ligne.quantite;
                const remise = prix_ht * (ligne.remise || 0) / 100;
                const total_ht_ligne = prix_ht - remise;

                await pool.execute(
                    'INSERT INTO devis_lignes (devis_id, rfq_ligne_id, produit_id, reference, description, quantite, unite, prix_unitaire_ht, remise, total_ht, tva_taux, ordre) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [
                        devis_id,
                        ligne.rfq_ligne_id || null,
                        ligne.produit_id || null,
                        ligne.reference || null,
                        ligne.description || null,
                        ligne.quantite || null,
                        ligne.unite || 'unité',
                        ligne.prix_unitaire_ht || null,
                        ligne.remise || 0,
                        total_ht_ligne || 0,
                        ligne.tva_taux || 20,
                        ligne.ordre || 0
                    ]
                );
            }
        }

        // Mettre à jour le statut de la RFQ
        await pool.execute('UPDATE rfq SET statut = ? WHERE id = ?', ['en_cours', lien.rfq_id]);

        // Marquer le lien comme utilisé
        await pool.execute(
            'UPDATE liens_externes SET utilise = TRUE, date_utilisation = NOW(), ip_utilisation = ? WHERE id = ?',
            [req.ip || req.connection.remoteAddress, lien.id]
        );

        res.status(201).json({
            id: devis_id,
            message: 'Devis soumis avec succès'
        });
    } catch (error) {
        console.error('Erreur soumission devis externe:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// ROUTES PROTÉGÉES (nécessitent authentification)
// ============================================

// Middleware d'authentification pour les routes admin/superviseur
router.use(authenticate);

// Générer un lien de remplissage externe pour une RFQ
router.post('/rfq/:rfq_id/generate-link', requireSupervisor, async (req, res) => {
    try {
        const { rfq_id } = req.params;
        
        // Valider que rfq_id est un nombre valide
        const rfqIdNum = parseInt(rfq_id);
        if (isNaN(rfqIdNum) || rfqIdNum < 1) {
            return res.status(400).json({ error: 'ID RFQ invalide' });
        }
        
        const { fournisseur_id, email_envoye, date_expiration_jours } = req.body;

        // Vérifier que la RFQ existe
        const [rfqs] = await pool.execute('SELECT * FROM rfq WHERE id = ?', [rfq_id]);
        if (rfqs.length === 0) {
            return res.status(404).json({ error: 'RFQ non trouvée' });
        }

        // Vérifier que le fournisseur existe et est externe
        const [fournisseurs] = await pool.execute(
            'SELECT * FROM entreprises WHERE id = ? AND type_entreprise = "fournisseur"',
            [fournisseur_id]
        );
        if (fournisseurs.length === 0) {
            return res.status(404).json({ error: 'Fournisseur non trouvé' });
        }

        // Générer un token unique
        const token = crypto.randomBytes(32).toString('hex');

        // Calculer la date d'expiration (par défaut 30 jours)
        const expirationDays = date_expiration_jours || 30;
        const dateExpiration = new Date();
        dateExpiration.setDate(dateExpiration.getDate() + expirationDays);

        // Créer le lien externe
        const [result] = await pool.execute(
            `INSERT INTO liens_externes (rfq_id, token, fournisseur_id, email_envoye, date_expiration)
             VALUES (?, ?, ?, ?, ?)`,
            [rfq_id, token, fournisseur_id, email_envoye || null, dateExpiration]
        );

        // Générer l'URL complète
        const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
        const linkUrl = `${baseUrl}/devis-externe.html?token=${token}`;

        res.status(201).json({
            id: result.insertId,
            token: token,
            link: linkUrl,
            expiration: dateExpiration,
            message: 'Lien de remplissage généré avec succès'
        });
    } catch (error) {
        console.error('Erreur génération lien externe:', error);
        res.status(500).json({ error: error.message });
    }
});

// Lister les liens externes pour une RFQ (admin/superviseur)
router.get('/rfq/:rfq_id/links', requireSupervisor, async (req, res) => {
    try {
        const { rfq_id } = req.params;
        
        // Valider que rfq_id est un nombre valide
        const rfqIdNum = parseInt(rfq_id);
        if (isNaN(rfqIdNum) || rfqIdNum < 1) {
            return res.status(400).json({ error: 'ID RFQ invalide' });
        }

        const [liens] = await pool.execute(
            `SELECT l.*, e.nom as fournisseur_nom, e.email as fournisseur_email
             FROM liens_externes l
             JOIN entreprises e ON l.fournisseur_id = e.id
             WHERE l.rfq_id = ?
             ORDER BY l.date_creation DESC`,
            [rfq_id]
        );

        res.json(liens);
    } catch (error) {
        console.error('Erreur liste liens externes:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

