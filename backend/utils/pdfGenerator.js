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
    
    // Logo texte stylisé professionnel avec meilleure visibilité
    const logoY = startY;
    
    // Encadré pour le logo
    doc.rect(startX, logoY, 200, 45)
       .fillColor(COLORS.white)
       .fill();
    
    doc.rect(startX, logoY, 200, 45)
       .strokeColor(COLORS.primary)
       .lineWidth(1)
       .stroke();
    
    // Icône carrée avec "S" (plus visible)
    doc.rect(startX + 5, logoY + 2.5, 40, 40)
       .fillColor(COLORS.primary)
       .fill();
    
    doc.fontSize(26)
       .fillColor(COLORS.white)
       .font('Helvetica-Bold')
       .text('S', startX + 13, logoY + 10);
    
    // Texte "SilyProcure" (plus grand et visible)
    doc.fontSize(22)
       .fillColor(COLORS.text)
       .font('Helvetica-Bold')
       .text('Sily', startX + 52, logoY + 5, { continued: true });
    
    doc.fontSize(22)
       .fillColor(COLORS.primary)
       .font('Helvetica-Bold')
       .text('Procure', { continued: false });
    
    // Sous-titre (plus visible)
    doc.fontSize(9)
       .fillColor(COLORS.textLight)
       .font('Helvetica')
       .text('Système de gestion des achats', startX + 52, logoY + 28);
    
    return logoY + 50;
}

/**
 * Fonction pour dessiner l'en-tête d'entreprise
 */
function drawCompanyHeader(doc, startY) {
    const startX = MARGIN;
    let currentY = startY;
    
    // Encadré pour les informations entreprise
    const headerBoxHeight = 70;
    doc.rect(startX, currentY, CONTENT_WIDTH, headerBoxHeight)
       .fillColor(COLORS.gray50)
       .fill();
    
    doc.rect(startX, currentY, CONTENT_WIDTH, headerBoxHeight)
       .strokeColor(COLORS.border)
       .lineWidth(0.5)
       .stroke();
    
    currentY += 8;
    
    // Nom de l'entreprise (plus visible)
    doc.fontSize(11)
       .fillColor(COLORS.primary)
       .font('Helvetica-Bold')
       .text('SilyProcure SA', startX + 8, currentY);
    currentY += 14;
    
    // Informations en deux colonnes pour meilleure organisation
    const leftCol = startX + 8;
    const rightCol = startX + CONTENT_WIDTH / 2 + 10;
    let leftY = currentY;
    let rightY = currentY;
    
    // Colonne gauche
    doc.fontSize(8)
       .fillColor(COLORS.textLight)
       .font('Helvetica-Bold')
       .text('Adresse:', leftCol, leftY);
    leftY += 10;
    
    doc.fontSize(8)
       .fillColor(COLORS.text)
       .font('Helvetica')
       .text('Bambeto - Conakry', leftCol, leftY);
    leftY += 9;
    
    doc.text('Pharmacie Diaguissa', leftCol, leftY);
    leftY += 9;
    
    doc.text('Guinée', leftCol, leftY);
    
    // Colonne droite
    doc.fontSize(8)
       .fillColor(COLORS.textLight)
       .font('Helvetica-Bold')
       .text('Contact:', rightCol, rightY);
    rightY += 10;
    
    doc.fontSize(8)
       .fillColor(COLORS.text)
       .font('Helvetica')
       .text('Tél: +224 622 69 24 33', rightCol, rightY);
    rightY += 9;
    
    doc.text('Email: contact@silyprocure.com', rightCol, rightY);
    rightY += 9;
    
    doc.text('RCCM: GN.TCC.2024.B.00000', rightCol, rightY);
    
    return startY + headerBoxHeight + 15;
}

/**
 * Fonction pour dessiner l'en-tête de document (titre + infos)
 */
function drawDocumentHeader(doc, title, subtitle, documentInfo, startY) {
    const rightX = A4_WIDTH - MARGIN - 220;
    const infoBoxWidth = 220;
    let currentY = startY;
    
    // Encadré pour les informations du document
    const infoBoxHeight = 80 + (documentInfo.dateEcheance ? 12 : 0) + (documentInfo.dateValidite ? 12 : 0);
    doc.rect(rightX, currentY, infoBoxWidth, infoBoxHeight)
       .fillColor(COLORS.primary)
       .fill();
    
    doc.rect(rightX, currentY, infoBoxWidth, infoBoxHeight)
       .strokeColor(COLORS.primaryDark)
       .lineWidth(1)
       .stroke();
    
    currentY += 10;
    
    // Titre du document (dans l'encadré)
    doc.fontSize(20)
       .fillColor(COLORS.white)
       .font('Helvetica-Bold')
       .text(title, rightX + 10, currentY, { width: infoBoxWidth - 20, align: 'left' });
    currentY += 18;
    
    // Sous-titre
    doc.fontSize(9)
       .fillColor(COLORS.white)
       .font('Helvetica')
       .opacity(0.9)
       .text(subtitle, rightX + 10, currentY, { width: infoBoxWidth - 20, align: 'left' });
    currentY += 15;
    
    // Ligne de séparation
    doc.moveTo(rightX + 10, currentY)
       .lineTo(rightX + infoBoxWidth - 10, currentY)
       .strokeColor(COLORS.white)
       .opacity(0.3)
       .lineWidth(0.5)
       .stroke();
    currentY += 10;
    
    // Informations du document (en blanc pour contraste)
    if (documentInfo.numero) {
        doc.fontSize(7)
           .fillColor(COLORS.white)
           .font('Helvetica')
           .opacity(0.8)
           .text('Numéro', rightX + 10, currentY);
        doc.fontSize(10)
           .fillColor(COLORS.white)
           .font('Helvetica-Bold')
           .opacity(1)
           .text(documentInfo.numero, rightX + 10, currentY + 10, { width: infoBoxWidth - 20, align: 'left' });
        currentY += 25;
    }
    
    if (documentInfo.date) {
        doc.fontSize(7)
           .fillColor(COLORS.white)
           .font('Helvetica')
           .opacity(0.8)
           .text('Date', rightX + 10, currentY);
        doc.fontSize(9)
           .fillColor(COLORS.white)
           .font('Helvetica-Bold')
           .opacity(1)
           .text(documentInfo.date, rightX + 10, currentY + 10, { width: infoBoxWidth - 20, align: 'left' });
        currentY += 25;
    }
    
    if (documentInfo.dateEcheance) {
        doc.fontSize(7)
           .fillColor(COLORS.white)
           .font('Helvetica')
           .opacity(0.8)
           .text('Échéance', rightX + 10, currentY);
        doc.fontSize(9)
           .fillColor(COLORS.white)
           .font('Helvetica-Bold')
           .opacity(1)
           .text(documentInfo.dateEcheance, rightX + 10, currentY + 10, { width: infoBoxWidth - 20, align: 'left' });
        currentY += 25;
    }
    
    if (documentInfo.dateValidite) {
        doc.fontSize(7)
           .fillColor(COLORS.white)
           .font('Helvetica')
           .opacity(0.8)
           .text('Validité', rightX + 10, currentY);
        doc.fontSize(9)
           .fillColor(COLORS.white)
           .font('Helvetica-Bold')
           .opacity(1)
           .text(documentInfo.dateValidite, rightX + 10, currentY + 10, { width: infoBoxWidth - 20, align: 'left' });
        currentY += 25;
    }
    
    doc.opacity(1); // Réinitialiser l'opacité
    
    return startY + infoBoxHeight + 15;
}

/**
 * Fonction pour dessiner la section destinataire
 */
function drawRecipient(doc, recipientInfo, startY) {
    const rightX = A4_WIDTH - MARGIN - 250;
    const recipientWidth = 250;
    let currentY = startY;
    
    // Encadré pour le destinataire
    let boxHeight = 50; // Hauteur de base
    if (recipientInfo.contact) boxHeight += 12;
    if (recipientInfo.adresse) boxHeight += 12;
    if (recipientInfo.ville) boxHeight += 12;
    if (recipientInfo.nif) boxHeight += 12;
    
    doc.rect(rightX, currentY, recipientWidth, boxHeight)
       .fillColor(COLORS.gray50)
       .fill();
    
    doc.rect(rightX, currentY, recipientWidth, boxHeight)
       .strokeColor(COLORS.border)
       .lineWidth(0.5)
       .stroke();
    
    currentY += 8;
    
    // Label
    doc.fontSize(7)
       .fillColor(COLORS.textLighter)
       .font('Helvetica-Bold')
       .text('DESTINATAIRE', rightX + 8, currentY);
    currentY += 12;
    
    // Nom (plus visible)
    doc.fontSize(13)
       .fillColor(COLORS.text)
       .font('Helvetica-Bold')
       .text(recipientInfo.nom || '-', rightX + 8, currentY, { width: recipientWidth - 16, align: 'left' });
    currentY += 15;
    
    // Détails
    if (recipientInfo.contact) {
        doc.fontSize(8)
           .fillColor(COLORS.textLight)
           .font('Helvetica')
           .text(`Contact: ${recipientInfo.contact}`, rightX + 8, currentY, { width: recipientWidth - 16, align: 'left' });
        currentY += 11;
    }
    
    if (recipientInfo.adresse) {
        doc.fontSize(8)
           .fillColor(COLORS.textLight)
           .font('Helvetica')
           .text(recipientInfo.adresse, rightX + 8, currentY, { width: recipientWidth - 16, align: 'left' });
        currentY += 11;
    }
    
    if (recipientInfo.ville) {
        doc.fontSize(8)
           .fillColor(COLORS.textLight)
           .font('Helvetica')
           .text(recipientInfo.ville, rightX + 8, currentY, { width: recipientWidth - 16, align: 'left' });
        currentY += 11;
    }
    
    if (recipientInfo.nif) {
        doc.fontSize(8)
           .fillColor(COLORS.textLight)
           .font('Helvetica')
           .text(`NIF: ${recipientInfo.nif}`, rightX + 8, currentY, { width: recipientWidth - 16, align: 'left' });
        currentY += 11;
    }
    
    return startY + boxHeight + 20;
}

/**
 * Fonction pour dessiner un tableau professionnel
 */
function drawTable(doc, startY, columns, rows, options = {}) {
    const { headerBackground = COLORS.primary, headerTextColor = COLORS.white, 
            rowHeight = 28, alternateRowColor = COLORS.gray50 } = options;
    
    let y = startY;
    const tableWidth = CONTENT_WIDTH;
    const colWidths = columns.map(col => col.width);
    
    // En-tête du tableau avec fond primaire
    doc.rect(MARGIN, y, tableWidth, rowHeight)
       .fillColor(headerBackground)
       .fill();
    
    // Bordure de l'en-tête
    doc.rect(MARGIN, y, tableWidth, rowHeight)
       .strokeColor(COLORS.primaryDark)
       .lineWidth(1)
       .stroke();
    
    let x = MARGIN;
    columns.forEach((col, index) => {
        // Séparateur vertical entre colonnes
        if (index > 0) {
            doc.moveTo(x, y)
               .lineTo(x, y + rowHeight)
               .strokeColor(COLORS.white)
               .opacity(0.2)
               .lineWidth(0.5)
               .stroke();
        }
        
        doc.fontSize(9)
           .fillColor(headerTextColor)
           .font('Helvetica-Bold')
           .text(col.label.toUpperCase(), x + 10, y + 9, { 
               width: colWidths[index] - 20, 
               align: col.align || 'left' 
           });
        x += colWidths[index];
    });
    
    y += rowHeight;
    
    // Lignes du tableau
    rows.forEach((row, rowIndex) => {
        // Couleur alternée pour meilleure lisibilité
        if (rowIndex % 2 === 1) {
            doc.rect(MARGIN, y, tableWidth, rowHeight)
               .fillColor(alternateRowColor)
               .fill();
        }
        
        // Bordures horizontales
        doc.moveTo(MARGIN, y)
           .lineTo(MARGIN + tableWidth, y)
           .strokeColor(COLORS.border)
           .lineWidth(0.5)
           .stroke();
        
        doc.moveTo(MARGIN, y + rowHeight)
           .lineTo(MARGIN + tableWidth, y + rowHeight)
           .strokeColor(COLORS.border)
           .lineWidth(0.5)
           .stroke();
        
        // Bordures verticales
        x = MARGIN;
        columns.forEach((col, colIndex) => {
            if (colIndex > 0) {
                doc.moveTo(x, y)
                   .lineTo(x, y + rowHeight)
                   .strokeColor(COLORS.border)
                   .opacity(0.3)
                   .lineWidth(0.3)
                   .stroke();
            }
            x += colWidths[colIndex];
        });
        
        // Contenu avec meilleur espacement
        x = MARGIN;
        row.forEach((cell, cellIndex) => {
            const cellColor = columns[cellIndex].align === 'right' && !isNaN(parseFloat(cell)) 
                ? COLORS.primary 
                : COLORS.text;
            
            doc.fontSize(9)
               .fillColor(cellColor)
               .font(columns[cellIndex].align === 'right' && !isNaN(parseFloat(cell)) ? 'Helvetica-Bold' : 'Helvetica')
               .text(cell || '-', x + 10, y + 9, { 
                   width: colWidths[cellIndex] - 20, 
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
            doc.rect(MARGIN, y, tableWidth, rowHeight)
               .fillColor(headerBackground)
               .fill();
            
            doc.rect(MARGIN, y, tableWidth, rowHeight)
               .strokeColor(COLORS.primaryDark)
               .lineWidth(1)
               .stroke();
            
            x = MARGIN;
            columns.forEach((col, index) => {
                if (index > 0) {
                    doc.moveTo(x, y)
                       .lineTo(x, y + rowHeight)
                       .strokeColor(COLORS.white)
                       .opacity(0.2)
                       .lineWidth(0.5)
                       .stroke();
                }
                
                doc.fontSize(9)
                   .fillColor(headerTextColor)
                   .font('Helvetica-Bold')
                   .text(col.label.toUpperCase(), x + 10, y + 9, { 
                       width: colWidths[index] - 20, 
                       align: col.align || 'left' 
                   });
                x += colWidths[index];
            });
            y += rowHeight;
        }
    });
    
    // Bordure finale du tableau
    doc.rect(MARGIN, startY, tableWidth, y - startY)
       .strokeColor(COLORS.border)
       .lineWidth(1)
       .stroke();
    
    return y;
}

/**
 * Fonction pour dessiner les totaux
 */
function drawTotals(doc, startY, totals, rightAlign = true) {
    const totalsX = rightAlign ? A4_WIDTH - MARGIN - 250 : MARGIN;
    const totalsWidth = 250;
    let currentY = startY;
    
    // Encadré pour les totaux
    let boxHeight = totals.length * 18;
    totals.forEach(total => {
        if (total.separator) boxHeight += 8;
        else if (total.label === 'Net à Payer' || total.label === 'Reste à payer') boxHeight += 5;
    });
    
    doc.rect(totalsX, currentY, totalsWidth, boxHeight)
       .fillColor(COLORS.gray50)
       .fill();
    
    doc.rect(totalsX, currentY, totalsWidth, boxHeight)
       .strokeColor(COLORS.border)
       .lineWidth(0.5)
       .stroke();
    
    currentY += 8;
    
    totals.forEach((total, index) => {
        const isLast = index === totals.length - 1;
        const isTotal = total.label === 'Net à Payer' || total.label === 'Reste à payer';
        
        if (total.separator) {
            // Ligne de séparation
            doc.moveTo(totalsX + 10, currentY)
               .lineTo(totalsX + totalsWidth - 10, currentY)
               .strokeColor(COLORS.border)
               .lineWidth(0.5)
               .stroke();
            currentY += 10;
        } else {
            // Label
            doc.fontSize(isTotal ? 10 : 9)
               .fillColor(isTotal ? COLORS.primary : COLORS.text)
               .font(isTotal ? 'Helvetica-Bold' : 'Helvetica')
               .text(total.label, totalsX + 10, currentY, { width: totalsWidth - 150, align: 'left' });
            
            // Valeur
            doc.fontSize(isTotal ? 14 : 10)
               .fillColor(isTotal ? COLORS.primary : COLORS.text)
               .font('Helvetica-Bold')
               .text(total.value, totalsX + totalsWidth - 140, currentY, { width: 130, align: 'right' });
            
            currentY += isTotal ? 18 : 15;
        }
    });
    
    return startY + boxHeight + 10;
}

/**
 * Fonction pour dessiner les notes et informations bancaires
 */
function drawFooterInfo(doc, startY, notes, bankInfo) {
    const colWidth = (CONTENT_WIDTH - 20) / 2;
    let currentY = startY;
    let maxHeight = 0;
    
    // Colonne gauche - Notes
    if (notes) {
        // Calculer la hauteur nécessaire pour les notes
        const notesLines = notes.split('\n').length;
        const notesHeight = Math.max(80, 30 + (notesLines * 12));
        
        doc.rect(MARGIN, currentY, colWidth, notesHeight)
           .fillColor(COLORS.gray50)
           .fill();
        
        doc.rect(MARGIN, currentY, colWidth, notesHeight)
           .strokeColor(COLORS.border)
           .lineWidth(0.5)
           .stroke();
        
        // Titre avec icône visuelle
        doc.rect(MARGIN, currentY, colWidth, 20)
           .fillColor(COLORS.primary)
           .fill();
        
        doc.fontSize(8)
           .fillColor(COLORS.white)
           .font('Helvetica-Bold')
           .text('CONDITIONS & NOTES', MARGIN + 8, currentY + 6);
        
        doc.fontSize(8)
           .fillColor(COLORS.text)
           .font('Helvetica')
           .text(notes, MARGIN + 8, currentY + 25, { width: colWidth - 16, align: 'left', lineGap: 2 });
        
        maxHeight = Math.max(maxHeight, notesHeight);
    }
    
    // Colonne droite - Informations bancaires
    if (bankInfo) {
        const rightX = MARGIN + colWidth + 20;
        const bankInfoLines = [
            bankInfo.banque ? 1 : 0,
            bankInfo.titulaire ? 1 : 0,
            bankInfo.iban ? 1 : 0,
            bankInfo.swift ? 1 : 0
        ].reduce((a, b) => a + b, 0);
        
        const bankHeight = Math.max(80, 30 + (bankInfoLines * 12));
        
        doc.rect(rightX, currentY, colWidth, bankHeight)
           .fillColor(COLORS.gray50)
           .fill();
        
        doc.rect(rightX, currentY, colWidth, bankHeight)
           .strokeColor(COLORS.border)
           .lineWidth(0.5)
           .stroke();
        
        // Titre avec fond primaire
        doc.rect(rightX, currentY, colWidth, 20)
           .fillColor(COLORS.primary)
           .fill();
        
        doc.fontSize(8)
           .fillColor(COLORS.white)
           .font('Helvetica-Bold')
           .text('INFORMATIONS BANCAIRES', rightX + 8, currentY + 6);
        
        let infoY = currentY + 25;
        if (bankInfo.banque) {
            doc.fontSize(8)
               .fillColor(COLORS.text)
               .font('Helvetica-Bold')
               .text('Banque:', rightX + 8, infoY);
            doc.fontSize(8)
               .fillColor(COLORS.text)
               .font('Helvetica')
               .text(bankInfo.banque, rightX + 50, infoY);
            infoY += 12;
        }
        if (bankInfo.titulaire) {
            doc.fontSize(8)
               .fillColor(COLORS.text)
               .font('Helvetica-Bold')
               .text('Titulaire:', rightX + 8, infoY);
            doc.fontSize(8)
               .fillColor(COLORS.text)
               .font('Helvetica')
               .text(bankInfo.titulaire, rightX + 50, infoY);
            infoY += 12;
        }
        if (bankInfo.iban) {
            doc.fontSize(8)
               .fillColor(COLORS.text)
               .font('Helvetica-Bold')
               .text('IBAN:', rightX + 8, infoY);
            doc.fontSize(8)
               .fillColor(COLORS.text)
               .font('Helvetica')
               .text(bankInfo.iban, rightX + 50, infoY);
            infoY += 12;
        }
        if (bankInfo.swift) {
            doc.fontSize(8)
               .fillColor(COLORS.text)
               .font('Helvetica-Bold')
               .text('SWIFT:', rightX + 8, infoY);
            doc.fontSize(8)
               .fillColor(COLORS.text)
               .font('Helvetica')
               .text(bankInfo.swift, rightX + 50, infoY);
        }
        
        maxHeight = Math.max(maxHeight, bankHeight);
    }
    
    return currentY + maxHeight + 15;
}

/**
 * Fonction pour dessiner le pied de page
 */
function drawFooter(doc) {
    const footerY = A4_HEIGHT - MARGIN - 40;
    
    // Fond du footer
    doc.rect(MARGIN, footerY, CONTENT_WIDTH, 35)
       .fillColor(COLORS.gray100)
       .fill();
    
    // Ligne de séparation supérieure
    doc.moveTo(MARGIN, footerY)
       .lineTo(A4_WIDTH - MARGIN, footerY)
       .strokeColor(COLORS.border)
       .lineWidth(0.5)
       .stroke();
    
    // Texte du pied de page (plus structuré)
    doc.fontSize(7)
       .fillColor(COLORS.textLight)
       .font('Helvetica-Bold')
       .text('SilyProcure SA', MARGIN, footerY + 5, { align: 'center', width: CONTENT_WIDTH });
    
    doc.fontSize(6)
       .fillColor(COLORS.textLighter)
       .font('Helvetica')
       .text('Société Anonyme au capital de 100 000 000 GNF - RCCM GN.TCC.2024.B.00000', 
             MARGIN, footerY + 13, { align: 'center', width: CONTENT_WIDTH });
    
    doc.fontSize(7)
       .fillColor(COLORS.primary)
       .font('Helvetica-Bold')
       .text('Merci de votre confiance.', 
             MARGIN, footerY + 23, { align: 'center', width: CONTENT_WIDTH });
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
            
            currentY += 15;
            
            // Séparateur visuel
            doc.moveTo(MARGIN, currentY)
               .lineTo(A4_WIDTH - MARGIN, currentY)
               .strokeColor(COLORS.border)
               .lineWidth(0.5)
               .stroke();
            currentY += 15;
            
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
            
            // Description avec encadré
            if (rfq.description) {
                const descHeight = 40;
                doc.rect(MARGIN, currentY, CONTENT_WIDTH, descHeight)
                   .fillColor(COLORS.gray50)
                   .fill();
                
                doc.rect(MARGIN, currentY, CONTENT_WIDTH, descHeight)
                   .strokeColor(COLORS.border)
                   .lineWidth(0.5)
                   .stroke();
                
                doc.fontSize(8)
                   .fillColor(COLORS.textLight)
                   .font('Helvetica-Bold')
                   .text('DESCRIPTION', MARGIN + 8, currentY + 6);
                
                doc.fontSize(9)
                   .fillColor(COLORS.text)
                   .font('Helvetica')
                   .text(rfq.description, MARGIN + 8, currentY + 18, { width: CONTENT_WIDTH - 16, align: 'left' });
                currentY += descHeight + 15;
            }
            
            // Titre de section pour le tableau
            doc.fontSize(10)
               .fillColor(COLORS.primary)
               .font('Helvetica-Bold')
               .text('ARTICLES DEMANDÉS', MARGIN, currentY);
            currentY += 12;
            
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
            
            // Séparateur avant les conditions
            if (rfq.conditions_paiement) {
                doc.moveTo(MARGIN, currentY)
                   .lineTo(A4_WIDTH - MARGIN, currentY)
                   .strokeColor(COLORS.border)
                   .lineWidth(0.5)
                   .stroke();
                currentY += 15;
                
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
            
            currentY += 15;
            
            // Séparateur visuel
            doc.moveTo(MARGIN, currentY)
               .lineTo(A4_WIDTH - MARGIN, currentY)
               .strokeColor(COLORS.border)
               .lineWidth(0.5)
               .stroke();
            currentY += 15;
            
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
            
            // Titre de section pour le tableau
            doc.fontSize(10)
               .fillColor(COLORS.primary)
               .font('Helvetica-Bold')
               .text('DÉTAIL DES ARTICLES', MARGIN, currentY);
            currentY += 12;
            
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
                currentY += 15;
            }
            
            // Séparateur avant les conditions
            if (devis.conditions_paiement || devis.garanties || devis.delai_livraison) {
                doc.moveTo(MARGIN, currentY)
                   .lineTo(A4_WIDTH - MARGIN, currentY)
                   .strokeColor(COLORS.border)
                   .lineWidth(0.5)
                   .stroke();
                currentY += 15;
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
            
            currentY += 15;
            
            // Séparateur visuel
            doc.moveTo(MARGIN, currentY)
               .lineTo(A4_WIDTH - MARGIN, currentY)
               .strokeColor(COLORS.border)
               .lineWidth(0.5)
               .stroke();
            currentY += 15;
            
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
            
            // Titre de section pour le tableau
            doc.fontSize(10)
               .fillColor(COLORS.primary)
               .font('Helvetica-Bold')
               .text('ARTICLES COMMANDÉS', MARGIN, currentY);
            currentY += 12;
            
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
                currentY += 15;
            }
            
            // Séparateur avant les instructions
            if (commande.instructions_livraison) {
                doc.moveTo(MARGIN, currentY)
                   .lineTo(A4_WIDTH - MARGIN, currentY)
                   .strokeColor(COLORS.border)
                   .lineWidth(0.5)
                   .stroke();
                currentY += 15;
                
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
            
            currentY += 15;
            
            // Séparateur visuel
            doc.moveTo(MARGIN, currentY)
               .lineTo(A4_WIDTH - MARGIN, currentY)
               .strokeColor(COLORS.border)
               .lineWidth(0.5)
               .stroke();
            currentY += 15;
            
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
            
            // Titre de section pour le tableau
            doc.fontSize(10)
               .fillColor(COLORS.primary)
               .font('Helvetica-Bold')
               .text('DÉTAIL DE LA FACTURATION', MARGIN, currentY);
            currentY += 12;
            
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
                currentY += 15;
            }
            
            // Séparateur avant les notes
            doc.moveTo(MARGIN, currentY)
               .lineTo(A4_WIDTH - MARGIN, currentY)
               .strokeColor(COLORS.border)
               .lineWidth(0.5)
               .stroke();
            currentY += 15;
            
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
