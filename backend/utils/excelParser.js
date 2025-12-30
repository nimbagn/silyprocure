const XLSX = require('xlsx');
const pool = require('../config/database');

/**
 * Parse un fichier Excel et retourne les données
 * @param {string} filePath - Chemin du fichier Excel
 * @returns {Array} - Tableau d'objets avec les données
 */
function parseExcelFile(filePath) {
    try {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0]; // Prendre la première feuille
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);
        return data;
    } catch (error) {
        throw new Error(`Erreur lors de la lecture du fichier Excel: ${error.message}`);
    }
}

/**
 * Valide et transforme les données Excel en produits
 * @param {Array} excelData - Données brutes du fichier Excel
 * @param {number} fournisseurId - ID du fournisseur
 * @returns {Array} - Tableau de produits validés
 */
function validateAndTransformProducts(excelData, fournisseurId) {
    const produits = [];
    const errors = [];

    excelData.forEach((row, index) => {
        const ligne = index + 2; // +2 car ligne 1 = en-tête, index commence à 0

        // Mapping des colonnes possibles (flexible)
        const reference = row['Référence'] || row['Reference'] || row['REF'] || row['ref'] || row['référence'];
        const libelle = row['Libellé'] || row['Libelle'] || row['Nom'] || row['nom'] || row['Produit'] || row['produit'];
        const description = row['Description'] || row['description'] || row['Desc'] || row['desc'] || '';
        const prix = row['Prix'] || row['prix'] || row['Prix HT'] || row['Prix_HT'] || row['Prix HT (GNF)'] || row['Prix HT (GNF)'];
        const unite = row['Unité'] || row['Unite'] || row['unité'] || row['unite'] || row['Unité'] || 'unité';
        const tva = row['TVA'] || row['TVA (%)'] || row['TVA %'] || row['tva'] || 18;
        const categorie = row['Catégorie'] || row['Categorie'] || row['catégorie'] || row['categorie'] || row['Category'] || null;
        const referenceFournisseur = row['Réf. Fournisseur'] || row['Ref Fournisseur'] || row['Réf Fournisseur'] || reference;
        const disponible = row['Disponible'] !== undefined ? (row['Disponible'] === 'Oui' || row['Disponible'] === true || row['Disponible'] === 1) : true;
        const delaiLivraison = row['Délai (jours)'] || row['Delai (jours)'] || row['Délai'] || row['Delai'] || null;
        const quantiteMinimale = row['Qté Min'] || row['Qte Min'] || row['Quantité Min'] || row['Quantite Min'] || null;

        // Validation
        if (!reference) {
            errors.push(`Ligne ${ligne}: Référence manquante`);
            return;
        }

        if (!libelle) {
            errors.push(`Ligne ${ligne}: Libellé manquant`);
            return;
        }

        // Convertir le prix
        let prixNum = null;
        if (prix !== undefined && prix !== null && prix !== '') {
            prixNum = parseFloat(String(prix).replace(/[^\d.,]/g, '').replace(',', '.'));
            if (isNaN(prixNum) || prixNum < 0) {
                errors.push(`Ligne ${ligne}: Prix invalide (${prix})`);
                return;
            }
        }

        // Convertir TVA
        let tvaNum = 18;
        if (tva !== undefined && tva !== null && tva !== '') {
            tvaNum = parseFloat(String(tva).replace(/[^\d.,]/g, '').replace(',', '.'));
            if (isNaN(tvaNum) || tvaNum < 0 || tvaNum > 100) {
                tvaNum = 18; // Valeur par défaut
            }
        }

        // Convertir délai livraison
        let delaiNum = null;
        if (delaiLivraison !== undefined && delaiLivraison !== null && delaiLivraison !== '') {
            delaiNum = parseInt(delaiLivraison);
            if (isNaN(delaiNum) || delaiNum < 0) {
                delaiNum = null;
            }
        }

        // Convertir quantité minimale
        let qteMinNum = null;
        if (quantiteMinimale !== undefined && quantiteMinimale !== null && quantiteMinimale !== '') {
            qteMinNum = parseFloat(String(quantiteMinimale).replace(',', '.'));
            if (isNaN(qteMinNum) || qteMinNum < 0) {
                qteMinNum = null;
            }
        }

        produits.push({
            reference: String(reference).trim(),
            reference_fournisseur: referenceFournisseur ? String(referenceFournisseur).trim() : String(reference).trim(),
            libelle: String(libelle).trim(),
            description: description ? String(description).trim() : null,
            prix_fournisseur: prixNum,
            prix_unitaire_ht: prixNum, // Pour compatibilité
            unite: String(unite).trim() || 'unité',
            tva_taux: tvaNum,
            disponible: disponible,
            delai_livraison_jours: delaiNum,
            quantite_minimale: qteMinNum,
            categorie_nom: categorie ? String(categorie).trim() : null,
            ligne: ligne
        });
    });

    return { produits, errors };
}

/**
 * Importe les produits depuis Excel dans la base de données
 * @param {Array} produits - Tableau de produits validés
 * @param {number} fournisseurId - ID du fournisseur
 * @returns {Object} - Résultat avec succès et erreurs
 */
async function importProductsFromExcel(produits, fournisseurId) {
    const results = {
        success: 0,
        errors: [],
        skipped: 0
    };

    for (const produit of produits) {
        try {
            // Vérifier si la catégorie existe, sinon la créer ou utiliser NULL
            let categorieId = null;
            if (produit.categorie_nom) {
                const [categories] = await pool.execute(
                    'SELECT id FROM categories WHERE libelle = ? LIMIT 1',
                    [produit.categorie_nom]
                );
                
                if (categories.length > 0) {
                    categorieId = categories[0].id;
                } else {
                    // Créer la catégorie si elle n'existe pas
                    const [result] = await pool.execute(
                        'INSERT INTO categories (libelle, description, actif) VALUES (?, ?, TRUE)',
                        [produit.categorie_nom, `Catégorie créée automatiquement lors de l'import Excel`]
                    );
                    categorieId = result.insertId;
                }
            }

            // Vérifier si le produit existe déjà pour ce fournisseur
            const [existing] = await pool.execute(
                'SELECT id FROM produits WHERE fournisseur_id = ? AND reference = ?',
                [fournisseurId, produit.reference]
            );

            if (existing.length > 0) {
                // Mettre à jour le produit existant
                await pool.execute(
                    `UPDATE produits SET 
                        libelle = ?, description = ?, categorie_id = ?,
                        prix_fournisseur = ?, prix_unitaire_ht = ?,
                        unite = ?, tva_taux = ?, disponible = ?,
                        delai_livraison_jours = ?, quantite_minimale = ?,
                        reference_fournisseur = ?
                     WHERE id = ?`,
                    [
                        produit.libelle, produit.description, categorieId,
                        produit.prix_fournisseur, produit.prix_fournisseur,
                        produit.unite, produit.tva_taux, produit.disponible,
                        produit.delai_livraison_jours, produit.quantite_minimale,
                        produit.reference_fournisseur, existing[0].id
                    ]
                );
                results.success++;
            } else {
                // Créer un nouveau produit
                await pool.execute(
                    `INSERT INTO produits (
                        reference, reference_fournisseur, libelle, description,
                        categorie_id, fournisseur_id, prix_fournisseur, prix_unitaire_ht,
                        unite, tva_taux, disponible, delai_livraison_jours, quantite_minimale
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        produit.reference, produit.reference_fournisseur, produit.libelle, produit.description,
                        categorieId, fournisseurId, produit.prix_fournisseur, produit.prix_fournisseur,
                        produit.unite, produit.tva_taux, produit.disponible,
                        produit.delai_livraison_jours, produit.quantite_minimale
                    ]
                );
                results.success++;
            }
        } catch (error) {
            results.errors.push({
                ligne: produit.ligne,
                reference: produit.reference,
                error: error.message
            });
        }
    }

    return results;
}

module.exports = {
    parseExcelFile,
    validateAndTransformProducts,
    importProductsFromExcel
};

