const { body, param, query, validationResult } = require('express-validator');

// Middleware pour gérer les erreurs de validation
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Erreur de validation',
            details: errors.array()
        });
    }
    next();
};

// Validations pour RFQ
const validateRFQ = [
    body('date_emission').optional().isISO8601().withMessage('Date d\'émission invalide'),
    body('date_limite_reponse').optional().isISO8601().withMessage('Date limite de réponse invalide'),
    body('destinataire_id').optional().custom((value) => {
        if (value === null || value === undefined || value === '') return true;
        const num = parseInt(value);
        if (isNaN(num) || num < 1) throw new Error('ID destinataire invalide');
        return true;
    }).withMessage('ID destinataire invalide'),
    body('description').optional().isString().trim().isLength({ max: 2000 }).withMessage('Description trop longue (max 2000 caractères)'),
    body('categorie_id').optional().custom((value) => {
        if (value === null || value === undefined || value === '') return true;
        const num = parseInt(value);
        if (isNaN(num) || num < 1) throw new Error('ID catégorie invalide');
        return true;
    }).withMessage('ID catégorie invalide'),
    body('date_livraison_souhaitee').optional().isISO8601().withMessage('Date de livraison invalide'),
    body('lieu_livraison_id').optional().custom((value) => {
        if (value === null || value === undefined || value === '') return true;
        const num = parseInt(value);
        if (isNaN(num) || num < 1) throw new Error('ID lieu de livraison invalide');
        return true;
    }).withMessage('ID lieu de livraison invalide'),
    body('projet_id').optional().custom((value) => {
        if (value === null || value === undefined || value === '') return true;
        const num = parseInt(value);
        if (isNaN(num) || num < 1) throw new Error('ID projet invalide');
        return true;
    }).withMessage('ID projet invalide'),
    body('centre_cout_id').optional().custom((value) => {
        if (value === null || value === undefined || value === '') return true;
        const num = parseInt(value);
        if (isNaN(num) || num < 1) throw new Error('ID centre de coût invalide');
        return true;
    }).withMessage('ID centre de coût invalide'),
    handleValidationErrors
];

// Validations pour Entreprises
const validateEntreprise = [
    body('nom').notEmpty().withMessage('Le nom est obligatoire').trim().isLength({ min: 2, max: 255 }).withMessage('Le nom doit contenir entre 2 et 255 caractères'),
    body('raison_sociale').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 255 }).withMessage('Raison sociale trop longue'),
    body('rccm').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 50 }).withMessage('RCCM trop long'),
    body('numero_contribuable').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 50 }).withMessage('Numéro contribuable trop long'),
    body('capital_social').optional({ nullable: true, checkFalsy: true }).custom((value) => {
        if (value === null || value === undefined || value === '' || value === 'null') return true;
        const num = parseFloat(value);
        if (isNaN(num) || num < 0) throw new Error('Capital social invalide');
        return true;
    }).withMessage('Capital social invalide'),
    body('email').optional({ nullable: true, checkFalsy: true }).isEmail().withMessage('Email invalide'),
    body('telephone').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 20 }).withMessage('Téléphone trop long'),
    body('type_entreprise').notEmpty().withMessage('Le type d\'entreprise est obligatoire').isIn(['acheteur', 'fournisseur', 'client', 'transporteur']).withMessage('Type d\'entreprise invalide'),
    body('forme_juridique').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 50 }).withMessage('Forme juridique trop longue'),
    body('secteur_activite').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 100 }).withMessage('Secteur d\'activité trop long'),
    body('siret').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 14 }).withMessage('SIRET trop long'),
    body('tva_intracommunautaire').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 20 }).withMessage('TVA intracommunautaire trop longue'),
    body('site_web').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 255 }).withMessage('Site web trop long'),
    body('notes').optional({ nullable: true, checkFalsy: true }).trim(),
    handleValidationErrors
];

// Validations pour Produits
const validateProduit = [
    body('reference').notEmpty().withMessage('La référence est obligatoire').trim().isLength({ min: 1, max: 100 }).withMessage('Référence invalide'),
    body('libelle').notEmpty().withMessage('Le libellé est obligatoire').trim().isLength({ min: 2, max: 255 }).withMessage('Libellé invalide'),
    body('categorie_id').custom((value) => {
        const num = parseInt(value);
        if (isNaN(num) || num < 1) {
            throw new Error('Catégorie invalide');
        }
        return true;
    }).withMessage('Catégorie invalide'),
    body('fournisseur_id').optional().custom((value) => {
        if (value === null || value === undefined || value === '') return true;
        const num = parseInt(value);
        if (isNaN(num) || num < 1) {
            throw new Error('ID fournisseur invalide');
        }
        return true;
    }).withMessage('ID fournisseur invalide'),
    body('prix_unitaire_ht').custom((value) => {
        const num = parseFloat(value);
        if (isNaN(num) || num < 0) {
            throw new Error('Le prix unitaire doit être un nombre positif');
        }
        return true;
    }).withMessage('Le prix unitaire doit être un nombre positif'),
    body('unite').optional().trim().isLength({ max: 20 }).withMessage('Unité trop longue'),
    body('stock_disponible').optional().custom((value) => {
        if (value === null || value === undefined || value === '') {
            return true; // NULL est accepté
        }
        const num = parseInt(value);
        if (isNaN(num) || num < 0) {
            throw new Error('Stock invalide');
        }
        return true;
    }).withMessage('Stock invalide'),
    body('tva_taux').optional().custom((value) => {
        if (value === null || value === undefined || value === '') {
            return true; // Optionnel
        }
        const num = parseFloat(value);
        if (isNaN(num) || num < 0 || num > 100) {
            throw new Error('Taux TVA invalide (0-100%)');
        }
        return true;
    }).withMessage('Taux TVA invalide (0-100%)'),
    handleValidationErrors
];

// Validations pour Devis
const validateDevis = [
    body('rfq_id').optional().custom((value) => {
        if (value === null || value === undefined || value === '') return true;
        const num = parseInt(value);
        if (isNaN(num) || num < 1) throw new Error('ID RFQ invalide');
        return true;
    }).withMessage('ID RFQ invalide'),
    body('fournisseur_id').optional().custom((value) => {
        if (value === null || value === undefined || value === '') return true;
        const num = parseInt(value);
        if (isNaN(num) || num < 1) throw new Error('ID fournisseur invalide');
        return true;
    }).withMessage('ID fournisseur invalide'),
    body('date_emission').optional().isISO8601().withMessage('Date d\'émission invalide'),
    body('date_validite').optional().isISO8601().withMessage('Date validité invalide'),
    body('remise_globale').optional().custom((value) => {
        if (value === null || value === undefined || value === '') return true;
        const num = parseFloat(value);
        if (isNaN(num) || num < 0 || num > 100) throw new Error('Remise globale invalide (0-100%)');
        return true;
    }).withMessage('Remise globale invalide (0-100%)'),
    body('delai_livraison').optional().custom((value) => {
        if (value === null || value === undefined || value === '') return true;
        const num = parseInt(value);
        if (isNaN(num) || num < 0) throw new Error('Délai de livraison invalide');
        return true;
    }).withMessage('Délai de livraison invalide'),
    handleValidationErrors
];

// Validations pour Commandes
const validateCommande = [
    body('fournisseur_id').custom((value) => {
        const num = parseInt(value);
        if (isNaN(num) || num < 1) throw new Error('ID fournisseur invalide');
        return true;
    }).withMessage('ID fournisseur invalide'),
    body('date_commande').optional().isISO8601().withMessage('Date commande invalide'),
    body('date_livraison_souhaitee').optional().isISO8601().withMessage('Date livraison invalide'),
    body('devis_id').optional().custom((value) => {
        if (value === null || value === undefined || value === '') return true;
        const num = parseInt(value);
        if (isNaN(num) || num < 1) throw new Error('ID devis invalide');
        return true;
    }).withMessage('ID devis invalide'),
    body('rfq_id').optional().custom((value) => {
        if (value === null || value === undefined || value === '') return true;
        const num = parseInt(value);
        if (isNaN(num) || num < 1) throw new Error('ID RFQ invalide');
        return true;
    }).withMessage('ID RFQ invalide'),
    body('adresse_livraison_id').optional().custom((value) => {
        if (value === null || value === undefined || value === '') return true;
        const num = parseInt(value);
        if (isNaN(num) || num < 1) throw new Error('ID adresse de livraison invalide');
        return true;
    }).withMessage('ID adresse de livraison invalide'),
    handleValidationErrors
];

// Validations pour Adresses
const validateAdresse = [
    body('entreprise_id').custom((value) => {
        const num = parseInt(value);
        if (isNaN(num) || num < 1) throw new Error('ID entreprise invalide');
        return true;
    }).withMessage('ID entreprise invalide'),
    body('type_adresse').isIn(['facturation', 'livraison', 'siège', 'autre']).withMessage('Type d\'adresse invalide'),
    body('adresse_ligne1').optional().trim().isLength({ max: 255 }).withMessage('Adresse ligne 1 trop longue'),
    body('adresse_ligne2').optional().trim().isLength({ max: 255 }).withMessage('Adresse ligne 2 trop longue'),
    body('code_postal').optional().trim().isLength({ max: 20 }).withMessage('Code postal trop long'),
    body('ville').optional().trim().isLength({ max: 100 }).withMessage('Ville trop longue'),
    body('pays').optional().trim().isLength({ max: 100 }).withMessage('Pays trop long'),
    body('latitude').optional().custom((value) => {
        if (value === null || value === undefined || value === '') return true;
        const num = parseFloat(String(value).replace(',', '.'));
        if (isNaN(num) || num < -90 || num > 90) throw new Error('Latitude invalide (-90 à 90)');
        return true;
    }).withMessage('Latitude invalide'),
    body('longitude').optional().custom((value) => {
        if (value === null || value === undefined || value === '') return true;
        const num = parseFloat(String(value).replace(',', '.'));
        if (isNaN(num) || num < -180 || num > 180) throw new Error('Longitude invalide (-180 à 180)');
        return true;
    }).withMessage('Longitude invalide'),
    handleValidationErrors
];

// Validations pour Factures
const validateFacture = [
    body('commande_id').custom((value) => {
        const num = parseInt(value);
        if (isNaN(num) || num < 1) throw new Error('ID commande invalide');
        return true;
    }).withMessage('ID commande invalide'),
    body('date_facture').optional().isISO8601().withMessage('Date facture invalide'),
    body('date_echeance').optional().isISO8601().withMessage('Date échéance invalide'),
    body('numero_facture').optional().trim().isLength({ max: 100 }).withMessage('Numéro de facture trop long'),
    handleValidationErrors
];

// Validation pour login
const validateLogin = [
    body('email').isEmail().withMessage('Email invalide'),
    body('mot_de_passe').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
    handleValidationErrors
];

// Validations pour paramètres d'ID
const validateId = [
    param('id').isInt({ min: 1 }).withMessage('ID invalide'),
    handleValidationErrors
];

// Validation pour commande_id
const validateCommandeId = [
    param('commande_id').isInt({ min: 1 }).withMessage('ID commande invalide'),
    handleValidationErrors
];

// Validation pour ID fournisseur
const validateFournisseurId = [
    param('fournisseur_id').custom((value) => {
        const num = parseInt(value);
        if (isNaN(num) || num < 1) throw new Error('ID fournisseur invalide');
        return true;
    }).withMessage('ID fournisseur invalide'),
    handleValidationErrors
];

// Validations pour pagination
const validatePagination = [
    query('page').optional().isInt({ min: 1 }).withMessage('Page invalide'),
    query('limit').optional().custom((value) => {
        const num = parseInt(value);
        if (isNaN(num) || num < 1) throw new Error('Limit invalide (doit être un nombre positif)');
        if (num > 10000) throw new Error('Limit trop élevé (max 10000)');
        return true;
    }).withMessage('Limit invalide (1-10000)'),
    handleValidationErrors
];

module.exports = {
    validateRFQ,
    validateEntreprise,
    validateProduit,
    validateDevis,
    validateCommande,
    validateAdresse,
    validateFacture,
    validateLogin,
    validateId,
    validateCommandeId,
    validateFournisseurId,
    validatePagination,
    handleValidationErrors
};

