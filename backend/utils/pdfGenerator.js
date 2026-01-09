const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Couleurs du thème (Bleu Hapag-Lloyd)
const COLORS = {
    primary: '#00387A',
    primaryDark: '#002855',
    primaryLight: '#0052A3',
    accent: '#FF6600',
    text: '#1F2937',
    textLight: '#6B7280',
    textLighter: '#9CA3AF',
    border: '#E5E7EB',
    background: '#F9FAFB',
    backgroundLight: '#F3F4F6',
    success: '#10B981',
    danger: '#EF4444',
    white: '#FFFFFF',
    black: '#000000',
    gray900: '#111827',
    gray800: '#1F2937',
    gray700: '#374151',
    gray600: '#4B5563',
    gray500: '#6B7280',
    gray400: '#9CA3AF',
    gray300: '#D1D5DB',
    gray200: '#E5E7EB',
    gray100: '#F3F4F6',
    gray50: '#F9FAFB'
};

// Dimensions A4 en points (1mm = 2.83465 points)
const A4_WIDTH = 595.28;  // 210mm
const A4_HEIGHT = 841.89; // 297mm
const MARGIN = 56.69;     // 20mm
const CONTENT_WIDTH = A4_WIDTH - (MARGIN * 2);

/**
 * Fonction utilitaire pour dessiner le logo (texte stylisé si pas d'image)
 */
function drawLogo(doc, startX = MARGIN, startY = MARGIN) {
    try {
        // Essayer de charger un logo PNG s'il existe
        const logoPath = path.join(__dirname, '../../logos/png/logo.png');
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, startX, startY, { width: 120, height: 40 });
            return startY + 50;
        }
    } catch (error) {
        console.log('Logo PNG non trouvé, utilisation du logo texte');
    }
    
    // Logo texte stylisé professionnel
    const logoY = startY;
    
    // Icône carrée avec "S"
    doc.rect(startX, logoY, 40, 40)
       .fillColor(COLORS.primary)
       .fill();
    
    doc.fontSize(24)
       .fillColor(COLORS.white)
       .font('Helvetica-Bold')
       .text('S', startX + 12, logoY + 8);
    
    // Texte "SilyProcure"
    doc.fontSize(20)
       .fillColor(COLORS.text)
       .font('Helvetica-Bold')
       .text('Sily', startX + 50, logoY, { continued: true });
    
    doc.fontSize(20)
       .fillColor(COLORS.primary)
       .font('Helvetica-Bold')
       .text('Procure', { continued: false });
    
    // Sous-titre
    doc.fontSize(8)
       .fillColor(COLORS.textLight)
       .font('Helvetica')
       .text('Système de gestion des achats', startX + 50, logoY + 25);
    
    return logoY + 50;
}

/**
 * Fonction pour dessiner l'en-tête d'entreprise
 */
function drawCompanyHeader(doc, startY) {
    const startX = MARGIN;
    let currentY = startY;
    
    // Informations entreprise
    doc.fontSize(9)
       .fillColor(COLORS.text)
       .font('Helvetica-Bold')
       .text('SilyProcure SA', startX, currentY);
    currentY += 12;
    
    doc.fontSize(8)
       .fillColor(COLORS.textLight)
       .font('Helvetica')
       .text('Immeuble Almamya, Kaloum', startX, currentY);
    currentY += 10;
    
    doc.text('Conakry, Guinée', startX, currentY);
    currentY += 10;
    
    doc.text('Tél: +224 600 00 00 00', startX, currentY);
    currentY += 10;
    
    doc.text('Email: contact@silyprocure.com', startX, currentY);
    currentY += 10;
    
    doc.text('RCCM: GN.TCC.2024.B.00000', startX, currentY);
    
    return currentY + 20;
}

/**
 * Fonction pour dessiner l'en-tête de document (titre + infos)
 */
function drawDocumentHeader(doc, title, subtitle, documentInfo, startY) {
    const rightX = A4_WIDTH - MARGIN - 200;
    let currentY = startY;
    
    // Titre du document (grand et discret)
    doc.fontSize(36)
       .fillColor(COLORS.gray200)
       .font('Helvetica-Bold')
       .text(title, rightX, currentY, { width: 200, align: 'right' });
    currentY += 45;
    
    // Informations du document
    if (documentInfo.numero) {
        doc.fontSize(8)
           .fillColor(COLORS.textLight)
           .font('Helvetica')
           .text('Numéro :', rightX, currentY, { width: 200, align: 'right' });
        doc.fontSize(9)
           .fillColor(COLORS.text)
           .font('Helvetica-Bold')
           .text(documentInfo.numero, rightX + 60, currentY, { width: 140, align: 'right' });
        currentY += 12;
    }
    
    if (documentInfo.date) {
        doc.fontSize(8)
           .fillColor(COLORS.textLight)
           .font('Helvetica')
           .text('Date :', rightX, currentY, { width: 200, align: 'right' });
        doc.fontSize(9)
           .fillColor(COLORS.text)
           .font('Helvetica-Bold')
           .text(documentInfo.date, rightX + 60, currentY, { width: 140, align: 'right' });
        currentY += 12;
    }
    
    if (documentInfo.dateEcheance) {
        doc.fontSize(8)
           .fillColor(COLORS.textLight)
           .font('Helvetica')
           .text('Échéance :', rightX, currentY, { width: 200, align: 'right' });
        doc.fontSize(9)
           .fillColor(COLORS.text)
           .font('Helvetica-Bold')
           .text(documentInfo.dateEcheance, rightX + 60, currentY, { width: 140, align: 'right' });
        currentY += 12;
    }
    
    if (documentInfo.dateValidite) {
        doc.fontSize(8)
           .fillColor(COLORS.textLight)
           .font('Helvetica')
           .text('Validité :', rightX, currentY, { width: 200, align: 'right' });
        doc.fontSize(9)
           .fillColor(COLORS.text)
           .font('Helvetica-Bold')
           .text(documentInfo.dateValidite, rightX + 60, currentY, { width: 140, align: 'right' });
        currentY += 12;
    }
    
    return currentY + 20;
}

/**
 * Fonction pour dessiner la section destinataire
 */
function drawRecipient(doc, recipientInfo, startY) {
    const rightX = A4_WIDTH - MARGIN - 200;
    let currentY = startY;
    
    // Label
    doc.fontSize(7)
       .fillColor(COLORS.textLighter)
       .font('Helvetica-Bold')
       .text('FACTURÉ À', rightX, currentY, { width: 200, align: 'right' });
    currentY += 12;
    
    // Nom
    doc.fontSize(12)
       .fillColor(COLORS.text)
       .font('Helvetica-Bold')
       .text(recipientInfo.nom || '-', rightX, currentY, { width: 200, align: 'right' });
    currentY += 12;
    
    // Détails
    if (recipientInfo.contact) {
        doc.fontSize(8)
           .fillColor(COLORS.textLight)
           .font('Helvetica')
           .text(`Attn: ${recipientInfo.contact}`, rightX, currentY, { width: 200, align: 'right' });
        currentY += 10;
    }
    
    if (recipientInfo.adresse) {
        doc.fontSize(8)
           .fillColor(COLORS.textLight)
           .font('Helvetica')
           .text(recipientInfo.adresse, rightX, currentY, { width: 200, align: 'right' });
        currentY += 10;
    }
    
    if (recipientInfo.ville) {
        doc.fontSize(8)
           .fillColor(COLORS.textLight)
           .font('Helvetica')
           .text(recipientInfo.ville, rightX, currentY, { width: 200, align: 'right' });
        currentY += 10;
    }
    
    // NIF n'est plus disponible directement, on peut l'omettre ou le récupérer depuis une autre source si nécessaire
    
    return currentY + 30;
}

/**
 * Fonction pour dessiner un tableau professionnel
 */
function drawTable(doc, startY, columns, rows, options = {}) {
    const { headerBackground = COLORS.gray900, headerTextColor = COLORS.white, 
            rowHeight = 25, alternateRowColor = COLORS.gray50 } = options;
    
    let y = startY;
    const tableWidth = CONTENT_WIDTH;
    const colWidths = columns.map(col => col.width);
    
    // En-tête du tableau avec fond sombre
    doc.rect(MARGIN, y, tableWidth, rowHeight)
       .fillColor(headerBackground)
       .fill();
    
    let x = MARGIN;
    columns.forEach((col, index) => {
        doc.fontSize(8)
           .fillColor(headerTextColor)
           .font('Helvetica-Bold')
           .text(col.label.toUpperCase(), x + 8, y + 8, { 
               width: colWidths[index] - 16, 
               align: col.align || 'left' 
           });
        x += colWidths[index];
    });
    
    y += rowHeight;
    
    // Lignes du tableau
    rows.forEach((row, rowIndex) => {
        // Couleur alternée
        if (rowIndex % 2 === 1) {
            doc.rect(MARGIN, y, tableWidth, rowHeight)
               .fillColor(alternateRowColor)
               .fill();
        }
        
        // Bordures
        doc.rect(MARGIN, y, tableWidth, rowHeight)
           .strokeColor(COLORS.border)
           .lineWidth(0.5)
           .stroke();
        
        // Contenu
        x = MARGIN;
        row.forEach((cell, cellIndex) => {
            doc.fontSize(9)
               .fillColor(COLORS.text)
               .font('Helvetica')
               .text(cell || '-', x + 8, y + 8, { 
                   width: colWidths[cellIndex] - 16, 
                   align: columns[cellIndex].align || 'left' 
               });
            x += colWidths[cellIndex];
        });
        
        y += rowHeight;
        
        // Nouvelle page si nécessaire
        if (y > A4_HEIGHT - 150) {
            doc.addPage();
            y = MARGIN + 50;
            
            // Réafficher l'en-tête
            x = MARGIN;
            doc.rect(MARGIN, y, tableWidth, rowHeight)
               .fillColor(headerBackground)
               .fill();
            
            columns.forEach((col, index) => {
                doc.fontSize(8)
                   .fillColor(headerTextColor)
                   .font('Helvetica-Bold')
                   .text(col.label.toUpperCase(), x + 8, y + 8, { 
                       width: colWidths[index] - 16, 
                       align: col.align || 'left' 
                   });
                x += colWidths[index];
            });
            y += rowHeight;
        }
    });
    
    return y;
}

/**
 * Fonction pour dessiner les totaux
 */
function drawTotals(doc, startY, totals, rightAlign = true) {
    const totalsX = rightAlign ? A4_WIDTH - MARGIN - 200 : MARGIN;
    const totalsWidth = 200;
    let currentY = startY;
    
    totals.forEach((total, index) => {
        const isLast = index === totals.length - 1;
        
        if (total.separator) {
            // Ligne de séparation
            doc.moveTo(totalsX, currentY)
               .lineTo(totalsX + totalsWidth, currentY)
               .strokeColor(COLORS.border)
               .lineWidth(0.5)
               .stroke();
            currentY += 8;
        } else {
            doc.fontSize(isLast ? 12 : 9)
               .fillColor(isLast ? COLORS.primary : COLORS.text)
               .font(isLast ? 'Helvetica-Bold' : 'Helvetica')
               .text(total.label, totalsX, currentY, { width: totalsWidth - 100, align: 'right' });
            
            doc.fontSize(isLast ? 14 : 9)
               .fillColor(isLast ? COLORS.primary : COLORS.text)
               .font(isLast ? 'Helvetica-Bold' : 'Helvetica')
               .text(total.value, totalsX + totalsWidth - 100, currentY, { width: 100, align: 'right' });
            
            currentY += isLast ? 20 : 15;
        }
    });
    
    return currentY;
}

/**
 * Fonction pour dessiner les notes et informations bancaires
 */
function drawFooterInfo(doc, startY, notes, bankInfo) {
    const colWidth = (CONTENT_WIDTH - 20) / 2;
    let currentY = startY;
    
    // Colonne gauche - Notes
    if (notes) {
        doc.rect(MARGIN, currentY, colWidth, 60)
           .fillColor(COLORS.gray50)
           .fill();
        
        doc.rect(MARGIN, currentY, colWidth, 60)
           .strokeColor(COLORS.border)
           .lineWidth(0.5)
           .stroke();
        
        doc.fontSize(7)
           .fillColor(COLORS.textLight)
           .font('Helvetica-Bold')
           .text('CONDITIONS & NOTES', MARGIN + 8, currentY + 8);
        
        doc.fontSize(8)
           .fillColor(COLORS.text)
           .font('Helvetica')
           .text(notes, MARGIN + 8, currentY + 20, { width: colWidth - 16, align: 'left' });
    }
    
    // Colonne droite - Informations bancaires
    if (bankInfo) {
        const rightX = MARGIN + colWidth + 20;
        doc.rect(rightX, currentY, colWidth, 60)
           .fillColor(COLORS.gray50)
           .fill();
        
        doc.rect(rightX, currentY, colWidth, 60)
           .strokeColor(COLORS.border)
           .lineWidth(0.5)
           .stroke();
        
        doc.fontSize(7)
           .fillColor(COLORS.textLight)
           .font('Helvetica-Bold')
           .text('INFORMATIONS BANCAIRES', rightX + 8, currentY + 8);
        
        let infoY = currentY + 20;
        if (bankInfo.banque) {
            doc.fontSize(8)
               .fillColor(COLORS.text)
               .font('Helvetica')
               .text(`Banque: ${bankInfo.banque}`, rightX + 8, infoY);
            infoY += 10;
        }
        if (bankInfo.titulaire) {
            doc.text(`Titulaire: ${bankInfo.titulaire}`, rightX + 8, infoY);
            infoY += 10;
        }
        if (bankInfo.iban) {
            doc.text(`IBAN: ${bankInfo.iban}`, rightX + 8, infoY);
            infoY += 10;
        }
        if (bankInfo.swift) {
            doc.text(`SWIFT: ${bankInfo.swift}`, rightX + 8, infoY);
        }
    }
    
    return currentY + 70;
}

/**
 * Fonction pour dessiner le pied de page
 */
function drawFooter(doc) {
    const footerY = A4_HEIGHT - MARGIN - 30;
    
    // Ligne de séparation
    doc.moveTo(MARGIN, footerY)
       .lineTo(A4_WIDTH - MARGIN, footerY)
       .strokeColor(COLORS.border)
       .lineWidth(0.5)
       .stroke();
    
    // Texte du pied de page
    doc.fontSize(7)
       .fillColor(COLORS.textLighter)
       .font('Helvetica')
       .text('SilyProcure SA - Société Anonyme au capital de 100 000 000 GNF - RCCM GN.TCC.2024.B.00000', 
             MARGIN, footerY + 5, { align: 'center', width: CONTENT_WIDTH });
    
    doc.text('Merci de votre confiance.', 
             MARGIN, footerY + 15, { align: 'center', width: CONTENT_WIDTH });
}

/**
 * Génère un PDF pour une RFQ
 */
async function generateRFQPDF(rfq, outputPath) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ 
                size: 'A4',
                margin: MARGIN,
                info: {
                    Title: `RFQ ${rfq.numero || rfq.id}`,
                    Author: 'SilyProcure',
                    Subject: 'Demande de Devis'
                }
            });
            const stream = fs.createWriteStream(outputPath);
            doc.pipe(stream);
            
            let currentY = MARGIN;
            
            // Logo et en-tête entreprise
            currentY = drawLogo(doc, MARGIN, currentY);
            currentY = drawCompanyHeader(doc, currentY);
            
            // En-tête document
            const dateEmission = rfq.date_emission ? new Date(rfq.date_emission).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            }) : 'N/A';
            
            const dateLimite = rfq.date_limite_reponse ? new Date(rfq.date_limite_reponse).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            }) : 'N/A';
            
            currentY = drawDocumentHeader(doc, 'DEMANDE DE DEVIS', 'RFQ', {
                numero: rfq.numero || 'N/A',
                date: dateEmission,
                dateEcheance: dateLimite
            }, currentY);
            
            currentY += 20;
            
            // Destinataire
            if (rfq.destinataire_nom) {
                currentY = drawRecipient(doc, {
                    nom: rfq.destinataire_nom,
                    contact: rfq.destinataire_contact || '',
                    adresse: rfq.destinataire_adresse || '',
                    ville: rfq.destinataire_ville || '',
                    nif: rfq.destinataire_nif || ''
                }, currentY);
            }
            
            // Description
            if (rfq.description) {
                doc.fontSize(10)
                   .fillColor(COLORS.text)
                   .font('Helvetica')
                   .text(rfq.description, MARGIN, currentY, { width: CONTENT_WIDTH, align: 'left' });
                currentY += 30;
            }
            
            // Tableau des articles
            if (rfq.lignes && rfq.lignes.length > 0) {
                const columns = [
                    { label: 'Description', width: 300, align: 'left' },
                    { label: 'Qté', width: 80, align: 'right' },
                    { label: 'Unité', width: 80, align: 'center' },
                    { label: 'Spécifications', width: 135, align: 'left' }
                ];
                
                const rows = rfq.lignes.map(ligne => [
                    ligne.description || '-',
                    String(ligne.quantite || 0),
                    ligne.unite || 'unité',
                    ligne.specifications || '-'
                ]);
                
                currentY = drawTable(doc, currentY, columns, rows);
                currentY += 20;
            }
            
            // Conditions de paiement
            if (rfq.conditions_paiement) {
                currentY = drawFooterInfo(doc, currentY, rfq.conditions_paiement, null);
            }
            
            // Pied de page
            drawFooter(doc);
            
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
            const doc = new PDFDocument({ 
                size: 'A4',
                margin: MARGIN,
                info: {
                    Title: `Devis ${devis.numero || devis.id}`,
                    Author: 'SilyProcure',
                    Subject: 'Devis'
                }
            });
            const stream = fs.createWriteStream(outputPath);
            doc.pipe(stream);
            
            let currentY = MARGIN;
            
            // Logo et en-tête entreprise
            currentY = drawLogo(doc, MARGIN, currentY);
            currentY = drawCompanyHeader(doc, currentY);
            
            // En-tête document
            const dateEmission = devis.date_emission ? new Date(devis.date_emission).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            }) : 'N/A';
            
            const dateValidite = devis.date_validite ? new Date(devis.date_validite).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            }) : null;
            
            currentY = drawDocumentHeader(doc, 'DEVIS', 'Quotation', {
                numero: devis.numero || 'N/A',
                date: dateEmission,
                dateValidite: dateValidite
            }, currentY);
            
            currentY += 20;
            
            // Destinataire (client ou fournisseur selon le contexte)
            // Pour un devis, le destinataire est généralement le client
            if (devis.client_nom || devis.fournisseur_nom) {
                currentY = drawRecipient(doc, {
                    nom: devis.client_nom || devis.fournisseur_nom || '-',
                    contact: devis.client_contact || devis.fournisseur_telephone || '',
                    adresse: devis.client_adresse || devis.fournisseur_adresse || '',
                    ville: devis.client_ville || devis.fournisseur_ville || '',
                    nif: devis.client_nif || devis.fournisseur_nif || ''
                }, currentY);
            }
            
            // Tableau des lignes
            if (devis.lignes && devis.lignes.length > 0) {
                const columns = [
                    { label: 'Description', width: 250, align: 'left' },
                    { label: 'Qté', width: 60, align: 'right' },
                    { label: 'Prix Unit. HT', width: 100, align: 'right' },
                    { label: 'Remise', width: 60, align: 'right' },
                    { label: 'Total HT', width: 125, align: 'right' }
                ];
                
                let totalHT = 0;
                const rows = devis.lignes.map(ligne => {
                    const prixUnitaire = parseFloat(ligne.prix_unitaire_ht || 0);
                    const quantite = parseFloat(ligne.quantite || 0);
                    const remise = parseFloat(ligne.remise || 0);
                    const ligneTotal = prixUnitaire * quantite * (1 - remise / 100);
                    totalHT += ligneTotal;
                    
                    return [
                        ligne.description || '-',
                        String(quantite),
                        formatCurrency(prixUnitaire),
                        remise > 0 ? remise + '%' : '-',
                        formatCurrency(ligneTotal)
                    ];
                });
                
                currentY = drawTable(doc, currentY, columns, rows);
                currentY += 20;
                
                // Totaux
                const tvaTaux = parseFloat(devis.tva_taux || 20);
                const tva = totalHT * tvaTaux / 100;
                const totalTTC = totalHT + tva;
                
                const totals = [
                    { label: 'Total HT', value: formatCurrency(totalHT) },
                    { label: `TVA (${tvaTaux}%)`, value: formatCurrency(tva) },
                    { separator: true },
                    { label: 'Net à Payer', value: formatCurrency(totalTTC) }
                ];
                
                currentY = drawTotals(doc, currentY, totals);
                currentY += 20;
            }
            
            // Conditions et garanties
            const notes = [];
            if (devis.conditions_paiement) {
                notes.push(`Conditions de paiement: ${devis.conditions_paiement}`);
            }
            if (devis.garanties) {
                notes.push(`Garanties: ${devis.garanties}`);
            }
            if (devis.delai_livraison) {
                notes.push(`Délai de livraison: ${devis.delai_livraison} jours`);
            }
            
            if (notes.length > 0) {
                currentY = drawFooterInfo(doc, currentY, notes.join('\n'), null);
            }
            
            // Pied de page
            drawFooter(doc);
            
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
            const doc = new PDFDocument({ 
                size: 'A4',
                margin: MARGIN,
                info: {
                    Title: `Commande ${commande.numero || commande.id}`,
                    Author: 'SilyProcure',
                    Subject: 'Bon de Commande'
                }
            });
            const stream = fs.createWriteStream(outputPath);
            doc.pipe(stream);
            
            let currentY = MARGIN;
            
            // Logo et en-tête entreprise
            currentY = drawLogo(doc, MARGIN, currentY);
            currentY = drawCompanyHeader(doc, currentY);
            
            // En-tête document
            const dateCommande = commande.date_commande ? new Date(commande.date_commande).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            }) : 'N/A';
            
            const dateLivraison = commande.date_livraison_souhaitee ? new Date(commande.date_livraison_souhaitee).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            }) : null;
            
            currentY = drawDocumentHeader(doc, 'BON DE COMMANDE', 'Purchase Order', {
                numero: commande.numero || 'N/A',
                date: dateCommande,
                dateEcheance: dateLivraison
            }, currentY);
            
            currentY += 20;
            
            // Destinataire (fournisseur)
            if (commande.fournisseur_nom) {
                currentY = drawRecipient(doc, {
                    nom: commande.fournisseur_nom,
                    contact: commande.fournisseur_telephone || '',
                    adresse: commande.fournisseur_adresse || '',
                    ville: commande.fournisseur_ville || '',
                    nif: commande.fournisseur_nif || ''
                }, currentY);
            }
            
            // Tableau des lignes
            if (commande.lignes && commande.lignes.length > 0) {
                const columns = [
                    { label: 'Description', width: 250, align: 'left' },
                    { label: 'Qté', width: 60, align: 'right' },
                    { label: 'Unité', width: 60, align: 'center' },
                    { label: 'Prix Unit. HT', width: 100, align: 'right' },
                    { label: 'Total HT', width: 125, align: 'right' }
                ];
                
                const rows = commande.lignes.map(ligne => {
                    const prixUnitaire = parseFloat(ligne.prix_unitaire_ht || 0);
                    const quantite = parseFloat(ligne.quantite || 0);
                    const remise = parseFloat(ligne.remise || 0);
                    const ligneTotal = prixUnitaire * quantite * (1 - remise / 100);
                    
                    return [
                        ligne.description || '-',
                        String(quantite),
                        ligne.unite || 'unité',
                        formatCurrency(prixUnitaire),
                        formatCurrency(ligneTotal)
                    ];
                });
                
                currentY = drawTable(doc, currentY, columns, rows);
                currentY += 20;
                
                // Totaux
                const tvaTaux = parseFloat(commande.lignes[0]?.tva_taux || 20);
                const totals = [
                    { label: 'Total HT', value: formatCurrency(commande.total_ht || 0) },
                    { label: `TVA (${tvaTaux}%)`, value: formatCurrency(commande.total_tva || 0) },
                    { separator: true },
                    { label: 'Net à Payer', value: formatCurrency(commande.total_ttc || 0) }
                ];
                
                currentY = drawTotals(doc, currentY, totals);
                currentY += 20;
            }
            
            // Instructions de livraison
            if (commande.instructions_livraison) {
                currentY = drawFooterInfo(doc, currentY, commande.instructions_livraison, null);
            }
            
            // Pied de page
            drawFooter(doc);
            
            doc.end();
            stream.on('finish', () => resolve(outputPath));
            stream.on('error', reject);
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Génère un PDF pour une Facture
 */
async function generateFacturePDF(facture, outputPath) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ 
                size: 'A4',
                margin: MARGIN,
                info: {
                    Title: `Facture ${facture.numero || facture.id}`,
                    Author: 'SilyProcure',
                    Subject: facture.type_facture === 'proforma' ? 'Facture Proforma' : 'Facture'
                }
            });
            const stream = fs.createWriteStream(outputPath);
            doc.pipe(stream);
            
            let currentY = MARGIN;
            
            // Logo et en-tête entreprise
            currentY = drawLogo(doc, MARGIN, currentY);
            currentY = drawCompanyHeader(doc, currentY);
            
            // En-tête document
            const dateEmission = facture.date_emission ? new Date(facture.date_emission).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            }) : 'N/A';
            
            const dateEcheance = facture.date_echeance ? new Date(facture.date_echeance).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            }) : null;
            
            const docTitle = facture.type_facture === 'proforma' ? 'PROFORMA' : 'FACTURE';
            currentY = drawDocumentHeader(doc, docTitle, facture.type_facture === 'proforma' ? 'Proforma Invoice' : 'Invoice', {
                numero: facture.numero || 'N/A',
                date: dateEmission,
                dateEcheance: dateEcheance
            }, currentY);
            
            currentY += 20;
            
            // Destinataire (client)
            if (facture.client_nom) {
                currentY = drawRecipient(doc, {
                    nom: facture.client_nom,
                    contact: facture.client_telephone || facture.client_email || '',
                    adresse: facture.client_adresse || '',
                    ville: facture.client_ville || '',
                    nif: facture.client_nif || ''
                }, currentY);
            }
            
            // Tableau des lignes
            if (facture.lignes && facture.lignes.length > 0) {
                const columns = [
                    { label: 'Description', width: 220, align: 'left' },
                    { label: 'Qté', width: 50, align: 'right' },
                    { label: 'Prix Unit. HT', width: 90, align: 'right' },
                    { label: 'Remise', width: 60, align: 'right' },
                    { label: 'TVA', width: 50, align: 'right' },
                    { label: 'Total HT', width: 125, align: 'right' }
                ];
                
                const rows = facture.lignes.map(ligne => {
                    const prixUnitaire = parseFloat(ligne.prix_unitaire_ht || 0);
                    const quantite = parseFloat(ligne.quantite || 0);
                    const remise = parseFloat(ligne.remise || 0);
                    const tva = parseFloat(ligne.tva_taux || 20);
                    const montantHT = prixUnitaire * quantite * (1 - remise / 100);
                    
                    return [
                        ligne.description || '-',
                        String(quantite),
                        formatCurrency(prixUnitaire),
                        remise > 0 ? remise + '%' : '-',
                        tva + '%',
                        formatCurrency(montantHT)
                    ];
                });
                
                currentY = drawTable(doc, currentY, columns, rows);
                currentY += 20;
                
                // Totaux
                const totals = [
                    { label: 'Total HT', value: formatCurrency(facture.total_ht || 0) },
                    { label: 'TVA', value: formatCurrency(facture.total_tva || 0) },
                    { separator: true },
                    { label: 'Net à Payer', value: formatCurrency(facture.total_ttc || 0) }
                ];
                
                if (facture.reste_a_payer > 0) {
                    totals.push({ separator: true });
                    totals.push({ 
                        label: 'Reste à payer', 
                        value: formatCurrency(facture.reste_a_payer)
                    });
                }
                
                currentY = drawTotals(doc, currentY, totals);
                currentY += 20;
            }
            
            // Notes et informations bancaires
            const notes = [];
            if (facture.conditions_paiement) {
                notes.push(`Paiement dû sous ${facture.delai_paiement_jours || 30} jours à réception de facture.`);
                notes.push(facture.conditions_paiement);
            }
            if (facture.mode_paiement) {
                notes.push(`Mode de paiement: ${facture.mode_paiement}`);
            }
            
            const bankInfo = {
                banque: 'Ecobank Guinée',
                titulaire: 'SilyProcure SA',
                iban: 'GN76 1234 5678 9012 3456 78',
                swift: 'ECOBGNCC'
            };
            
            currentY = drawFooterInfo(doc, currentY, notes.join('\n'), bankInfo);
            
            // Pied de page
            drawFooter(doc);
            
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
    if (!amount && amount !== 0) return '0 GNF';
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
