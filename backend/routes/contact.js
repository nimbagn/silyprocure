require('dotenv').config();
const express = require('express');
const multer = require('multer');
const pool = require('../config/database');
const { authenticate, requireRole } = require('../middleware/auth');
const { validateId } = require('../middleware/validation');
const { sendDevisRequestNotification, sendDevisRequestConfirmation } = require('../utils/emailService');
const { generateReference, generateTrackingToken, sendNotification } = require('../utils/notificationService');
const { enregistrerInteraction } = require('../utils/historiqueClient');
const { notifyAdminsAndSupervisors } = require('./notifications');
const { notifyClientDemandeDevis, notifyFournisseurDemandeDevis, notifyAdminsMessageContact } = require('../utils/whatsappNotifications');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Configuration Multer pour l'upload de fichiers pour les demandes de devis
const fichiersDir = path.join(__dirname, '../../uploads/fichiers/demandes_devis');
if (!fs.existsSync(fichiersDir)) {
    fs.mkdirSync(fichiersDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, fichiersDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const baseName = path.basename(file.originalname, ext);
        const cleanName = baseName.replace(/[^a-zA-Z0-9_-]/g, '_');
        cb(null, `${cleanName}-${uniqueSuffix}${ext}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max par fichier
    fileFilter: (req, file, cb) => {
        const allowedMimes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel' // .xls
        ];
        
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Type de fichier non autorisé: ${file.mimetype}. Types autorisés: images (JPG, PNG, GIF, WebP), PDF, Excel (.xlsx, .xls)`));
        }
    }
});

// Route publique pour les demandes de devis depuis la page d'accueil
router.post('/devis-request', upload.array('fichiers', 10), async (req, res) => {
    try {
        // Récupérer les données du formulaire
        const { nom, email, telephone, entreprise, message, articles, adresse_livraison, ville_livraison, pays_livraison, mode_notification, latitude, longitude } = req.body;
        
        // Parser les articles si c'est une chaîne JSON
        let articlesParsed = articles;
        if (typeof articles === 'string') {
            try {
                articlesParsed = JSON.parse(articles);
            } catch (e) {
                return res.status(400).json({ error: 'Format des articles invalide' });
            }
        }

        // Validation basique
        if (!nom || !email) {
            return res.status(400).json({ error: 'Le nom et l\'email sont requis' });
        }

        if (!telephone) {
            return res.status(400).json({ error: 'Le téléphone est requis' });
        }

        // Validation email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Format d\'email invalide' });
        }

        // Validation des articles
        if (!articlesParsed || !Array.isArray(articlesParsed) || articlesParsed.length === 0) {
            return res.status(400).json({ error: 'Veuillez ajouter au moins un article à votre demande' });
        }

        // Validation de l'adresse de livraison
        if (!adresse_livraison || !ville_livraison || !pays_livraison) {
            return res.status(400).json({ error: 'L\'adresse de livraison complète est requise' });
        }

        // Générer la référence et le token de suivi
        const reference = generateReference();
        const trackingToken = generateTrackingToken();

        // Log de la demande (sans télémétrie externe)
        console.log('📥 Nouvelle demande de devis:', { email, nom, articlesCount: articlesParsed?.length, filesCount: req.files?.length, reference });

        // Démarrer une transaction
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Détecter le type de base de données pour utiliser les bonnes colonnes
            const usePostgreSQL = !!(process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql');
            const adresseCol = usePostgreSQL ? 'adresse_livraison' : 'adresse';
            const villeCol = usePostgreSQL ? 'ville_livraison' : 'ville';
            const paysCol = usePostgreSQL ? 'pays_livraison' : 'pays';
            
            console.log('🔍 Détection DB:', {
                DATABASE_URL: !!process.env.DATABASE_URL,
                DB_TYPE: process.env.DB_TYPE,
                usePostgreSQL,
                adresseCol,
                villeCol,
                paysCol
            });
            
            // Créer ou récupérer le client dans la table clients
            let clientId = null;
            
            // Vérifier si le client existe déjà par email
            const [existingClients] = await connection.execute(
                'SELECT id FROM clients WHERE email = $1',
                [email]
            );

            if (existingClients.length > 0) {
                // Client existe déjà, mettre à jour ses informations
                clientId = existingClients[0].id;
                // Utiliser COALESCE pour PostgreSQL au lieu de IFNULL (MySQL)
                await connection.execute(
                    `UPDATE clients 
                     SET nom = $1, 
                         telephone = COALESCE($2, telephone), 
                         entreprise = COALESCE($3, entreprise),
                         ${adresseCol} = COALESCE($4, ${adresseCol}),
                         ${villeCol} = COALESCE($5, ${villeCol}),
                         ${paysCol} = COALESCE($6, ${paysCol}),
                         date_derniere_demande = NOW(),
                         nombre_demandes = nombre_demandes + 1,
                         statut = CASE WHEN statut = 'prospect' THEN 'actif' ELSE statut END,
                         date_modification = NOW()
                     WHERE id = $7`,
                    [nom, telephone || null, entreprise || null, adresse_livraison || null, ville_livraison || null, pays_livraison || null, clientId]
                );
            } else {
                // Créer un nouveau client
                const insertSQL = `INSERT INTO clients (nom, email, telephone, entreprise, ${adresseCol}, ${villeCol}, ${paysCol}, date_derniere_demande, nombre_demandes, statut)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), 1, 'prospect') RETURNING id`;
                console.log('🔍 SQL INSERT clients:', insertSQL);
                console.log('🔍 Colonnes utilisées:', { adresseCol, villeCol, paysCol });
                
                const [clientRows, clientResult] = await connection.execute(
                    insertSQL,
                    [nom, email, telephone, entreprise || null, adresse_livraison, ville_livraison, pays_livraison]
                );
                clientId = clientResult.rows && clientResult.rows[0] ? clientResult.rows[0].id : (clientResult.insertId || clientResult[0]?.id);
            }

            // Enregistrer la demande principale avec référence et token, liée au client
            // NOTE: demandes_devis utilise TOUJOURS adresse_livraison, ville_livraison, pays_livraison
            // (peu importe MySQL ou PostgreSQL)
            const demandeInsertSQL = `INSERT INTO demandes_devis (client_id, nom, email, telephone, entreprise, message, adresse_livraison, ville_livraison, pays_livraison, latitude, longitude, statut, reference, token_suivi, mode_notification)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING id`;
            console.log('🔍 SQL INSERT demandes_devis:', demandeInsertSQL);
            
            const [demandeRows, demandeResult] = await connection.execute(
                demandeInsertSQL,
                [
                    clientId, nom, email, telephone, entreprise || null, message || null, 
                    adresse_livraison, ville_livraison, pays_livraison,
                    latitude && !isNaN(parseFloat(latitude)) ? parseFloat(latitude) : null,
                    longitude && !isNaN(parseFloat(longitude)) ? parseFloat(longitude) : null,
                    'nouvelle', // statut
                    reference, trackingToken, mode_notification || 'email'
                ]
            );

            const demandeId = demandeResult.rows && demandeResult.rows[0] ? demandeResult.rows[0].id : (demandeResult.insertId || demandeResult[0]?.id);

            console.log('✅ Demande créée avec succès:', { demandeId, clientId, reference, articlesCount: articlesParsed.length });

            // Enregistrer les fichiers joints s'il y en a
            if (req.files && req.files.length > 0) {
                console.log(`📎 ${req.files.length} fichier(s) à enregistrer pour la demande ${demandeId}`);
                for (const file of req.files) {
                    try {
                        const cheminRelatif = path.relative(path.join(__dirname, '../../uploads'), file.path);
                        
                        // Valider et limiter la longueur des chaînes pour éviter l'erreur "Malformed packet"
                        const nomFichier = (file.originalname || 'fichier').substring(0, 255);
                        const cheminFichier = cheminRelatif.substring(0, 500);
                        const typeMime = (file.mimetype || 'application/octet-stream').substring(0, 100);
                        const description = 'Fichier joint par le client'.substring(0, 500);
                        const tailleFichier = file.size || 0;
                        
                        // Pour les demandes de devis publiques, utiliser l'ID système (1) ou créer un utilisateur système
                        // Si uploader_id est NOT NULL, on doit fournir une valeur
                        const uploaderId = req.user?.id || 1; // Utiliser l'utilisateur connecté ou l'admin système (ID 1)
                        
                        console.log(`📎 Enregistrement fichier: ${nomFichier} (${tailleFichier} octets) pour demande ${demandeId}`);
                        
                        await connection.execute(
                            `INSERT INTO documents_joints (type_document, document_id, nom_fichier, chemin_fichier, taille_octets, type_mime, description, upload_par_id)
                             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                            ['demande_devis', demandeId, nomFichier, cheminFichier, tailleFichier, typeMime, description, uploaderId]
                        );
                        
                        console.log(`✅ Fichier ${nomFichier} enregistré avec succès`);
                        console.log('📎 Fichier joint enregistré:', { demandeId, nomFichier, tailleFichier, typeMime });
                    } catch (fileError) {
                        console.error('❌ Erreur lors de l\'enregistrement du fichier:', file.originalname, fileError);
                        console.error('❌ Détails erreur:', {
                            code: fileError.code,
                            errno: fileError.errno,
                            sqlMessage: fileError.sqlMessage,
                            sql: fileError.sql
                        });
                        // Continuer avec les autres fichiers même si celui-ci échoue
                    }
                }
            } else {
                console.log('ℹ️  Aucun fichier joint à enregistrer');
            }

            // Enregistrer les lignes d'articles
            for (const article of articlesParsed) {
                await connection.execute(
                    `INSERT INTO demandes_devis_lignes (demande_devis_id, description, secteur, quantite, unite, ordre)
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    [
                        demandeId,
                        article.description,
                        article.secteur || null,
                        article.quantite || 1,
                        article.unite || 'unité',
                        article.ordre || 0
                    ]
                );
            }

            // Commit de la transaction AVANT d'enregistrer l'historique
            await connection.commit();
            console.log('✅ Transaction commitée:', { demandeId, clientId, reference });
            
            // Enregistrer l'interaction dans l'historique du client (après le commit pour éviter les deadlocks)
            // On le fait de manière asynchrone pour ne pas bloquer la réponse
            enregistrerInteraction({
                client_id: clientId,
                type_interaction: 'demande_devis',
                reference_document: reference,
                document_id: demandeId,
                description: `Nouvelle demande de devis créée (${articlesParsed.length} article(s))`,
                utilisateur_id: null, // Action du client
                metadata: {
                    nombre_articles: articlesParsed.length,
                    adresse_livraison: `${adresse_livraison}, ${ville_livraison}, ${pays_livraison}`,
                    mode_notification: mode_notification || 'email'
                }
            }).catch(err => {
                console.error('Erreur enregistrement historique (non bloquant):', err);
            });

            // Récupérer la demande créée avec ses lignes
            // Utiliser GROUP_CONCAT pour MySQL, STRING_AGG pour PostgreSQL
            console.log('🔍🔍🔍 DÉBUT RÉCUPÉRATION DEMANDE - usePostgreSQL:', usePostgreSQL, 'demandeId:', demandeId);
            
            let articlesQuery;
            let queryParams;
            
            if (usePostgreSQL) {
                console.log('🔍🔍🔍 UTILISATION POSTGRESQL - STRING_AGG');
                articlesQuery = `SELECT d.*, 
                        STRING_AGG(
                            l.description || ' (' || l.quantite || ' ' || l.unite || ' - ' || COALESCE(l.secteur, '') || ')',
                            '; '
                        ) as articles_resume
                 FROM demandes_devis d
                 LEFT JOIN demandes_devis_lignes l ON d.id = l.demande_devis_id
                 WHERE d.id = $1
                 GROUP BY d.id`;
                queryParams = [demandeId];
            } else {
                console.log('🔍🔍🔍 UTILISATION MYSQL - GROUP_CONCAT');
                // MySQL: utiliser GROUP_CONCAT avec CONCAT et IFNULL
                articlesQuery = `SELECT d.*, 
                        GROUP_CONCAT(
                            CONCAT(l.description, ' (', l.quantite, ' ', l.unite, ' - ', IFNULL(l.secteur, ''), ')')
                            SEPARATOR '; '
                        ) as articles_resume
                 FROM demandes_devis d
                 LEFT JOIN demandes_devis_lignes l ON d.id = l.demande_devis_id
                 WHERE d.id = ?
                 GROUP BY d.id`;
                queryParams = [demandeId];
            }
            
            console.log('🔍🔍🔍 QUERY FINALE:', articlesQuery.substring(0, 200));
            console.log('🔍🔍🔍 Contient STRING_AGG?', articlesQuery.includes('STRING_AGG'));
            console.log('🔍🔍🔍 Contient GROUP_CONCAT?', articlesQuery.includes('GROUP_CONCAT'));
            
            const [demandes] = await pool.execute(articlesQuery, queryParams);
            const demande = demandes[0];

            // Mettre à jour la demande avec la référence
            demande.reference = reference;
            demande.token_suivi = trackingToken;
            demande.mode_notification = mode_notification || 'email';

            // Envoyer les notifications (en arrière-plan, ne bloque pas la réponse)
            sendDevisRequestNotification(demande).catch(err => {
                console.error('Erreur envoi email notification admin:', err);
            });
            
            // Créer une notification dans la plateforme pour les admins/superviseurs
            notifyAdminsAndSupervisors(
                'demande_devis',
                `Nouvelle demande de devis - ${reference}`,
                `Une nouvelle demande de devis a été reçue de ${nom}${entreprise ? ` (${entreprise})` : ''}. ${articlesParsed.length} article(s) demandé(s).`,
                'demande_devis',
                demandeId
            ).catch(err => {
                console.error('Erreur création notification demande devis:', err);
            });
            
            // Envoyer la notification au client avec la référence et le lien de suivi
            sendNotification(demande, reference, trackingToken).then(sent => {
                if (sent) {
                    // Marquer la notification comme envoyée
                    pool.execute(
                        'UPDATE demandes_devis SET notification_envoyee = TRUE WHERE id = $1',
                        [demandeId]
                    ).catch(err => console.error('Erreur mise à jour notification_envoyee:', err));
                }
            }).catch(err => {
                console.error('Erreur envoi notification client:', err);
            });
            
            // Envoyer une notification WhatsApp au client (en arrière-plan)
            notifyClientDemandeDevis(demande).catch(err => {
                console.error('Erreur envoi WhatsApp notification client:', err);
            });

            res.status(201).json({
                message: `Votre demande de devis a été envoyée avec succès. Référence: ${reference}. Vous recevrez un ${mode_notification || 'email'} avec le lien de suivi.`,
                success: true,
                id: demandeId,
                reference: reference,
                trackingUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/suivi?ref=${reference}&token=${trackingToken}`
            });

        } catch (error) {
            // Rollback en cas d'erreur
            await connection.rollback();
            // rollback() libère déjà le client, pas besoin de release()
            // Supprimer les fichiers uploadés en cas d'erreur
            if (req.files && req.files.length > 0) {
                req.files.forEach(file => {
                    if (fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path);
                    }
                });
            }
            throw error;
        }

    } catch (error) {
        // Supprimer les fichiers uploadés en cas d'erreur
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
            });
        }
        console.error('Erreur lors de la demande de devis:', error);
        
        // Gérer les erreurs multer
        if (error instanceof multer.MulterError) {
            if (error.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ error: 'Un ou plusieurs fichiers dépassent la taille maximale de 10 MB' });
            }
            if (error.code === 'LIMIT_FILE_COUNT') {
                return res.status(400).json({ error: 'Trop de fichiers. Maximum 10 fichiers autorisés' });
            }
        }
        
        res.status(500).json({ error: error.message || 'Erreur lors de l\'envoi de la demande. Veuillez réessayer plus tard.' });
    }
});

// Route publique pour les messages de contact (AVANT l'authentification)
router.post('/message', async (req, res) => {
    try {
        const { nom, email, telephone, sujet, message } = req.body;
        
        // Validation
        if (!nom || !email || !sujet || !message) {
            return res.status(400).json({ error: 'Tous les champs obligatoires doivent être remplis' });
        }
        
        // Enregistrer le message dans la base de données
        // Le wrapper PostgreSQL ajoute automatiquement RETURNING id si nécessaire
        const [messageRows, messageResult] = await pool.execute(
            `INSERT INTO messages_contact (nom, email, telephone, sujet, message) 
             VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [nom, email, telephone || null, sujet, message]
        );
        
        // Récupérer l'ID : le wrapper PostgreSQL le met dans insertId ou dans le premier row
        const messageId = messageResult.insertId || (messageRows && messageRows.length > 0 ? messageRows[0].id : null);
        
        // Créer une notification pour les admins/superviseurs dans le dashboard
        notifyAdminsAndSupervisors(
            'message_contact',
            `Nouveau message de contact - ${sujet}`,
            `Message reçu de ${nom} (${email})${telephone ? ` - ${telephone}` : ''}:\n\n${message}`,
            'contact',
            messageId
        ).catch(err => {
            console.error('❌ Erreur création notification dashboard:', err);
        });
        
        // Envoyer une notification WhatsApp aux admins (en arrière-plan, ne bloque pas la réponse)
        notifyAdminsMessageContact(nom, email, telephone, sujet, message).catch(err => {
            console.error('❌ Erreur envoi WhatsApp notification admin:', err);
        });
        
        res.status(200).json({
            message: 'Votre message a été envoyé avec succès. Nous vous répondrons dans les plus brefs délais.'
        });
    } catch (error) {
        console.error('Erreur traitement message contact:', error);
        
        // Vérifier si c'est une erreur de table manquante
        if (error.message && error.message.includes('does not exist') && error.message.includes('messages_contact')) {
            console.error('❌ Table messages_contact n\'existe pas. Exécutez: npm run render:update');
            return res.status(500).json({ 
                error: 'Erreur de configuration serveur. Veuillez contacter le support.',
                details: 'La table messages_contact n\'existe pas encore. Veuillez réessayer dans quelques instants ou nous contacter directement.'
            });
        }
        
        res.status(500).json({ error: 'Erreur lors de l\'envoi du message. Veuillez réessayer ou nous contacter directement.' });
    }
});

// Routes protégées pour l'administration des demandes
router.use(authenticate);

// Lister toutes les demandes de devis (admin/superviseur)
router.get('/demandes', requireRole('admin', 'superviseur'), async (req, res) => {
    try {
        const { statut, page = 1, limit = 50 } = req.query;
        
        // #region agent log - Début route /demandes
        const fs = require('fs');
        const logPath = '/Users/dantawi/Documents/SilyProcure/.cursor/debug.log';
        try {
            fs.appendFileSync(logPath, JSON.stringify({
                location: 'backend/routes/contact.js:/demandes:start',
                message: 'Route /demandes appelée',
                data: { statut, page, limit, user: req.user?.email },
                timestamp: Date.now(),
                sessionId: 'debug-session',
                runId: 'demandes-backend',
                hypothesisId: 'A'
            }) + '\n');
        } catch (logErr) {}
        // #endregion
        
        // S'assurer que page et limit sont des nombres entiers valides
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.max(1, Math.min(1000, parseInt(limit) || 50)); // Limiter à 1000 max
        const offset = (pageNum - 1) * limitNum;

        // Détecter le type de base de données
        const usePostgreSQL = !!(process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql');
        const coalesceFunc = usePostgreSQL ? 'COALESCE' : 'IFNULL';
        const placeholder = usePostgreSQL ? '$1' : '?';

        // COUNT() ne retourne jamais NULL, donc pas besoin de IFNULL/COALESCE
        let query = `
            SELECT d.*, 
                   u.nom as traite_par_nom, 
                   u.prenom as traite_par_prenom,
                   COUNT(l.id) as nb_articles
            FROM demandes_devis d
            LEFT JOIN utilisateurs u ON d.traite_par = u.id
            LEFT JOIN demandes_devis_lignes l ON d.id = l.demande_devis_id
        `;
        const params = [];

        if (statut) {
            query += ` WHERE d.statut = ${placeholder}`;
            params.push(statut);
        }

        query += ' GROUP BY d.id, u.nom, u.prenom';
        
        // Note: LIMIT et OFFSET ne peuvent pas être des paramètres préparés dans certaines versions MySQL
        // Utiliser l'interpolation directe après validation
        query += ` ORDER BY d.date_creation DESC LIMIT ${limitNum} OFFSET ${offset}`;

        console.log('🔍🔍🔍 Route /demandes - Query SQL:', query.substring(0, 300));
        console.log('🔍🔍🔍 Route /demandes - usePostgreSQL:', usePostgreSQL, 'params:', params);

        // #region agent log - Avant exécution SQL
        try {
            fs.appendFileSync(logPath, JSON.stringify({
                location: 'backend/routes/contact.js:/demandes:before-sql',
                message: 'Avant exécution SQL',
                data: { query: query.substring(0, 200), params, limitNum, offset },
                timestamp: Date.now(),
                sessionId: 'debug-session',
                runId: 'demandes-backend',
                hypothesisId: 'B'
            }) + '\n');
        } catch (logErr) {}
        // #endregion

        console.log('🔍🔍🔍 Route /demandes - AVANT EXÉCUTION SQL - query:', query.substring(0, 400));
        console.log('🔍🔍🔍 Route /demandes - AVANT EXÉCUTION SQL - params:', params);
        console.log('🔍🔍🔍 Route /demandes - AVANT EXÉCUTION SQL - usePostgreSQL:', usePostgreSQL);
        console.log('🔍🔍🔍 Route /demandes - AVANT EXÉCUTION SQL - placeholder:', placeholder);
        
        let demandes;
        try {
            console.log('🔍🔍🔍 Route /demandes - APPEL pool.execute...');
            const result = await pool.execute(query, params);
            demandes = result[0];
            console.log('🔍🔍🔍 Route /demandes - SQL EXÉCUTÉ AVEC SUCCÈS - nbDemandes:', demandes?.length || 0);
            if (demandes && demandes.length > 0) {
                console.log('🔍🔍🔍 Route /demandes - Première demande ID:', demandes[0].id);
            } else {
                console.log('🔍🔍🔍 Route /demandes - AUCUNE DEMANDE TROUVÉE');
            }
        } catch (sqlError) {
            console.error('🔍🔍🔍 Route /demandes - ERREUR SQL:', sqlError.message);
            console.error('🔍🔍🔍 Route /demandes - ERREUR SQL - code:', sqlError.code);
            console.error('🔍🔍🔍 Route /demandes - ERREUR SQL - sqlState:', sqlError.sqlState);
            console.error('🔍🔍🔍 Route /demandes - ERREUR SQL - sql:', sqlError.sql?.substring(0, 500));
            throw sqlError;
        }
        
        // #region agent log - Après exécution SQL
        try {
            fs.appendFileSync(logPath, JSON.stringify({
                location: 'backend/routes/contact.js:/demandes:after-sql',
                message: 'SQL exécuté avec succès',
                data: { nbDemandes: demandes?.length || 0 },
                timestamp: Date.now(),
                sessionId: 'debug-session',
                runId: 'demandes-backend',
                hypothesisId: 'C'
            }) + '\n');
        } catch (logErr) {}
        // #endregion

        // Compter le total
        // Réutiliser usePostgreSQL et placeholder déjà déclarés plus haut
        let countQuery = 'SELECT COUNT(*) as total FROM demandes_devis';
        const countParams = [];
        if (statut) {
            countQuery += ` WHERE statut = ${placeholder}`;
            countParams.push(statut);
        }
        
        console.log('🔍🔍🔍 Route /demandes - COUNT QUERY:', countQuery);
        console.log('🔍🔍🔍 Route /demandes - COUNT PARAMS:', countParams);
        
        const [countResult] = await pool.execute(countQuery, countParams);
        const total = countResult[0].total;

        console.log('🔍🔍🔍 Route /demandes - TOTAL:', total);
        console.log('🔍🔍🔍 Route /demandes - AVANT res.json - demandes.length:', demandes?.length || 0);

        const responseData = {
            demandes,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        };
        
        console.log('🔍🔍🔍 Route /demandes - ENVOI RÉPONSE - pagination:', responseData.pagination);
        res.json(responseData);

    } catch (error) {
        // #region agent log - Erreur catchée
        const fs = require('fs');
        const logPath = '/Users/dantawi/Documents/SilyProcure/.cursor/debug.log';
        try {
            fs.appendFileSync(logPath, JSON.stringify({
                location: 'backend/routes/contact.js:/demandes:error',
                message: 'Erreur catchée',
                data: { 
                    error: error.message,
                    stack: error.stack?.substring(0, 300),
                    code: error.code,
                    sqlState: error.sqlState
                },
                timestamp: Date.now(),
                sessionId: 'debug-session',
                runId: 'demandes-backend',
                hypothesisId: 'D'
            }) + '\n');
        } catch (logErr) {}
        // #endregion
        
        console.error('Erreur récupération demandes:', error);
        res.status(500).json({ error: error.message });
    }
});

// Récupérer une demande spécifique
router.get('/demandes/:id', requireRole('admin', 'superviseur'), validateId, async (req, res) => {
    try {
        const { id } = req.params;

        const [demandes] = await pool.execute(
            `SELECT d.*, 
                    u.nom as traite_par_nom, 
                    u.prenom as traite_par_prenom
             FROM demandes_devis d
             LEFT JOIN utilisateurs u ON d.traite_par = u.id
             WHERE d.id = $1`,
            [id]
        );

        if (demandes.length === 0) {
            return res.status(404).json({ error: 'Demande non trouvée' });
        }

        const demande = demandes[0];

        // Récupérer les lignes d'articles
        const [lignes] = await pool.execute(
            'SELECT * FROM demandes_devis_lignes WHERE demande_devis_id = $1 ORDER BY ordre',
            [id]
        );
        demande.articles = lignes;

        res.json(demande);

    } catch (error) {
        console.error('Erreur récupération demande:', error);
        res.status(500).json({ error: error.message });
    }
});

// Créer des RFQ depuis une demande client
router.post('/demandes/:id/create-rfq', requireRole('admin', 'superviseur'), validateId, async (req, res) => {
    try {
        const { id } = req.params;
        const { fournisseur_ids, date_limite_reponse, date_livraison_souhaitee, incoterms, conditions_paiement } = req.body;
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/4b4f730e-c02b-49d5-b562-4d5fc3dd49d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'contact.js:474',message:'POST /create-rfq - Entry',data:{demandeId:id,fournisseursCount:fournisseur_ids?.length},timestamp:Date.now(),sessionId:'test-complet',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion

        // Vérifier que la demande existe
        const [demandes] = await pool.execute(
            'SELECT * FROM demandes_devis WHERE id = $1',
            [id]
        );

        if (demandes.length === 0) {
            return res.status(404).json({ error: 'Demande non trouvée' });
        }

        const demande = demandes[0];

        // Vérifier que des fournisseurs sont sélectionnés
        if (!fournisseur_ids || !Array.isArray(fournisseur_ids) || fournisseur_ids.length === 0) {
            return res.status(400).json({ error: 'Veuillez sélectionner au moins un fournisseur' });
        }

        // Récupérer les lignes d'articles de la demande
        const [lignes] = await pool.execute(
            'SELECT * FROM demandes_devis_lignes WHERE demande_devis_id = $1 ORDER BY ordre',
            [id]
        );

        if (lignes.length === 0) {
            return res.status(400).json({ error: 'La demande ne contient aucun article' });
        }

        // Récupérer l'utilisateur connecté (émetteur)
        // Note: La table utilisateurs n'a pas de colonne entreprise_id
        // On utilise directement l'ID de l'utilisateur comme émetteur
        const emetteur_id = req.user.id;

        // Fonction pour générer un numéro RFQ unique
        const generateRFQNumber = async (connection) => {
            const year = new Date().getFullYear();
            const prefix = `RFQ-${year}-`;
            
            // Utiliser la connexion de transaction pour éviter les problèmes de concurrence
            const [lastRFQ] = await connection.execute(
                `SELECT numero FROM rfq WHERE numero LIKE $1 ORDER BY numero DESC LIMIT 1`,
                [`${prefix}%`]
            );
            
            let nextNumber = 1;
            if (lastRFQ.length > 0) {
                const lastNum = lastRFQ[0].numero;
                const lastSeq = parseInt(lastNum.split('-')[2]) || 0;
                nextNumber = lastSeq + 1;
            }
            
            // Vérifier que le numéro n'existe pas déjà (protection contre les collisions)
            let numero = `${prefix}${String(nextNumber).padStart(4, '0')}`;
            let attempts = 0;
            const maxAttempts = 100;
            
            while (attempts < maxAttempts) {
                const [existing] = await connection.execute(
                    'SELECT id FROM rfq WHERE numero = $1',
                    [numero]
                );
                
                if (existing.length === 0) {
                    // Numéro disponible
                    break;
                }
                
                // Numéro existe déjà, incrémenter
                nextNumber++;
                numero = `${prefix}${String(nextNumber).padStart(4, '0')}`;
                attempts++;
            }
            
            if (attempts >= maxAttempts) {
                // Si on n'a pas trouvé de numéro disponible, utiliser un timestamp
                const timestamp = Date.now().toString().slice(-6);
                numero = `${prefix}${timestamp}`;
            }
            
            return numero;
        };

        // Créer une RFQ pour chaque fournisseur
        const rfqsCreated = [];
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            for (const fournisseur_id of fournisseur_ids) {
                // Vérifier que le fournisseur existe
                const [fournisseurs] = await connection.execute(
                    'SELECT id, nom FROM entreprises WHERE id = $1 AND type_entreprise = $2',
                    [fournisseur_id, 'fournisseur']
                );

                if (fournisseurs.length === 0) {
                    continue; // Ignorer ce fournisseur
                }

                const numero = await generateRFQNumber(connection);

                // Créer la RFQ
                const [rfqRows, rfqResult] = await connection.execute(
                    `INSERT INTO rfq (numero, date_emission, date_limite_reponse, emetteur_id, destinataire_id,
                      description, lieu_livraison_id, date_livraison_souhaitee, incoterms, conditions_paiement, statut)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'brouillon') RETURNING id`,
                    [
                        numero,
                        new Date().toISOString().split('T')[0],
                        date_limite_reponse || null,
                        emetteur_id,
                        fournisseur_id,
                        demande.message || `Demande de devis pour : ${demande.nom}${demande.entreprise ? ' (' + demande.entreprise + ')' : ''}`,
                        null, // lieu_livraison_id - peut être ajouté plus tard
                        date_livraison_souhaitee || null,
                        incoterms || null,
                        conditions_paiement || null
                    ]
                );

                const rfq_id = rfqResult.rows && rfqResult.rows[0] ? rfqResult.rows[0].id : (rfqResult.insertId || rfqResult[0]?.id);

                // Créer les lignes de la RFQ depuis les articles de la demande
                for (const ligne of lignes) {
                    await connection.execute(
                        'INSERT INTO rfq_lignes (rfq_id, reference, description, quantite, unite, specifications, ordre) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                        [
                            rfq_id,
                            null, // reference
                            ligne.description,
                            ligne.quantite,
                            ligne.unite,
                            `Secteur: ${ligne.secteur || 'Non spécifié'}`,
                            ligne.ordre
                        ]
                    );
                }

                rfqsCreated.push({
                    id: rfq_id,
                    numero: numero,
                    fournisseur_id: fournisseur_id,
                    fournisseur_nom: fournisseurs[0].nom
                });
            }

            // Mettre à jour le statut de la demande
            await connection.execute(
                'UPDATE demandes_devis SET statut = $1 WHERE id = $2',
                ['en_cours', id]
            );

            await connection.commit();
            // commit() libère déjà le client, pas besoin de release()
            // #region agent log
            fetch('http://127.0.0.1:7244/ingest/4b4f730e-c02b-49d5-b562-4d5fc3dd49d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'contact.js:630',message:'RFQ créées avec succès',data:{demandeId:id,rfqsCreated:rfqsCreated.length,rfqs:rfqsCreated.map(r=>r.numero)},timestamp:Date.now(),sessionId:'test-complet',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
            // #endregion

            // Notifier les fournisseurs par WhatsApp (en arrière-plan)
            for (const rfq of rfqsCreated) {
                const [fournisseur] = await pool.execute(
                    'SELECT id, nom, telephone FROM entreprises WHERE id = $1',
                    [rfq.fournisseur_id]
                );
                if (fournisseur && fournisseur.length > 0) {
                    notifyFournisseurDemandeDevis(fournisseur[0], { numero: rfq.numero, id: rfq.id }).catch(err => {
                        console.error('Erreur notification WhatsApp fournisseur:', err);
                    });
                }
            }

            res.status(201).json({
                message: `${rfqsCreated.length} RFQ créée(s) avec succès`,
                rfqs: rfqsCreated,
                demande_id: id
            });

        } catch (error) {
            await connection.rollback();
            // rollback() libère déjà le client, pas besoin de release()
            throw error;
        }

    } catch (error) {
        console.error('Erreur création RFQ depuis demande:', error);
        res.status(500).json({ error: error.message });
    }
});

// Mettre à jour le statut d'une demande
router.patch('/demandes/:id/statut', requireRole('admin', 'superviseur'), validateId, async (req, res) => {
    try {
        const { id } = req.params;
        const { statut, notes_internes } = req.body;

        // Valider le statut
        const validStatuts = ['nouvelle', 'en_cours', 'traitee', 'annulee'];
        if (!validStatuts.includes(statut)) {
            return res.status(400).json({ error: 'Statut invalide' });
        }

        // Vérifier que la demande existe
        const [existing] = await pool.execute('SELECT id FROM demandes_devis WHERE id = $1', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Demande non trouvée' });
        }

        // Mettre à jour
        await pool.execute(
            `UPDATE demandes_devis 
             SET statut = $1, 
                 traite_par = $2, 
                 notes_internes = $3,
                 date_modification = NOW()
             WHERE id = $4`,
            [statut, req.user.id, notes_internes || null, id]
        );

        res.json({ message: 'Statut mis à jour avec succès' });

    } catch (error) {
        console.error('Erreur mise à jour statut:', error);
        res.status(500).json({ error: error.message });
    }
});

// Supprimer une demande
router.delete('/demandes/:id', requireRole('admin'), validateId, async (req, res) => {
    try {
        const { id } = req.params;

        const [existing] = await pool.execute('SELECT id FROM demandes_devis WHERE id = $1', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Demande non trouvée' });
        }

        await pool.execute('DELETE FROM demandes_devis WHERE id = $1', [id]);

        res.json({ message: 'Demande supprimée avec succès' });

    } catch (error) {
        console.error('Erreur suppression demande:', error);
        res.status(500).json({ error: error.message });
    }
});

// Route publique pour le suivi d'une demande (sans authentification)
router.get('/tracking', async (req, res) => {
    try {
        const { ref, token } = req.query;

        if (!ref || !token) {
            return res.status(400).json({ error: 'Référence et token requis' });
        }

        // Récupérer la demande avec ses lignes
        // Utiliser GROUP_CONCAT pour MySQL, STRING_AGG pour PostgreSQL
        const usePostgreSQL = !!(process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql');
        
        let trackingQuery;
        if (usePostgreSQL) {
            trackingQuery = `SELECT d.*, 
                    STRING_AGG(
                        l.description || '|' || COALESCE(l.secteur, '') || '|' || l.quantite || '|' || l.unite,
                        ';;'
                    ) as articles_data
             FROM demandes_devis d
             LEFT JOIN demandes_devis_lignes l ON d.id = l.demande_devis_id
             WHERE d.reference = $1 AND d.token_suivi = $2
             GROUP BY d.id`;
        } else {
            trackingQuery = `SELECT d.*, 
                    GROUP_CONCAT(
                        CONCAT(l.description, '|', IFNULL(l.secteur, ''), '|', l.quantite, '|', l.unite)
                        SEPARATOR ';;'
                    ) as articles_data
             FROM demandes_devis d
             LEFT JOIN demandes_devis_lignes l ON d.id = l.demande_devis_id
             WHERE d.reference = ? AND d.token_suivi = ?
             GROUP BY d.id`;
        }
        
        const [demandes] = await pool.execute(trackingQuery, [ref, token]);

        if (demandes.length === 0) {
            return res.status(404).json({ error: 'Demande non trouvée ou token invalide' });
        }

        const demande = demandes[0];

        // Parser les articles
        if (demande.articles_data) {
            demande.articles = demande.articles_data.split(';;').map(art => {
                const [description, secteur, quantite, unite] = art.split('|');
                return { description, secteur, quantite: parseFloat(quantite), unite };
            });
        } else {
            demande.articles = [];
        }
        delete demande.articles_data;

        // Ne pas renvoyer le token dans la réponse
        delete demande.token_suivi;

        res.json(demande);

    } catch (error) {
        console.error('Erreur récupération suivi:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des informations de suivi' });
    }
});

// Route publique pour recevoir les messages de contact depuis le formulaire
// Route pour récupérer les messages de contact (admin/superviseur)
router.get('/messages', requireRole('admin', 'superviseur'), async (req, res) => {
    try {
        const { lu, traite, limit = 50, offset = 0 } = req.query;
        
        // Convertir en nombres pour éviter les problèmes de type
        const limitNum = parseInt(limit) || 50;
        const offsetNum = parseInt(offset) || 0;
        
        let query = `
            SELECT m.*, 
                   u.nom as traite_par_nom, u.prenom as traite_par_prenom
            FROM messages_contact m
            LEFT JOIN utilisateurs u ON m.traite_par = u.id
            WHERE 1=1
        `;
        const params = [];
        
        let paramIndex = 1;
        if (lu !== undefined) {
            query += ` AND m.lu = $${paramIndex}`;
            params.push(lu === 'true' ? 1 : 0);
            paramIndex++;
        }
        
        if (traite !== undefined) {
            query += ` AND m.traite = $${paramIndex}`;
            params.push(traite === 'true' ? 1 : 0);
            paramIndex++;
        }
        
        // LIMIT et OFFSET doivent être interpolés directement (PostgreSQL ne supporte pas les paramètres pour LIMIT/OFFSET dans certaines versions)
        query += ` ORDER BY m.date_creation DESC LIMIT ${limitNum} OFFSET ${offsetNum}`;
        
        const [messagesRows] = await pool.execute(query, params);
        const messages = messagesRows;
        
        // Compter le total
        let countQuery = 'SELECT COUNT(*) as total FROM messages_contact WHERE 1=1';
        const countParams = [];
        
        if (lu !== undefined) {
            countQuery += ' AND lu = ?';
            countParams.push(lu === 'true' ? 1 : 0);
        }
        
        if (traite !== undefined) {
            countQuery += ' AND traite = ?';
            countParams.push(traite === 'true' ? true : false);
        }
        
        const [countRows] = await pool.execute(countQuery, countParams);
        const countResult = countRows;
        const total = countResult[0]?.total || 0;
        
        res.json({
            data: messages,
            total: total,
            limit: limitNum,
            offset: offsetNum
        });
    } catch (error) {
        console.error('Erreur récupération messages contact:', error);
        res.status(500).json({ error: error.message });
    }
});

// Route pour marquer un message comme lu
router.patch('/messages/:id/lu', requireRole('admin', 'superviseur'), validateId, async (req, res) => {
    try {
        const { lu } = req.body;
        await pool.execute(
            'UPDATE messages_contact SET lu = $1 WHERE id = $2',
            [lu ? true : false, req.params.id]
        );
        res.json({ message: 'Message mis à jour' });
    } catch (error) {
        console.error('Erreur mise à jour message:', error);
        res.status(500).json({ error: error.message });
    }
});

// Route pour marquer un message comme traité
router.patch('/messages/:id/traite', requireRole('admin', 'superviseur'), validateId, async (req, res) => {
    try {
        const { traite, notes_internes } = req.body;
        await pool.execute(
            'UPDATE messages_contact SET traite = $1, traite_par = $2, notes_internes = $3 WHERE id = $4',
            [traite ? true : false, req.user.id, notes_internes || null, req.params.id]
        );
        res.json({ message: 'Message mis à jour' });
    } catch (error) {
        console.error('Erreur mise à jour message:', error);
        res.status(500).json({ error: error.message });
    }
});

// Route publique pour récupérer la liste des secteurs depuis la base de données
router.get('/secteurs', async (req, res) => {
    try {
        const usePostgreSQL = !!(process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql');
        
        let query;
        if (usePostgreSQL) {
            // PostgreSQL: UNION des secteurs depuis demandes_devis_lignes et entreprises
            query = `
                SELECT DISTINCT secteur as nom
                FROM demandes_devis_lignes
                WHERE secteur IS NOT NULL AND secteur != ''
                UNION
                SELECT DISTINCT secteur_activite as nom
                FROM entreprises
                WHERE secteur_activite IS NOT NULL AND secteur_activite != ''
                UNION
                SELECT DISTINCT secteur_activite as nom
                FROM clients
                WHERE secteur_activite IS NOT NULL AND secteur_activite != ''
                ORDER BY nom ASC
            `;
        } else {
            // MySQL: UNION des secteurs depuis demandes_devis_lignes et entreprises
            query = `
                SELECT DISTINCT secteur as nom
                FROM demandes_devis_lignes
                WHERE secteur IS NOT NULL AND secteur != ''
                UNION
                SELECT DISTINCT secteur_activite as nom
                FROM entreprises
                WHERE secteur_activite IS NOT NULL AND secteur_activite != ''
                UNION
                SELECT DISTINCT secteur_activite as nom
                FROM clients
                WHERE secteur_activite IS NOT NULL AND secteur_activite != ''
                ORDER BY nom ASC
            `;
        }
        
        const [rows] = await pool.execute(query);
        const secteurs = rows.map(row => row.nom).filter(Boolean);
        
        // Ajouter des secteurs par défaut s'il n'y en a pas dans la base
        const secteursParDefaut = [
            'BTP - Construction',
            'Commerce - Distribution',
            'Industrie - Manufacture',
            'Services - Conseil',
            'Transport - Logistique',
            'Informatique - TIC',
            'Agroalimentaire',
            'Énergie - Électricité',
            'Santé - Médical',
            'Éducation - Formation',
            'Hôtellerie - Restauration',
            'Immobilier',
            'Finance - Banque',
            'Automobile',
            'Textile - Mode',
            'Chimie - Pharmacie',
            'Métallurgie',
            'Papier - Imprimerie',
            'Autre'
        ];
        
        // Fusionner les secteurs de la base avec les secteurs par défaut, en évitant les doublons
        const tousSecteurs = [...new Set([...secteurs, ...secteursParDefaut])].sort();
        
        res.json({ secteurs: tousSecteurs });
    } catch (error) {
        console.error('Erreur récupération secteurs:', error);
        // En cas d'erreur, retourner les secteurs par défaut
        const secteursParDefaut = [
            'BTP - Construction',
            'Commerce - Distribution',
            'Industrie - Manufacture',
            'Services - Conseil',
            'Transport - Logistique',
            'Informatique - TIC',
            'Agroalimentaire',
            'Énergie - Électricité',
            'Santé - Médical',
            'Éducation - Formation',
            'Hôtellerie - Restauration',
            'Immobilier',
            'Finance - Banque',
            'Automobile',
            'Textile - Mode',
            'Chimie - Pharmacie',
            'Métallurgie',
            'Papier - Imprimerie',
            'Autre'
        ];
        res.json({ secteurs: secteursParDefaut });
    }
});

module.exports = router;

