const express = require('express');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { validateRFQ, validateId } = require('../middleware/validation');
const router = express.Router();

router.use(authenticate);

// Fonction pour générer le numéro RFQ automatique
async function generateRFQNumber() {
    const year = new Date().getFullYear();
    const prefix = `RFQ-${year}-`;
    
    // Détecter le type de base de données
    const usePostgreSQL = !!(process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql');
    const placeholder = usePostgreSQL ? '$1' : '?';
    
    // Trouver le dernier numéro de l'année
    const [lastRFQ] = await pool.execute(
        `SELECT numero FROM rfq WHERE numero LIKE ${placeholder} ORDER BY numero DESC LIMIT 1`,
        [`${prefix}%`]
    );
    
    let nextNumber = 1;
    if (lastRFQ.length > 0) {
        const lastNum = lastRFQ[0].numero;
        const lastSeq = parseInt(lastNum.split('-')[2]) || 0;
        nextNumber = lastSeq + 1;
    }
    
    // Formater avec 4 chiffres (0001, 0002, etc.)
    return `${prefix}${String(nextNumber).padStart(4, '0')}`;
}

// Générer un numéro RFQ automatique
router.get('/generate-number', async (req, res) => {
    try {
        const numero = await generateRFQNumber();
        res.json({ numero });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Liste des RFQ
router.get('/', async (req, res) => {
    try {
        const { statut, emetteur_id, destinataire_id } = req.query;
        
        // Détecter le type de base de données
        const usePostgreSQL = !!(process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql');
        
        let query = `
            SELECT r.*, 
                   e1.nom as emetteur_nom,
                   e2.nom as destinataire_nom
            FROM rfq r
            LEFT JOIN entreprises e1 ON r.emetteur_id = e1.id
            LEFT JOIN entreprises e2 ON r.destinataire_id = e2.id
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;

        if (statut) {
            query += usePostgreSQL ? ` AND r.statut = $${paramIndex}` : ' AND r.statut = ?';
            params.push(statut);
            paramIndex++;
        }

        if (emetteur_id) {
            query += usePostgreSQL ? ` AND r.emetteur_id = $${paramIndex}` : ' AND r.emetteur_id = ?';
            params.push(emetteur_id);
            paramIndex++;
        }

        if (destinataire_id) {
            query += usePostgreSQL ? ` AND r.destinataire_id = $${paramIndex}` : ' AND r.destinataire_id = ?';
            params.push(destinataire_id);
            paramIndex++;
        }

        query += ' ORDER BY r.date_emission DESC';

        const [rfqs] = await pool.execute(query, params);
        res.json(rfqs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Détails d'une RFQ avec lignes
router.get('/:id', validateId, async (req, res) => {
    try {
        const { id } = req.params;

        // Détecter le type de base de données
        const usePostgreSQL = !!(process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql');
        const placeholder = usePostgreSQL ? '$1' : '?';

        const [rfqs] = await pool.execute(
            `SELECT r.*, 
                    e1.nom as emetteur_nom, e1.email as emetteur_email,
                    e2.nom as destinataire_nom, e2.email as destinataire_email
             FROM rfq r
             LEFT JOIN entreprises e1 ON r.emetteur_id = e1.id
             LEFT JOIN entreprises e2 ON r.destinataire_id = e2.id
             WHERE r.id = ${placeholder}`,
            [id]
        );

        if (rfqs.length === 0) {
            return res.status(404).json({ error: 'RFQ non trouvée' });
        }

        const rfq = rfqs[0];

        // Récupérer les lignes
        const [lignes] = await pool.execute(
            `SELECT * FROM rfq_lignes WHERE rfq_id = ${placeholder} ORDER BY ordre`,
            [id]
        );
        rfq.lignes = lignes;

        res.json(rfq);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Créer une RFQ
router.post('/', validateRFQ, async (req, res) => {
    try {
        let {
            numero, date_emission, date_limite_reponse, destinataire_id, contact_destinataire_id,
            categorie_id, description, lieu_livraison_id, date_livraison_souhaitee,
            incoterms, conditions_paiement, projet_id, centre_cout_id, lignes
        } = req.body;

        // Générer le numéro automatiquement si non fourni
        if (!numero || numero.trim() === '') {
            numero = await generateRFQNumber();
        }

        // L'emetteur_id est directement l'ID de l'utilisateur connecté
        // (la table rfq.emetteur_id référence utilisateurs.id, pas entreprises.id)
        const emetteur_id = req.user.id;

        // Détecter le type de base de données
        const usePostgreSQL = !!(process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql');

        // Convertir tous les paramètres undefined en null
        const params = [
            numero || null,
            date_emission || null,
            date_limite_reponse || null,
            emetteur_id,
            destinataire_id || null,
            contact_destinataire_id || null,
            categorie_id || null,
            description || null,
            lieu_livraison_id || null,
            date_livraison_souhaitee || null,
            incoterms || null,
            conditions_paiement || null,
            projet_id || null,
            centre_cout_id || null
        ];

        const insertQuery = usePostgreSQL
            ? `INSERT INTO rfq (numero, date_emission, date_limite_reponse, emetteur_id, destinataire_id, 
              contact_destinataire_id, categorie_id, description, lieu_livraison_id, date_livraison_souhaitee,
              incoterms, conditions_paiement, projet_id, centre_cout_id, statut)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'brouillon') RETURNING id`
            : `INSERT INTO rfq (numero, date_emission, date_limite_reponse, emetteur_id, destinataire_id, 
              contact_destinataire_id, categorie_id, description, lieu_livraison_id, date_livraison_souhaitee,
              incoterms, conditions_paiement, projet_id, centre_cout_id, statut)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'brouillon')`;

        const [rfqRows, rfqResult] = await pool.execute(insertQuery, params);

        // Récupérer l'ID selon le type de base de données
        const rfq_id = usePostgreSQL 
            ? (rfqResult.rows && rfqResult.rows[0] ? rfqResult.rows[0].id : rfqResult[0]?.id)
            : rfqResult.insertId;

        // Insérer les lignes
        if (lignes && lignes.length > 0) {
            const lignePlaceholder = usePostgreSQL 
                ? '($1, $2, $3, $4, $5, $6, $7, $8)'
                : '(?, ?, ?, ?, ?, ?, ?, ?)';
            
            for (const ligne of lignes) {
                await pool.execute(
                    `INSERT INTO rfq_lignes (rfq_id, produit_id, reference, description, quantite, unite, specifications, ordre) VALUES ${lignePlaceholder}`,
                    [
                        rfq_id,
                        ligne.produit_id || null,
                        ligne.reference || null,
                        ligne.description || null,
                        ligne.quantite || null,
                        ligne.unite || 'unité',
                        ligne.specifications || null,
                        ligne.ordre || 0
                    ]
                );
            }
        }

        res.status(201).json({ id: rfq_id, numero: numero, message: 'RFQ créée avec succès' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Mettre à jour une RFQ
router.put('/:id', validateId, validateRFQ, async (req, res) => {
    try {
        const { id } = req.params;
        let {
            numero, date_emission, date_limite_reponse, destinataire_id, contact_destinataire_id,
            categorie_id, description, lieu_livraison_id, date_livraison_souhaitee,
            incoterms, conditions_paiement, projet_id, centre_cout_id, lignes
        } = req.body;

        // Détecter le type de base de données
        const usePostgreSQL = !!(process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql');
        const placeholder = usePostgreSQL ? '$1' : '?';
        const idPlaceholder = usePostgreSQL ? '$13' : '?';

        // Mettre à jour la RFQ
        await pool.execute(
            `UPDATE rfq SET 
                date_emission = ${usePostgreSQL ? '$1' : '?'}, date_limite_reponse = ${usePostgreSQL ? '$2' : '?'}, destinataire_id = ${usePostgreSQL ? '$3' : '?'}, contact_destinataire_id = ${usePostgreSQL ? '$4' : '?'},
                categorie_id = ${usePostgreSQL ? '$5' : '?'}, description = ${usePostgreSQL ? '$6' : '?'}, lieu_livraison_id = ${usePostgreSQL ? '$7' : '?'}, date_livraison_souhaitee = ${usePostgreSQL ? '$8' : '?'},
                incoterms = ${usePostgreSQL ? '$9' : '?'}, conditions_paiement = ${usePostgreSQL ? '$10' : '?'}, projet_id = ${usePostgreSQL ? '$11' : '?'}, centre_cout_id = ${usePostgreSQL ? '$12' : '?'}
             WHERE id = ${idPlaceholder}`,
            [
                date_emission, date_limite_reponse, destinataire_id, contact_destinataire_id,
                categorie_id, description, lieu_livraison_id, date_livraison_souhaitee,
                incoterms, conditions_paiement, projet_id, centre_cout_id, id
            ]
        );

        // Supprimer les anciennes lignes
        await pool.execute(`DELETE FROM rfq_lignes WHERE rfq_id = ${placeholder}`, [id]);

        // Insérer les nouvelles lignes
        if (lignes && lignes.length > 0) {
            const lignePlaceholder = usePostgreSQL 
                ? '($1, $2, $3, $4, $5, $6, $7, $8)'
                : '(?, ?, ?, ?, ?, ?, ?, ?)';
            
            for (const ligne of lignes) {
                await pool.execute(
                    `INSERT INTO rfq_lignes (rfq_id, produit_id, reference, description, quantite, unite, specifications, ordre) VALUES ${lignePlaceholder}`,
                    [id, ligne.produit_id, ligne.reference, ligne.description, ligne.quantite, ligne.unite || 'unité', ligne.specifications, ligne.ordre || 0]
                );
            }
        }

        res.json({ message: 'RFQ mise à jour avec succès' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Mettre à jour le statut d'une RFQ
router.patch('/:id/statut', validateId, async (req, res) => {
    try {
        const { id } = req.params;
        const { statut } = req.body;

        // Détecter le type de base de données
        const usePostgreSQL = !!(process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql');
        const placeholder1 = usePostgreSQL ? '$1' : '?';
        const placeholder2 = usePostgreSQL ? '$2' : '?';

        await pool.execute(`UPDATE rfq SET statut = ${placeholder1} WHERE id = ${placeholder2}`, [statut, id]);
        res.json({ message: 'Statut mis à jour avec succès' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Supprimer une RFQ
router.delete('/:id', validateId, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Détecter le type de base de données
        const usePostgreSQL = !!(process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql');
        const placeholder = usePostgreSQL ? '$1' : '?';
        
        // Supprimer d'abord les lignes
        await pool.execute(`DELETE FROM rfq_lignes WHERE rfq_id = ${placeholder}`, [id]);
        
        // Puis supprimer la RFQ
        await pool.execute(`DELETE FROM rfq WHERE id = ${placeholder}`, [id]);
        
        res.json({ message: 'RFQ supprimée avec succès' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

