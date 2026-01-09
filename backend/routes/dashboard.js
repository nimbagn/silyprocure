const express = require('express');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

router.use(authenticate);

// Statistiques du dashboard
router.get('/stats', async (req, res) => {
    console.log('📊 Route /api/dashboard/stats appelée');
    try {
        const stats = {};
        
        // Vérifier la connexion à la base de données
        try {
            await pool.execute('SELECT 1');
            console.log('✅ Connexion DB OK');
        } catch (dbError) {
            console.error('❌ Erreur de connexion DB:', dbError.message);
            return res.status(500).json({ error: 'Erreur de connexion à la base de données: ' + dbError.message });
        }

        // Nombre de RFQ
        const [rfqCount] = await pool.execute('SELECT COUNT(*) as total FROM rfq');
        stats.rfq_total = rfqCount[0].total;

        // RFQ par statut
        const [rfqEnCours] = await pool.execute("SELECT COUNT(*) as total FROM rfq WHERE statut = 'en_cours'");
        stats.rfq_en_cours = rfqEnCours[0].total;
        const [rfqBrouillon] = await pool.execute("SELECT COUNT(*) as total FROM rfq WHERE statut = 'brouillon'");
        stats.rfq_brouillon = rfqBrouillon[0].total;
        const [rfqCloture] = await pool.execute("SELECT COUNT(*) as total FROM rfq WHERE statut = 'cloture'");
        stats.rfq_cloture = rfqCloture[0].total;

        // Nombre de devis
        const [devisCount] = await pool.execute('SELECT COUNT(*) as total FROM devis');
        stats.devis_total = devisCount[0].total;
        const [devisEnvoye] = await pool.execute("SELECT COUNT(*) as total FROM devis WHERE statut = 'envoye'");
        stats.devis_envoye = devisEnvoye[0].total;
        const [devisAccepte] = await pool.execute("SELECT COUNT(*) as total FROM devis WHERE statut = 'accepte'");
        stats.devis_accepte = devisAccepte[0].total;

        // Nombre de commandes
        const [commandesCount] = await pool.execute('SELECT COUNT(*) as total FROM commandes');
        stats.commandes_total = commandesCount[0].total;

        // Commandes en attente
        const [commandesAttente] = await pool.execute("SELECT COUNT(*) as total FROM commandes WHERE statut = 'envoye'");
        stats.commandes_attente = commandesAttente[0].total;

        // Factures en attente de paiement
        const [facturesAttente] = await pool.execute("SELECT COUNT(*) as total, SUM(reste_a_payer) as montant FROM factures WHERE statut = 'en_attente' OR statut = 'partiellement_payee'");
        stats.factures_attente = facturesAttente[0].total;
        stats.montant_attente = parseFloat(facturesAttente[0].montant || 0);

        // Fournisseurs actifs (compatible MySQL et PostgreSQL)
        const [fournisseurs] = await pool.execute("SELECT COUNT(*) as total FROM entreprises WHERE type_entreprise = 'fournisseur' AND actif = ?", [true]);
        stats.fournisseurs_actifs = fournisseurs[0].total;

        // Clients actifs (compatible MySQL et PostgreSQL)
        const [clients] = await pool.execute("SELECT COUNT(*) as total FROM entreprises WHERE type_entreprise = 'client' AND actif = ?", [true]);
        stats.clients_actifs = clients[0].total;

        // Produits
        const [produitsCount] = await pool.execute('SELECT COUNT(*) as total FROM produits');
        stats.produits_total = produitsCount[0].total;

        // Commandes du mois (PostgreSQL)
        const [commandesMois] = await pool.execute(
            "SELECT COUNT(*) as total, SUM(total_ttc) as montant FROM commandes WHERE EXTRACT(MONTH FROM date_commande) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM date_commande) = EXTRACT(YEAR FROM CURRENT_DATE)"
        );
        stats.commandes_mois = commandesMois[0].total;
        stats.montant_mois = parseFloat(commandesMois[0].montant || 0);

        // Commandes du mois dernier (pour comparaison) - PostgreSQL
        const [commandesMoisDernier] = await pool.execute(
            "SELECT COUNT(*) as total, SUM(total_ttc) as montant FROM commandes WHERE EXTRACT(MONTH FROM date_commande) = EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL '1 month') AND EXTRACT(YEAR FROM date_commande) = EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '1 month')"
        );
        stats.commandes_mois_dernier = commandesMoisDernier[0].total;
        stats.montant_mois_dernier = parseFloat(commandesMoisDernier[0].montant || 0);

        // Évolution des commandes (6 derniers mois) - PostgreSQL
        const [commandesEvolution] = await pool.execute(`
            SELECT 
                TO_CHAR(date_commande, 'YYYY-MM') as mois,
                COUNT(*) as nombre,
                SUM(total_ttc) as montant
            FROM commandes
            WHERE date_commande >= CURRENT_DATE - INTERVAL '6 months'
            GROUP BY TO_CHAR(date_commande, 'YYYY-MM')
            ORDER BY mois ASC
        `);
        stats.evolution_commandes = commandesEvolution;

        // Répartition des RFQ par statut
        const [rfqParStatut] = await pool.execute(`
            SELECT statut, COUNT(*) as nombre
            FROM rfq
            GROUP BY statut
        `);
        stats.rfq_par_statut = rfqParStatut;

        // Top 5 fournisseurs (par nombre de commandes) - Compatible MySQL et PostgreSQL
        const [topFournisseurs] = await pool.execute(`
            SELECT e.id, e.nom, COUNT(c.id) as nb_commandes, SUM(c.total_ttc) as montant_total
            FROM entreprises e
            LEFT JOIN commandes c ON e.id = c.fournisseur_id
            WHERE e.type_entreprise = 'fournisseur' AND e.actif = ?
            GROUP BY e.id, e.nom
            ORDER BY nb_commandes DESC, montant_total DESC
            LIMIT 5
        `, [true]);
        stats.top_fournisseurs = topFournisseurs;

        // Demandes de devis
        const [demandesDevisCount] = await pool.execute('SELECT COUNT(*) as total FROM demandes_devis');
        stats.demandes_devis_total = demandesDevisCount[0].total;
        
        const [demandesNouvelles] = await pool.execute("SELECT COUNT(*) as total FROM demandes_devis WHERE statut = 'nouvelle'");
        stats.demandes_devis_nouvelles = demandesNouvelles[0].total;
        
        const [demandesEnCours] = await pool.execute("SELECT COUNT(*) as total FROM demandes_devis WHERE statut = 'en_cours'");
        stats.demandes_devis_en_cours = demandesEnCours[0].total;
        
        const [demandesTraitees] = await pool.execute("SELECT COUNT(*) as total FROM demandes_devis WHERE statut = 'traitee'");
        stats.demandes_devis_traitees = demandesTraitees[0].total;

        // Messages de contact (notifications de type message_contact) - PostgreSQL
        const [messagesContact] = await pool.execute(`
            SELECT COUNT(*) as total 
            FROM notifications 
            WHERE type_notification = 'message_contact' 
            AND DATE(date_creation) >= CURRENT_DATE - INTERVAL '30 days'
        `);
        stats.messages_contact_30j = messagesContact[0].total;

        // Top catégories les plus demandées (basé sur les RFQ) - PostgreSQL
        const [topCategories] = await pool.execute(`
            SELECT 
                c.libelle as nom,
                COUNT(r.id) as valeur
            FROM categories c
            INNER JOIN rfq r ON r.categorie_id = c.id
            WHERE c.actif = true
            GROUP BY c.id, c.libelle
            ORDER BY valeur DESC
            LIMIT 5
        `);
        stats.top_categories = topCategories;

        // Top secteurs les plus sollicités (basé sur les entreprises fournisseurs) - PostgreSQL
        const [topSecteurs] = await pool.execute(`
            SELECT 
                COALESCE(e.secteur_activite, 'Non spécifié') as nom,
                COUNT(DISTINCT e.id) as valeur
            FROM entreprises e
            WHERE e.type_entreprise = 'fournisseur' 
            AND e.actif = true
            AND e.secteur_activite IS NOT NULL
            GROUP BY e.secteur_activite
            ORDER BY valeur DESC
            LIMIT 5
        `);
        stats.top_secteurs = topSecteurs;

        // Log des statistiques pour débogage
        console.log('📊 Statistiques calculées:', {
            commandes_total: stats.commandes_total,
            montant_mois: stats.montant_mois,
            rfq_en_cours: stats.rfq_en_cours,
            fournisseurs_actifs: stats.fournisseurs_actifs,
            evolution_commandes_count: stats.evolution_commandes?.length || 0,
            rfq_par_statut_count: stats.rfq_par_statut?.length || 0,
            top_categories_count: stats.top_categories?.length || 0,
            top_secteurs_count: stats.top_secteurs?.length || 0
        });

        res.json(stats);
    } catch (error) {
        console.error('❌ Erreur dans /api/dashboard/stats:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

