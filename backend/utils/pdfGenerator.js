const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// --- CONFIGURATION DU THEME ---
const COLORS = {
    primary: '#00387A',      // Bleu SilyProcure
    primaryLight: '#E6F0FA', // Fond très clair pour les en-têtes
    accent: '#FF6600',       // Orange (touches subtiles)
    text: '#1F2937',         // Gris très foncé (plus élégant que le noir pur)
    textSecondary: '#6B7280',// Gris moyen pour les labels
    textLight: '#9CA3AF',    // Gris clair pour info bas de page
    border: '#E5E7EB',       // Gris très pâle pour les séparateurs
    white: '#FFFFFF',
    background: '#F9FAFB',
    success: '#10B981',      // Vert pour "Payé" ou validité
    danger: '#EF4444'        // Rouge pour échéance
};

const FONTS = {
    regular: 'Helvetica',
    bold: 'Helvetica-Bold'
};

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const MARGIN = 50; // Marges légèrement réduites pour un look plus aéré
const CONTENT_WIDTH = A4_WIDTH - (MARGIN * 2);

// --- UTILITAIRES DE DESSIN ---

/**
 * Dessine une ligne de séparation subtile
 */
function drawHr(doc, y, thickness = 0.5, color = COLORS.border) {
    doc.strokeColor(color)
       .lineWidth(thickness)
       .moveTo(MARGIN, y)
       .lineTo(A4_WIDTH - MARGIN, y)
       .stroke();
    return y + 10;
}

/**
 * Vérifie si on doit changer de page
 */
function checkPageBreak(doc, currentY, neededHeight) {
    if (currentY + neededHeight > doc.page.height - MARGIN) {
        doc.addPage();
        return MARGIN;
    }
    return currentY;
}

/**
 * Formate un montant
 */
function formatCurrency(amount) {
    if (amount === undefined || amount === null) return '0 GNF';
    return new Intl.NumberFormat('fr-FR', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount) + ' GNF';
}

// --- COMPOSANTS UI ---

/**
 * En-tête moderne : Logo à gauche, Infos entreprise à droite (alignées proprement)
 */
function drawModernHeader(doc, currentY) {
    const startY = currentY;

    // 1. LOGO (Simulé ou Image)
    const logoPath = path.join(__dirname, '../../logos/png/logo.png');
    if (fs.existsSync(logoPath)) {
        doc.image(logoPath, MARGIN, startY, { width: 100 });
    } else {
        // Logo texte stylisé (Fallback)
        doc.rect(MARGIN, startY, 40, 40).fillColor(COLORS.primary).fill();
        doc.fillColor(COLORS.white).fontSize(24).font(FONTS.bold).text('S', MARGIN + 11, startY + 8);
        
        doc.fillColor(COLORS.primary).fontSize(20).text('Sily', MARGIN + 50, startY + 5, { continued: true });
        doc.fillColor(COLORS.accent).text('Procure');
        doc.fontSize(8).fillColor(COLORS.textSecondary).font(FONTS.regular).text('Système de gestion des achats', MARGIN + 50, startY + 28);
    }

    // 2. INFOS ENTREPRISE (Alignées à droite, texte gris subtil)
    const infoX = A4_WIDTH - MARGIN - 200;
    let infoY = startY;

    doc.font(FONTS.bold).fontSize(10).fillColor(COLORS.primary).text('SilyProcure SA', infoX, infoY, { align: 'right', width: 200 });
    infoY += 15;

    doc.font(FONTS.regular).fontSize(8).fillColor(COLORS.textSecondary);
    doc.text('Bambeto - Conakry', infoX, infoY, { align: 'right', width: 200 });
    infoY += 10;
    doc.text('Pharmacie Diaguissa, Guinée', infoX, infoY, { align: 'right', width: 200 });
    infoY += 10;
    doc.text('contact@silyprocure.com', infoX, infoY, { align: 'right', width: 200 });
    infoY += 10;
    doc.text('+224 622 69 24 33', infoX, infoY, { align: 'right', width: 200 });

    return Math.max(startY + 50, infoY) + 30; // Retourne le Y le plus bas + marge
}

/**
 * Titre du document et informations clés (Badge style)
 */
function drawDocTitle(doc, title, subtitle, infoObj, currentY) {
    // Titre (Gros, Gras)
    doc.font(FONTS.bold).fontSize(24).fillColor(COLORS.primary).text(title.toUpperCase(), MARGIN, currentY);
    
    // Sous-titre
    if (subtitle) {
        doc.font(FONTS.regular).fontSize(10).fillColor(COLORS.textSecondary).text(subtitle, MARGIN, currentY + 28);
    }

    // Bloc d'information à droite (Numéro, Date)
    // On crée un fond léger pour faire "moderne"
    const boxWidth = 220;
    const boxX = A4_WIDTH - MARGIN - boxWidth;
    let boxY = currentY - 5;
    
    // Calcul hauteur nécessaire
    const itemCount = Object.keys(infoObj).filter(([k, v]) => v).length;
    const boxHeight = (itemCount * 18) + 15;

    // Fond gris très léger
    doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 4)
       .fillColor(COLORS.background)
       .fill();

    let textY = boxY + 10;
    
    Object.entries(infoObj).forEach(([label, value]) => {
        if (!value) return;
        
        doc.font(FONTS.bold).fontSize(8).fillColor(COLORS.textSecondary)
           .text(label.toUpperCase(), boxX + 10, textY);
           
        doc.font(FONTS.bold).fontSize(9).fillColor(COLORS.text)
           .text(value, boxX + 100, textY, { align: 'right', width: boxWidth - 110 });
           
        textY += 18;
    });

    return Math.max(currentY + 50, boxY + boxHeight) + 30;
}

/**
 * Section Destinataire (Client/Fournisseur)
 */
function drawRecipientSection(doc, label, data, currentY) {
    if (!data || !data.nom) return currentY;
    
    doc.font(FONTS.bold).fontSize(9).fillColor(COLORS.textSecondary).text(label.toUpperCase(), MARGIN, currentY);
    currentY += 15;

    doc.font(FONTS.bold).fontSize(12).fillColor(COLORS.text).text(data.nom || 'Nom inconnu', MARGIN, currentY);
    currentY += 16;

    doc.font(FONTS.regular).fontSize(9).fillColor(COLORS.text);
    
    // Adresse dynamique (gestion du saut de ligne si trop long)
    const address = [data.adresse, data.ville, data.pays].filter(Boolean).join(', ');
    if (address) {
        doc.text(address, MARGIN, currentY, { width: 300 });
        currentY += doc.heightOfString(address, { width: 300 }) + 4;
    }

    if (data.contact) {
        doc.fillColor(COLORS.textSecondary).text('Contact: ', MARGIN, currentY, { continued: true })
           .fillColor(COLORS.text).text(data.contact);
        currentY += 14;
    }
    
    if (data.nif) {
        doc.fillColor(COLORS.textSecondary).text('NIF/RCCM: ', MARGIN, currentY, { continued: true })
           .fillColor(COLORS.text).text(data.nif);
        currentY += 14;
    }

    return currentY + 20;
}

/**
 * Tableau Moderne (Sans lignes verticales, Header coloré)
 */
function drawModernTable(doc, startY, columns, rows) {
    let currentY = startY;
    const rowHeight = 30;
    const tableWidth = CONTENT_WIDTH;
    
    // --- HEADER ---
    doc.roundedRect(MARGIN, currentY, tableWidth, rowHeight, 4)
       .fillColor(COLORS.primaryLight) // Fond bleu très pâle
       .fill();
       
    let x = MARGIN;
    columns.forEach(col => {
        doc.font(FONTS.bold).fontSize(8).fillColor(COLORS.primary)
           .text(col.label.toUpperCase(), x + 5, currentY + 10, { width: col.width - 10, align: col.align || 'left' });
        x += col.width;
    });
    
    currentY += rowHeight + 5;

    // --- ROWS ---
    rows.forEach((row, i) => {
        // Vérification saut de page
        currentY = checkPageBreak(doc, currentY, rowHeight);

        // Couleur de texte par défaut
        doc.font(FONTS.regular).fontSize(9).fillColor(COLORS.text);

        // Dessin des cellules
        let rowX = MARGIN;
        let maxCellHeight = 0;

        // Pré-calcul de la hauteur de la ligne (pour les descriptions longues)
        row.forEach((cellText, index) => {
            const h = doc.heightOfString(cellText || '', { width: columns[index].width - 10 });
            if (h > maxCellHeight) maxCellHeight = h;
        });
        
        // Hauteur min de 25px
        const finalRowHeight = Math.max(25, maxCellHeight + 10);

        // Ligne de séparation fine en bas
        doc.moveTo(MARGIN, currentY + finalRowHeight)
           .lineTo(A4_WIDTH - MARGIN, currentY + finalRowHeight)
           .lineWidth(0.5)
           .strokeColor(COLORS.border)
           .stroke();

        row.forEach((cellText, index) => {
            const col = columns[index];
            const isNumber = col.align === 'right';
            
            // Gras pour les nombres/prix
            if (isNumber) doc.font(FONTS.bold);
            else doc.font(FONTS.regular);

            doc.text(cellText || '-', rowX + 5, currentY + 8, { 
                width: col.width - 10, 
                align: col.align || 'left' 
            });
            rowX += col.width;
        });

        currentY += finalRowHeight;
    });

    return currentY + 20;
}

/**
 * Totaux (Flottant à droite, propre)
 */
function drawModernTotals(doc, startY, totals) {
    let currentY = startY;
    const boxWidth = 200;
    const startX = A4_WIDTH - MARGIN - boxWidth;

    currentY = checkPageBreak(doc, currentY, totals.length * 25 + 20);

    totals.forEach(t => {
        const isGrandTotal = t.isTotal;
        const isSeparator = t.separator;

        if (isSeparator) {
            doc.moveTo(startX, currentY).lineTo(A4_WIDTH - MARGIN, currentY)
               .lineWidth(1).strokeColor(COLORS.border).stroke();
            currentY += 10;
            return;
        }

        if (isGrandTotal) {
            // Fond coloré pour le net à payer
            doc.roundedRect(startX - 10, currentY - 5, boxWidth + 10, 30, 4)
               .fillColor(COLORS.primaryLight)
               .fill();
               
            doc.font(FONTS.bold).fontSize(11).fillColor(COLORS.primary)
               .text(t.label, startX, currentY + 3);
               
            doc.font(FONTS.bold).fontSize(12).fillColor(COLORS.primary)
               .text(t.value, startX, currentY + 3, { align: 'right', width: boxWidth });
               
            currentY += 35;
        } else {
            doc.font(FONTS.regular).fontSize(9).fillColor(COLORS.textSecondary)
               .text(t.label, startX, currentY);
               
            doc.font(FONTS.bold).fontSize(9).fillColor(COLORS.text)
               .text(t.value, startX, currentY, { align: 'right', width: boxWidth });
               
            currentY += 20;
        }
    });

    return currentY;
}

/**
 * Footer Discret
 */
function drawFooter(doc) {
    const bottomY = doc.page.height - 40;
    
    doc.lineWidth(0.5).strokeColor(COLORS.border)
       .moveTo(MARGIN, bottomY).lineTo(A4_WIDTH - MARGIN, bottomY).stroke();

    doc.fontSize(7).fillColor(COLORS.textLight).font(FONTS.regular)
       .text('SilyProcure SA - Système de gestion des achats', MARGIN, bottomY + 10, { align: 'center', width: CONTENT_WIDTH });
       
    doc.text('Document généré électroniquement. Aucune signature requise.', MARGIN, bottomY + 20, { align: 'center', width: CONTENT_WIDTH });
}

// --- FONCTIONS GENERATRICES PRINCIPALES ---

async function generateRFQPDF(rfq, outputPath) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ size: 'A4', margin: MARGIN, bufferPages: true });
            const stream = fs.createWriteStream(outputPath);
            doc.pipe(stream);

            let y = MARGIN;
            y = drawModernHeader(doc, y);
            y = drawHr(doc, y - 10);

            const dateEmission = rfq.date_emission ? new Date(rfq.date_emission).toLocaleDateString('fr-FR') : 'N/A';
            const dateLimite = rfq.date_limite_reponse ? new Date(rfq.date_limite_reponse).toLocaleDateString('fr-FR') : 'N/A';

            y = drawDocTitle(doc, 'Demande de Devis', 'Request for Quotation', {
                'Référence': rfq.numero || 'N/A',
                'Date': dateEmission,
                'Échéance': dateLimite
            }, y);

            // Destinataire
            if (rfq.destinataire_nom) {
                y = drawRecipientSection(doc, 'Fournisseur Consulté', {
                    nom: rfq.destinataire_nom,
                    contact: rfq.destinataire_contact || rfq.destinataire_telephone || '',
                    adresse: rfq.destinataire_adresse || '',
                    ville: rfq.destinataire_ville || ''
                }, y);
            }

            // Description libre
            if (rfq.description) {
                y = checkPageBreak(doc, y, 50);
                doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 40, 4).fillColor(COLORS.background).fill();
                doc.font(FONTS.regular).fontSize(9).fillColor(COLORS.text)
                   .text(rfq.description, MARGIN + 10, y + 12, { width: CONTENT_WIDTH - 20 });
                y += 50;
            }

            // Tableau
            if (rfq.lignes && rfq.lignes.length > 0) {
                y = checkPageBreak(doc, y, 100);
                const columns = [
                    { label: 'Description', width: 280 },
                    { label: 'Qté', width: 60, align: 'right' },
                    { label: 'Unité', width: 60, align: 'center' },
                    { label: 'Note', width: 95 }
                ];

                const rows = rfq.lignes.map(l => [
                    l.description || '-',
                    String(l.quantite || 0),
                    l.unite || 'U',
                    l.specifications || ''
                ]);

                y = drawModernTable(doc, y, columns, rows);
            }

            drawFooter(doc);
            doc.end();
            stream.on('finish', () => resolve(outputPath));
            stream.on('error', reject);
        } catch (error) {
            reject(error);
        }
    });
}

async function generateDevisPDF(devis, outputPath) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ size: 'A4', margin: MARGIN });
            const stream = fs.createWriteStream(outputPath);
            doc.pipe(stream);

            let y = MARGIN;
            y = drawModernHeader(doc, y);
            y = drawHr(doc, y - 10);

            const dateEmission = devis.date_emission ? new Date(devis.date_emission).toLocaleDateString('fr-FR') : 'N/A';
            const dateValidite = devis.date_validite ? new Date(devis.date_validite).toLocaleDateString('fr-FR') : null;

            y = drawDocTitle(doc, 'Devis', 'Offre Commerciale', {
                'Référence': devis.numero || 'N/A',
                'Date': dateEmission,
                'Validité': dateValidite || '-'
            }, y);

            // Destinataire (client)
            const clientNom = devis.client_entreprise || devis.client_nom || devis.fournisseur_nom;
            if (clientNom) {
                y = drawRecipientSection(doc, 'Client', {
                    nom: clientNom,
                    contact: devis.client_telephone || devis.client_email || devis.fournisseur_telephone || '',
                    adresse: devis.client_adresse || devis.fournisseur_adresse || '',
                    ville: devis.client_ville || devis.fournisseur_ville || '',
                    nif: devis.client_nif || devis.fournisseur_nif || ''
                }, y);
            }

            // Tableau des lignes
            if (devis.lignes && devis.lignes.length > 0) {
                y = checkPageBreak(doc, y, 150);
                const columns = [
                    { label: 'Désignation', width: 230 },
                    { label: 'Qté', width: 50, align: 'right' },
                    { label: 'P.U. HT', width: 90, align: 'right' },
                    { label: 'Remise', width: 50, align: 'right' },
                    { label: 'Total HT', width: 85, align: 'right' }
                ];

                let totalHT = 0;
                const rows = devis.lignes.map(l => {
                    const pu = parseFloat(l.prix_unitaire_ht || 0);
                    const qte = parseFloat(l.quantite || 0);
                    const rem = parseFloat(l.remise || 0);
                    const totalLigne = pu * qte * (1 - rem/100);
                    totalHT += totalLigne;
                    
                    return [
                        l.description || '-',
                        String(qte),
                        formatCurrency(pu),
                        rem > 0 ? rem + '%' : '-',
                        formatCurrency(totalLigne)
                    ];
                });

                y = drawModernTable(doc, y, columns, rows);

                // Calculs
                const tvaRate = parseFloat(devis.tva_taux || 20);
                const montantTVA = totalHT * (tvaRate / 100);
                const totalTTC = totalHT + montantTVA;

                const totals = [
                    { label: 'Total HT', value: formatCurrency(totalHT) },
                    { label: `TVA (${tvaRate}%)`, value: formatCurrency(montantTVA) },
                    { separator: true },
                    { label: 'NET À PAYER', value: formatCurrency(totalTTC), isTotal: true }
                ];

                y = drawModernTotals(doc, y, totals);
            }

            // Conditions en bas
            if (devis.conditions_paiement || devis.garanties || devis.delai_livraison) {
                y = checkPageBreak(doc, y, 60);
                y += 20;
                const notes = [];
                if (devis.conditions_paiement) {
                    notes.push(`Conditions: ${devis.conditions_paiement}`);
                }
                if (devis.garanties) {
                    notes.push(`Garanties: ${devis.garanties}`);
                }
                if (devis.delai_livraison) {
                    notes.push(`Délai de livraison: ${devis.delai_livraison} jours`);
                }
                if (notes.length > 0) {
                    doc.font(FONTS.bold).fontSize(9).fillColor(COLORS.text).text('Conditions:', MARGIN, y);
                    doc.font(FONTS.regular).fontSize(8).fillColor(COLORS.textSecondary)
                       .text(notes.join(' | '), MARGIN, y + 12, { width: CONTENT_WIDTH });
                }
            }

            drawFooter(doc);
            doc.end();
            stream.on('finish', () => resolve(outputPath));
            stream.on('error', reject);
        } catch (error) {
            reject(error);
        }
    });
}

async function generateFacturePDF(facture, outputPath) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ size: 'A4', margin: MARGIN });
            const stream = fs.createWriteStream(outputPath);
            doc.pipe(stream);

            let y = MARGIN;
            y = drawModernHeader(doc, y);
            y = drawHr(doc, y - 10);

            const dateEmission = facture.date_emission ? new Date(facture.date_emission).toLocaleDateString('fr-FR') : 'N/A';
            const dateEcheance = facture.date_echeance ? new Date(facture.date_echeance).toLocaleDateString('fr-FR') : null;

            const typeLabel = facture.type_facture === 'proforma' ? 'Proforma' : 'Facture';
            y = drawDocTitle(doc, typeLabel, 'Invoice', {
                'N° Facture': facture.numero || 'N/A',
                'Date': dateEmission,
                'Échéance': dateEcheance || '-'
            }, y);

            // Destinataire (client)
            const clientNom = facture.client_entreprise || facture.client_nom;
            if (clientNom) {
                y = drawRecipientSection(doc, 'Facturé à', {
                    nom: clientNom,
                    contact: facture.client_telephone || facture.client_email || '',
                    adresse: facture.client_adresse || '',
                    ville: facture.client_ville || '',
                    nif: facture.client_nif || ''
                }, y);
            }

            // Tableau des lignes
            if (facture.lignes && facture.lignes.length > 0) {
                y = checkPageBreak(doc, y, 150);
                const columns = [
                    { label: 'Description', width: 230 },
                    { label: 'Qté', width: 50, align: 'right' },
                    { label: 'Prix Unitaire', width: 90, align: 'right' },
                    { label: 'TVA', width: 50, align: 'right' },
                    { label: 'Total HT', width: 85, align: 'right' }
                ];

                const rows = facture.lignes.map(l => {
                    const pu = parseFloat(l.prix_unitaire_ht || 0);
                    const qte = parseFloat(l.quantite || 0);
                    const rem = parseFloat(l.remise || 0);
                    const total = pu * qte * (1 - rem/100);
                    
                    return [
                        l.description || '-',
                        String(qte),
                        formatCurrency(pu),
                        (l.tva_taux || 20) + '%',
                        formatCurrency(total)
                    ];
                });

                y = drawModernTable(doc, y, columns, rows);

                const totals = [
                    { label: 'Total HT', value: formatCurrency(facture.total_ht || 0) },
                    { label: 'TVA', value: formatCurrency(facture.total_tva || 0) },
                    { separator: true },
                    { label: 'NET À PAYER', value: formatCurrency(facture.total_ttc || 0), isTotal: true }
                ];

                if (facture.reste_a_payer && facture.reste_a_payer > 0) {
                    totals.push({ separator: true });
                    totals.push({ label: 'Reste à payer', value: formatCurrency(facture.reste_a_payer) });
                }

                y = drawModernTotals(doc, y, totals);
            }

            // Info Bancaire (Style carte)
            y = checkPageBreak(doc, y, 80);
            y += 30;
            
            doc.roundedRect(MARGIN, y, 250, 60, 4).fillColor(COLORS.background).fill();
            doc.fillColor(COLORS.primary).font(FONTS.bold).fontSize(9).text('Informations Bancaires', MARGIN + 10, y + 10);
            doc.fillColor(COLORS.text).font(FONTS.regular).fontSize(8)
               .text('Banque: Ecobank Guinée', MARGIN + 10, y + 25)
               .text('IBAN: GN76 1234 5678 9012 3456 78', MARGIN + 10, y + 38)
               .text('SWIFT: ECOBGNCC', MARGIN + 10, y + 51);

            // Conditions de paiement
            if (facture.conditions_paiement || facture.mode_paiement) {
                y += 70;
                const conditions = [];
                if (facture.conditions_paiement) {
                    conditions.push(facture.conditions_paiement);
                }
                if (facture.mode_paiement) {
                    conditions.push(`Mode: ${facture.mode_paiement}`);
                }
                if (facture.delai_paiement_jours) {
                    conditions.push(`Délai: ${facture.delai_paiement_jours} jours`);
                }
                if (conditions.length > 0) {
                    doc.font(FONTS.bold).fontSize(9).fillColor(COLORS.text).text('Conditions de paiement:', MARGIN, y);
                    doc.font(FONTS.regular).fontSize(8).fillColor(COLORS.textSecondary)
                       .text(conditions.join(' | '), MARGIN, y + 12, { width: CONTENT_WIDTH });
                }
            }

            drawFooter(doc);
            doc.end();
            stream.on('finish', () => resolve(outputPath));
            stream.on('error', reject);
        } catch (error) {
            reject(error);
        }
    });
}

async function generateCommandePDF(commande, outputPath) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ size: 'A4', margin: MARGIN });
            const stream = fs.createWriteStream(outputPath);
            doc.pipe(stream);
            
            let y = MARGIN;
            y = drawModernHeader(doc, y);
            y = drawHr(doc, y - 10);
            
            const dateCommande = commande.date_commande ? new Date(commande.date_commande).toLocaleDateString('fr-FR') : 'N/A';
            const dateLivraison = commande.date_livraison_souhaitee ? new Date(commande.date_livraison_souhaitee).toLocaleDateString('fr-FR') : null;
            
            y = drawDocTitle(doc, 'Bon de Commande', 'Purchase Order', {
                'N° Commande': commande.numero || 'N/A',
                'Date': dateCommande,
                'Livraison': dateLivraison || '-'
            }, y);
            
            // Destinataire (fournisseur)
            if (commande.fournisseur_nom) {
                y = drawRecipientSection(doc, 'Fournisseur', {
                    nom: commande.fournisseur_nom,
                    contact: commande.fournisseur_telephone || '',
                    adresse: commande.fournisseur_adresse || '',
                    ville: commande.fournisseur_ville || '',
                    nif: commande.fournisseur_nif || ''
                }, y);
            }

            // Tableau simplifié
            if (commande.lignes && commande.lignes.length > 0) {
                y = checkPageBreak(doc, y, 150);
                const columns = [
                    { label: 'Article', width: 250 },
                    { label: 'Qté', width: 50, align: 'right' },
                    { label: 'Unité', width: 60, align: 'center' },
                    { label: 'P.U.', width: 80, align: 'right' },
                    { label: 'Total', width: 100, align: 'right' }
                ];
                
                const rows = commande.lignes.map(l => {
                    const pu = parseFloat(l.prix_unitaire_ht || 0);
                    const qte = parseFloat(l.quantite || 0);
                    const rem = parseFloat(l.remise || 0);
                    const total = pu * qte * (1 - rem/100);
                    
                    return [
                        l.description || '-',
                        String(qte),
                        l.unite || 'unité',
                        formatCurrency(pu),
                        formatCurrency(total)
                    ];
                });
                
                y = drawModernTable(doc, y, columns, rows);
                
                // Totaux
                const tvaTaux = parseFloat(commande.lignes[0]?.tva_taux || 20);
                const totals = [
                    { label: 'Total HT', value: formatCurrency(commande.total_ht || 0) },
                    { label: `TVA (${tvaTaux}%)`, value: formatCurrency(commande.total_tva || 0) },
                    { separator: true },
                    { label: 'TOTAL TTC', value: formatCurrency(commande.total_ttc || 0), isTotal: true }
                ];
                
                y = drawModernTotals(doc, y, totals);
            }
            
            // Conditions de livraison
            if (commande.instructions_livraison || commande.contact_livraison || commande.telephone_livraison) {
                y = checkPageBreak(doc, y, 80);
                y += 20;
                
                doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 60, 4).fillColor(COLORS.background).fill();
                doc.font(FONTS.bold).fontSize(9).fillColor(COLORS.primary).text('Conditions de livraison', MARGIN + 10, y + 10);
                
                let livraisonY = y + 25;
                if (commande.instructions_livraison) {
                    doc.font(FONTS.regular).fontSize(8).fillColor(COLORS.text)
                       .text(commande.instructions_livraison, MARGIN + 10, livraisonY, { width: CONTENT_WIDTH - 20 });
                    livraisonY += 15;
                }
                if (commande.contact_livraison) {
                    doc.font(FONTS.regular).fontSize(8).fillColor(COLORS.textSecondary)
                       .text(`Contact: ${commande.contact_livraison}`, MARGIN + 10, livraisonY);
                    livraisonY += 12;
                }
                if (commande.telephone_livraison) {
                    doc.font(FONTS.regular).fontSize(8).fillColor(COLORS.textSecondary)
                       .text(`Téléphone: ${commande.telephone_livraison}`, MARGIN + 10, livraisonY);
                }
                y += 70;
            }
            
            // Conditions de paiement
            if (commande.conditions_paiement) {
                y = checkPageBreak(doc, y, 40);
                y += 15;
                doc.font(FONTS.bold).fontSize(9).fillColor(COLORS.text).text('Conditions de paiement:', MARGIN, y);
                doc.font(FONTS.regular).fontSize(8).fillColor(COLORS.textSecondary)
                   .text(commande.conditions_paiement, MARGIN, y + 12, { width: CONTENT_WIDTH });
            }
            
            drawFooter(doc);
            doc.end();
            stream.on('finish', () => resolve(outputPath));
            stream.on('error', reject);
        } catch (error) {
            reject(error);
        }
    });
}

module.exports = {
    generateRFQPDF,
    generateDevisPDF,
    generateFacturePDF,
    generateCommandePDF
};
