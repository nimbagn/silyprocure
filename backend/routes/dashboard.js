const express = require('express');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

router.use(authenticate);

// Statistiques du dashboard
router.get('/stats', async (req, res) => {
    try {
        const stats = {};

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

        // Fournisseurs actifs (utiliser TRUE pour PostgreSQL)
        const [fournisseurs] = await pool.execute("SELECT COUNT(*) as total FROM entreprises WHERE type_entreprise = 'fournisseur' AND actif = ?", [true]);
        stats.fournisseurs_actifs = fournisseurs[0].total;

        // Clients actifs (utiliser TRUE pour PostgreSQL)
        const [clients] = await pool.execute("SELECT COUNT(*) as total FROM entreprises WHERE type_entreprise = 'client' AND actif = ?", [true]);
        stats.clients_actifs = clients[0].total;

        // Produits
        const [produitsCount] = await pool.execute('SELECT COUNT(*) as total FROM produits');
        stats.produits_total = produitsCount[0].total;

        // Commandes du mois
        const [commandesMois] = await pool.execute(
            "SELECT COUNT(*) as total, SUM(total_ttc) as montant FROM commandes WHERE MONTH(date_commande) = MONTH(CURRENT_DATE()) AND YEAR(date_commande) = YEAR(CURRENT_DATE())"
        );
        stats.commandes_mois = commandesMois[0].total;
        stats.montant_mois = parseFloat(commandesMois[0].montant || 0);

        // Commandes du mois dernier (pour comparaison)
        const [commandesMoisDernier] = await pool.execute(
            "SELECT COUNT(*) as total, SUM(total_ttc) as montant FROM commandes WHERE MONTH(date_commande) = MONTH(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH)) AND YEAR(date_commande) = YEAR(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))"
        );
        stats.commandes_mois_dernier = commandesMoisDernier[0].total;
        stats.montant_mois_dernier = parseFloat(commandesMoisDernier[0].montant || 0);

        // Évolution des commandes (6 derniers mois)
        const [commandesEvolution] = await pool.execute(`
            SELECT 
                DATE_FORMAT(date_commande, '%Y-%m') as mois,
                COUNT(*) as nombre,
                SUM(total_ttc) as montant
            FROM commandes
            WHERE date_commande >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH)
            GROUP BY DATE_FORMAT(date_commande, '%Y-%m')
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

        // Top 5 fournisseurs (par nombre de commandes)
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

        // Messages de contact (notifications de type message_contact)
        const [messagesContact] = await pool.execute(`
            SELECT COUNT(*) as total 
            FROM notifications 
            WHERE type_notification = 'message_contact' 
            AND DATE(date_creation) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
        `);
        stats.messages_contact_30j = messagesContact[0].total;

        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

