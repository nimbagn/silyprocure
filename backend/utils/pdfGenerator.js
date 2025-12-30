const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Génère un PDF pour une RFQ
 */
async function generateRFQPDF(rfq, outputPath) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            const stream = fs.createWriteStream(outputPath);
            doc.pipe(stream);

            // En-tête
            doc.fontSize(20).text('DEMANDE DE DEVIS (RFQ)', { align: 'center' });
            doc.moveDown();
            
            // Informations RFQ
            doc.fontSize(12);
            doc.text(`Numéro: ${rfq.numero || 'N/A'}`, { continued: false });
            doc.text(`Date d'émission: ${rfq.date_emission ? new Date(rfq.date_emission).toLocaleDateString('fr-FR') : 'N/A'}`);
            doc.text(`Date limite de réponse: ${rfq.date_limite_reponse ? new Date(rfq.date_limite_reponse).toLocaleDateString('fr-FR') : 'N/A'}`);
            doc.moveDown();

            // Émetteur et destinataire
            if (rfq.emetteur_nom) {
                doc.text(`Émetteur: ${rfq.emetteur_nom}`, { continued: false });
            }
            if (rfq.destinataire_nom) {
                doc.text(`Destinataire: ${rfq.destinataire_nom}`, { continued: false });
            }
            doc.moveDown();

            // Description
            if (rfq.description) {
                doc.fontSize(14).text('Description:', { continued: false });
                doc.fontSize(11).text(rfq.description);
                doc.moveDown();
            }

            // Lignes
            if (rfq.lignes && rfq.lignes.length > 0) {
                doc.fontSize(14).text('Articles demandés:', { continued: false });
                doc.moveDown(0.5);

                // Tableau
                const tableTop = doc.y;
                const itemHeight = 20;
                let y = tableTop;

                // En-tête du tableau
                doc.fontSize(10).font('Helvetica-Bold');
                doc.text('Réf.', 50, y);
                doc.text('Description', 120, y);
                doc.text('Qté', 400, y);
                doc.text('Unité', 450, y);
                y += itemHeight;

                // Lignes
                doc.font('Helvetica');
                rfq.lignes.forEach((ligne, index) => {
                    if (y > 700) { // Nouvelle page si nécessaire
                        doc.addPage();
                        y = 50;
                    }
                    doc.text(ligne.reference || '-', 50, y);
                    doc.text(ligne.description || '-', 120, y, { width: 270 });
                    doc.text(String(ligne.quantite || 0), 400, y);
                    doc.text(ligne.unite || 'unité', 450, y);
                    y += itemHeight;
                });
            }

            // Conditions
            if (rfq.conditions_paiement) {
                doc.moveDown();
                doc.fontSize(12).text('Conditions de paiement:', { continued: false });
                doc.fontSize(10).text(rfq.conditions_paiement);
            }

            // Pied de page
            doc.fontSize(8)
               .text('Document généré par SilyProcure', 50, doc.page.height - 50, { align: 'center' });

            doc.end();
            stream.on('finish', () => resolve(outputPath));
            stream.on('error', reject);
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Génère un PDF pour un Devis
 */
async function generateDevisPDF(devis, outputPath) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            const stream = fs.createWriteStream(outputPath);
            doc.pipe(stream);

            // En-tête
            doc.fontSize(20).text('DEVIS', { align: 'center' });
            doc.moveDown();
            
            // Informations
            doc.fontSize(12);
            doc.text(`Numéro: ${devis.numero || 'N/A'}`, { continued: false });
            doc.text(`Date: ${devis.date_devis ? new Date(devis.date_devis).toLocaleDateString('fr-FR') : 'N/A'}`);
            doc.text(`Date de validité: ${devis.date_validite ? new Date(devis.date_validite).toLocaleDateString('fr-FR') : 'N/A'}`);
            doc.moveDown();

            // Lignes avec totaux
            if (devis.lignes && devis.lignes.length > 0) {
                const tableTop = doc.y;
                let y = tableTop;
                const itemHeight = 20;

                // En-tête
                doc.fontSize(10).font('Helvetica-Bold');
                doc.text('Réf.', 50, y);
                doc.text('Description', 120, y);
                doc.text('Qté', 350, y);
                doc.text('Prix HT', 400, y);
                doc.text('Total HT', 480, y);
                y += itemHeight;

                // Lignes
                doc.font('Helvetica');
                let totalHT = 0;
                devis.lignes.forEach((ligne) => {
                    if (y > 700) {
                        doc.addPage();
                        y = 50;
                    }
                    const ligneTotal = (ligne.prix_unitaire_ht || 0) * (ligne.quantite || 0);
                    totalHT += ligneTotal;
                    
                    doc.text(ligne.reference || '-', 50, y);
                    doc.text(ligne.description || '-', 120, y, { width: 220 });
                    doc.text(String(ligne.quantite || 0), 350, y);
                    doc.text(formatCurrency(ligne.prix_unitaire_ht || 0), 400, y);
                    doc.text(formatCurrency(ligneTotal), 480, y);
                    y += itemHeight;
                });

                // Totaux
                y += 10;
                doc.font('Helvetica-Bold');
                const tva = totalHT * (devis.tva_taux || 0) / 100;
                const totalTTC = totalHT + tva;

                doc.text('Total HT:', 400, y);
                doc.text(formatCurrency(totalHT), 480, y);
                y += itemHeight;
                
                doc.text(`TVA (${devis.tva_taux || 0}%):`, 400, y);
                doc.text(formatCurrency(tva), 480, y);
                y += itemHeight;
                
                doc.fontSize(12);
                doc.text('Total TTC:', 400, y);
                doc.text(formatCurrency(totalTTC), 480, y);
            }

            // Pied de page
            doc.fontSize(8)
               .text('Document généré par SilyProcure', 50, doc.page.height - 50, { align: 'center' });

            doc.end();
            stream.on('finish', () => resolve(outputPath));
            stream.on('error', reject);
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Génère un PDF pour une Commande
 */
async function generateCommandePDF(commande, outputPath) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            const stream = fs.createWriteStream(outputPath);
            doc.pipe(stream);

            // En-tête
            doc.fontSize(20).text('BON DE COMMANDE', { align: 'center' });
            doc.moveDown();
            
            // Informations
            doc.fontSize(12);
            doc.text(`Numéro: ${commande.numero || 'N/A'}`, { continued: false });
            doc.text(`Date: ${commande.date_commande ? new Date(commande.date_commande).toLocaleDateString('fr-FR') : 'N/A'}`);
            doc.text(`Date livraison prévue: ${commande.date_livraison_prevue ? new Date(commande.date_livraison_prevue).toLocaleDateString('fr-FR') : 'N/A'}`);
            doc.moveDown();

            // Fournisseur
            if (commande.fournisseur_nom) {
                doc.text(`Fournisseur: ${commande.fournisseur_nom}`, { continued: false });
            }

            // Lignes
            if (commande.lignes && commande.lignes.length > 0) {
                doc.moveDown();
                const tableTop = doc.y;
                let y = tableTop;
                const itemHeight = 20;

                // En-tête
                doc.fontSize(10).font('Helvetica-Bold');
                doc.text('Réf.', 50, y);
                doc.text('Description', 120, y);
                doc.text('Qté', 350, y);
                doc.text('Prix HT', 400, y);
                doc.text('Total HT', 480, y);
                y += itemHeight;

                // Lignes
                doc.font('Helvetica');
                commande.lignes.forEach((ligne) => {
                    if (y > 700) {
                        doc.addPage();
                        y = 50;
                    }
                    const ligneTotal = (ligne.prix_unitaire_ht || 0) * (ligne.quantite || 0);
                    
                    doc.text(ligne.reference || '-', 50, y);
                    doc.text(ligne.description || '-', 120, y, { width: 220 });
                    doc.text(String(ligne.quantite || 0), 350, y);
                    doc.text(formatCurrency(ligne.prix_unitaire_ht || 0), 400, y);
                    doc.text(formatCurrency(ligneTotal), 480, y);
                    y += itemHeight;
                });

                // Totaux
                y += 10;
                doc.font('Helvetica-Bold');
                doc.text('Total HT:', 400, y);
                doc.text(formatCurrency(commande.total_ht || 0), 480, y);
                y += itemHeight;
                
                doc.text(`TVA (${commande.tva_taux || 0}%):`, 400, y);
                doc.text(formatCurrency(commande.total_tva || 0), 480, y);
                y += itemHeight;
                
                doc.fontSize(12);
                doc.text('Total TTC:', 400, y);
                doc.text(formatCurrency(commande.total_ttc || 0), 480, y);
            }

            // Pied de page
            doc.fontSize(8)
               .text('Document généré par SilyProcure', 50, doc.page.height - 50, { align: 'center' });

            doc.end();
            stream.on('finish', () => resolve(outputPath));
            stream.on('error', reject);
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Génère un PDF pour une Facture (sans afficher les prix d'achat ni la marge)
 */
async function generateFacturePDF(facture, outputPath) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            const stream = fs.createWriteStream(outputPath);
            doc.pipe(stream);

            // En-tête
            doc.fontSize(20).text('FACTURE', { align: 'center' });
            doc.moveDown();
            
            // Informations facture
            doc.fontSize(12);
            doc.text(`Numéro: ${facture.numero || 'N/A'}`, { continued: false });
            doc.text(`Date d'émission: ${facture.date_emission ? new Date(facture.date_emission).toLocaleDateString('fr-FR') : 'N/A'}`);
            if (facture.date_echeance) {
                doc.text(`Date d'échéance: ${new Date(facture.date_echeance).toLocaleDateString('fr-FR')}`);
            }
            doc.moveDown();

            // Facturier et client
            if (facture.facturier_nom) {
                doc.fontSize(14).text('Facturier:', { continued: false });
                doc.fontSize(11).text(facture.facturier_nom);
            }
            if (facture.client_nom) {
                doc.fontSize(14).text('Client:', { continued: false });
                doc.fontSize(11).text(facture.client_nom);
            }
            doc.moveDown();

            // Lignes (SANS prix d'achat ni marge - visible uniquement par le client)
            if (facture.lignes && facture.lignes.length > 0) {
                doc.fontSize(14).text('Articles:', { continued: false });
                doc.moveDown(0.5);

                // Tableau
                const tableTop = doc.y;
                const itemHeight = 20;
                let y = tableTop;

                // En-tête du tableau
                doc.fontSize(10).font('Helvetica-Bold');
                doc.text('Réf.', 50, y);
                doc.text('Description', 120, y);
                doc.text('Qté', 300, y);
                doc.text('Unité', 350, y);
                doc.text('Prix unit. HT', 400, y, { width: 80, align: 'right' });
                doc.text('Remise', 490, y, { width: 60, align: 'right' });
                doc.text('TVA', 560, y, { width: 50, align: 'right' });
                doc.text('Total HT', 520, y, { width: 80, align: 'right' });
                y += itemHeight;

                // Lignes
                doc.font('Helvetica');
                facture.lignes.forEach((ligne) => {
                    if (y > 700) { // Nouvelle page si nécessaire
                        doc.addPage();
                        y = 50;
                        // Réafficher l'en-tête
                        doc.fontSize(10).font('Helvetica-Bold');
                        doc.text('Réf.', 50, y);
                        doc.text('Description', 120, y);
                        doc.text('Qté', 300, y);
                        doc.text('Unité', 350, y);
                        doc.text('Prix unit. HT', 400, y, { width: 80, align: 'right' });
                        doc.text('Remise', 490, y, { width: 60, align: 'right' });
                        doc.text('TVA', 560, y, { width: 50, align: 'right' });
                        doc.text('Total HT', 520, y, { width: 80, align: 'right' });
                        y += itemHeight;
                        doc.font('Helvetica');
                    }
                    
                    const prixUnitaire = parseFloat(ligne.prix_unitaire_ht || 0);
                    const quantite = parseFloat(ligne.quantite || 0);
                    const remise = parseFloat(ligne.remise || 0);
                    const tva = parseFloat(ligne.tva_taux || 20);
                    const montantHT = prixUnitaire * quantite * (1 - remise / 100);
                    
                    doc.text(ligne.reference || '-', 50, y);
                    doc.text(ligne.description || '-', 120, y, { width: 170 });
                    doc.text(String(quantite), 300, y);
                    doc.text(ligne.unite || 'unité', 350, y);
                    doc.text(formatCurrency(prixUnitaire), 400, y, { width: 80, align: 'right' });
                    doc.text(remise > 0 ? remise + '%' : '-', 490, y, { width: 60, align: 'right' });
                    doc.text(tva + '%', 560, y, { width: 50, align: 'right' });
                    doc.text(formatCurrency(montantHT), 520, y, { width: 80, align: 'right' });
                    y += itemHeight;
                });
            }

            // Totaux
            doc.moveDown();
            const totalsY = doc.y;
            doc.fontSize(12).font('Helvetica-Bold');
            doc.text('Total HT:', 400, totalsY, { width: 100, align: 'right' });
            doc.text(formatCurrency(facture.total_ht || 0), 520, totalsY, { width: 80, align: 'right' });
            
            doc.text('TVA:', 400, totalsY + 20, { width: 100, align: 'right' });
            doc.text(formatCurrency(facture.total_tva || 0), 520, totalsY + 20, { width: 80, align: 'right' });
            
            doc.fontSize(14);
            doc.text('TOTAL TTC:', 400, totalsY + 45, { width: 100, align: 'right' });
            doc.text(formatCurrency(facture.total_ttc || 0), 520, totalsY + 45, { width: 80, align: 'right' });
            
            if (facture.reste_a_payer > 0) {
                doc.fontSize(12);
                doc.text('Reste à payer:', 400, totalsY + 70, { width: 100, align: 'right' });
                doc.text(formatCurrency(facture.reste_a_payer), 520, totalsY + 70, { width: 80, align: 'right' });
            }

            // Conditions de paiement
            if (facture.conditions_paiement) {
                doc.moveDown(2);
                doc.fontSize(12).font('Helvetica-Bold').text('Conditions de paiement:', { continued: false });
                doc.fontSize(10).font('Helvetica').text(facture.conditions_paiement);
            }
            if (facture.delai_paiement_jours) {
                doc.fontSize(10).text(`Délai de paiement: ${facture.delai_paiement_jours} jours`);
            }
            if (facture.mode_paiement) {
                doc.fontSize(10).text(`Mode de paiement: ${facture.mode_paiement}`);
            }

            // Pied de page
            doc.fontSize(8)
               .text('Document généré par SilyProcure', 50, doc.page.height - 50, { align: 'center' });

            doc.end();
            stream.on('finish', () => resolve(outputPath));
            stream.on('error', reject);
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Formatage de la monnaie en GNF
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount) + ' GNF';
}

module.exports = {
    generateRFQPDF,
    generateDevisPDF,
    generateCommandePDF,
    generateFacturePDF
};

