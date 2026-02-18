/**
 * Service de génération PDF
 * Utilise PDFKit pour créer des documents PDF professionnels
 *
 * Conventions de style:
 * - Couleur primaire: #1a237e (bleu foncé)
 * - Couleur accent: #0d47a1
 * - Couleur succès: #2e7d32
 * - Couleur danger: #c62828
 * - Police: Helvetica (intégrée PDFKit)
 */

import PDFDocument from 'pdfkit';
import { ExportStrategy } from '../interfaces/export-strategy.interface';
import {
    ReleveCompteData,
    RapportExerciceData,
    RapportMensuelData,
    PdfReportHeader,
    PdfTableColumn
} from '../types/export-data.types';

// Export these local types that are used by the service's helper methods but not in the strategy
export { PdfReportHeader, PdfTableColumn };

// =============================================================================
// Constantes de style
// =============================================================================

const COLORS = {
    primary: '#1a237e',
    accent: '#0d47a1',
    success: '#2e7d32',
    danger: '#c62828',
    warning: '#e65100',
    gray: '#616161',
    lightGray: '#e0e0e0',
    white: '#ffffff',
    black: '#212121',
    tableHeader: '#1a237e',
    tableRowEven: '#f5f5f5',
    tableRowOdd: '#ffffff',
};

const FONTS = {
    title: 'Helvetica-Bold',
    subtitle: 'Helvetica-Bold',
    body: 'Helvetica',
    bold: 'Helvetica-Bold',
};

const MARGINS = { top: 50, bottom: 50, left: 50, right: 50 };
const PAGE_WIDTH = 595.28; // A4
const CONTENT_WIDTH = PAGE_WIDTH - MARGINS.left - MARGINS.right;

// =============================================================================
// Service
// =============================================================================

export class PdfExportService implements ExportStrategy {

    getExtension(): string {
        return 'pdf';
    }

    getContentType(): string {
        return 'application/pdf';
    }

    /**
     * Génère un relevé de compte individuel
     */
    async genererReleveCompte(data: ReleveCompteData): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({
                size: 'A4',
                margins: MARGINS,
                info: {
                    Title: `Relevé de compte - ${data.membre.nom}`,
                    Author: data.header.tontineName,
                    Subject: 'Relevé de compte',
                },
            });

            const chunks: Buffer[] = [];
            doc.on('data', (chunk: Buffer) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // En-tête
            this.drawReportHeader(doc, data.header);

            // Infos membre
            this.drawMemberCard(doc, data.membre);

            // Résumé financier
            this.drawFinancialSummary(doc, data.solde);

            // Détail du prêt (si applicable)
            if (data.pret) {
                this.drawLoanSection(doc, data.pret);
            }

            // Tableau des transactions
            this.drawTransactionTable(doc, data.transactions);

            // Pied de page
            this.drawFooter(doc, data.header);

            doc.end();
        });
    }

    /**
     * Génère un rapport de fin d'exercice
     */
    async genererRapportExercice(data: RapportExerciceData): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({
                size: 'A4',
                margins: MARGINS,
                info: {
                    Title: `Rapport d'exercice - ${data.header.tontineName}`,
                    Author: data.header.tontineName,
                    Subject: 'Rapport de fin d\'exercice',
                },
            });

            const chunks: Buffer[] = [];
            doc.on('data', (chunk: Buffer) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // En-tête
            this.drawReportHeader(doc, data.header);

            // Résumé global
            this.drawExerciceSummary(doc, data.resume);

            // Tableau des membres
            doc.addPage();
            this.drawReportHeader(doc, { ...data.header, reportTitle: 'Détail par Membre' });
            this.drawMembresTable(doc, data.membresDetail);

            // Tableau des réunions
            if (doc.y > 600) doc.addPage();
            this.drawSectionTitle(doc, 'Historique des Réunions');
            this.drawReunionsTable(doc, data.reunions);

            // Pied de page
            this.drawFooter(doc, data.header);

            doc.end();
        });
    }

    /**
     * Génère un rapport mensuel
     */
    async genererRapportMensuel(data: RapportMensuelData): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({
                size: 'A4',
                margins: MARGINS,
                info: {
                    Title: `Rapport mensuel - ${data.header.tontineName}`,
                    Author: data.header.tontineName,
                    Subject: 'Rapport mensuel',
                },
            });

            const chunks: Buffer[] = [];
            doc.on('data', (chunk: Buffer) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // En-tête
            this.drawReportHeader(doc, data.header);

            // Infos réunion
            this.drawReunionCard(doc, data.reunion);

            // Totaux
            this.drawMonthlyTotals(doc, data.totaux);

            // Tableau cotisations
            this.drawSectionTitle(doc, 'Cotisations');
            this.drawCotisationsTable(doc, data.cotisations);

            // Remboursements de prêts
            if (data.prets.length > 0) {
                this.drawSectionTitle(doc, 'Remboursements de Prêts');
                this.drawPretsTable(doc, data.prets);
            }

            // Pénalités
            if (data.penalites.length > 0) {
                this.drawSectionTitle(doc, 'Pénalités');
                this.drawPenalitesTable(doc, data.penalites);
            }

            this.drawFooter(doc, data.header);

            doc.end();
        });
    }

    // ===========================================================================
    // COMPOSANTS RÉUTILISABLES
    // ===========================================================================

    /**
     * En-tête de rapport avec bandeau coloré
     */
    private drawReportHeader(doc: PDFKit.PDFDocument, header: PdfReportHeader): void {
        const startY = doc.y;

        // Bandeau bleu
        doc.rect(0, startY, PAGE_WIDTH, 80)
            .fill(COLORS.primary);

        // Nom de la tontine
        doc.font(FONTS.title)
            .fontSize(20)
            .fillColor(COLORS.white)
            .text(header.tontineName.toUpperCase(), MARGINS.left, startY + 15, {
                width: CONTENT_WIDTH,
                align: 'center',
            });

        // Titre du rapport
        doc.font(FONTS.body)
            .fontSize(12)
            .fillColor('#bbdefb')
            .text(header.reportTitle, MARGINS.left, startY + 42, {
                width: CONTENT_WIDTH,
                align: 'center',
            });

        // Ligne d'accent
        doc.rect(MARGINS.left, startY + 80, CONTENT_WIDTH, 3)
            .fill('#ffd600');

        doc.y = startY + 95;

        // Sous-titre et période
        if (header.subtitle || header.periode) {
            doc.font(FONTS.body)
                .fontSize(10)
                .fillColor(COLORS.gray);

            if (header.subtitle) {
                doc.text(header.subtitle, MARGINS.left, doc.y, { width: CONTENT_WIDTH, align: 'center' });
            }
            if (header.periode) {
                doc.text(`Période : ${header.periode}`, MARGINS.left, doc.y, { width: CONTENT_WIDTH, align: 'center' });
            }
            doc.moveDown(0.5);
        }

        // Date de génération
        doc.font(FONTS.body)
            .fontSize(8)
            .fillColor(COLORS.gray)
            .text(`Généré le ${header.genereLe.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
                MARGINS.left, doc.y, { width: CONTENT_WIDTH, align: 'right' });

        doc.moveDown(1);
    }

    /**
     * Carte d'information membre
     */
    private drawMemberCard(doc: PDFKit.PDFDocument, membre: ReleveCompteData['membre']): void {
        const startY = doc.y;
        const cardHeight = 60;

        // Fond de carte
        doc.roundedRect(MARGINS.left, startY, CONTENT_WIDTH, cardHeight, 5)
            .fill('#e8eaf6');

        // Icône membre (cercle)
        doc.circle(MARGINS.left + 25, startY + cardHeight / 2, 15)
            .fill(COLORS.primary);
        doc.font(FONTS.bold)
            .fontSize(14)
            .fillColor(COLORS.white)
            .text(membre.nom.charAt(0).toUpperCase(), MARGINS.left + 17, startY + cardHeight / 2 - 8);

        // Informations
        const infoX = MARGINS.left + 55;
        doc.font(FONTS.bold)
            .fontSize(13)
            .fillColor(COLORS.black)
            .text(membre.nom, infoX, startY + 10);

        doc.font(FONTS.body)
            .fontSize(9)
            .fillColor(COLORS.gray)
            .text(`${membre.role} • ${membre.parts} part(s)${membre.matricule ? ` • Matricule: ${membre.matricule}` : ''}`,
                infoX, startY + 28);

        doc.y = startY + cardHeight + 15;
    }

    /**
     * Résumé financier avec 4 blocs colorés
     */
    private drawFinancialSummary(doc: PDFKit.PDFDocument, solde: ReleveCompteData['solde']): void {
        this.drawSectionTitle(doc, 'Résumé Financier');

        const boxWidth = (CONTENT_WIDTH - 15) / 4;
        const boxHeight = 55;
        const startY = doc.y;

        const boxes = [
            { label: 'Total Cotisé', value: solde.totalCotise, color: COLORS.accent, bgColor: '#e3f2fd' },
            { label: 'Dettes', value: solde.totalDettes, color: COLORS.danger, bgColor: '#ffebee' },
            { label: 'Épargne', value: solde.totalEpargne, color: COLORS.success, bgColor: '#e8f5e9' },
            { label: 'Secours payé', value: solde.totalSecours, color: COLORS.warning, bgColor: '#fff3e0' },
        ];

        boxes.forEach((box, i) => {
            const x = MARGINS.left + i * (boxWidth + 5);

            doc.roundedRect(x, startY, boxWidth, boxHeight, 4)
                .fill(box.bgColor);

            // Barre de couleur en haut
            doc.rect(x, startY, boxWidth, 3)
                .fill(box.color);

            doc.font(FONTS.body)
                .fontSize(8)
                .fillColor(COLORS.gray)
                .text(box.label, x + 8, startY + 10, { width: boxWidth - 16 });

            doc.font(FONTS.bold)
                .fontSize(12)
                .fillColor(box.color)
                .text(this.formatMontant(box.value), x + 8, startY + 25, { width: boxWidth - 16 });
        });

        doc.y = startY + boxHeight + 15;
    }

    /**
     * Section prêt en cours
     */
    private drawLoanSection(doc: PDFKit.PDFDocument, pret: NonNullable<ReleveCompteData['pret']>): void {
        this.drawSectionTitle(doc, 'Prêt en Cours');

        const startY = doc.y;
        doc.roundedRect(MARGINS.left, startY, CONTENT_WIDTH, 50, 4)
            .fill('#fff3e0');
        doc.rect(MARGINS.left, startY, 3, 50)
            .fill(COLORS.warning);

        const col1X = MARGINS.left + 15;
        const col2X = MARGINS.left + CONTENT_WIDTH / 3;
        const col3X = MARGINS.left + (2 * CONTENT_WIDTH) / 3;

        doc.font(FONTS.body).fontSize(8).fillColor(COLORS.gray)
            .text('Capital emprunté', col1X, startY + 8)
            .text('Capital restant', col2X, startY + 8)
            .text('Échéance', col3X, startY + 8);

        doc.font(FONTS.bold).fontSize(11).fillColor(COLORS.black)
            .text(this.formatMontant(pret.montantCapital), col1X, startY + 22)
            .text(this.formatMontant(pret.capitalRestant), col2X, startY + 22)
            .text(pret.dateEcheance || 'N/A', col3X, startY + 22);

        // Badge statut
        const statutColor = pret.statut === 'EN_COURS' ? COLORS.warning : COLORS.success;
        doc.roundedRect(col3X + 80, startY + 8, 60, 16, 3).fill(statutColor);
        doc.font(FONTS.bold).fontSize(7).fillColor(COLORS.white)
            .text(pret.statut, col3X + 85, startY + 12);

        doc.y = startY + 65;
    }

    /**
     * Tableau des transactions
     */
    private drawTransactionTable(doc: PDFKit.PDFDocument, transactions: ReleveCompteData['transactions']): void {
        this.drawSectionTitle(doc, 'Détail des Transactions');

        const columns: PdfTableColumn[] = [
            { header: 'Date', key: 'date', width: 70, align: 'left' },
            { header: 'Réf.', key: 'reference', width: 80, align: 'left' },
            { header: 'Type', key: 'type', width: 85, align: 'left' },
            { header: 'Description', key: 'description', width: 120, align: 'left' },
            { header: 'Débit', key: 'debit', width: 65, align: 'right' },
            { header: 'Crédit', key: 'credit', width: 65, align: 'right' },
        ];

        this.drawTable(doc, columns, transactions.map(tx => ({
            ...tx,
            date: tx.date.substring(0, 10),
            reference: tx.reference.substring(0, 12),
            debit: tx.debit > 0 ? this.formatMontant(tx.debit) : '',
            credit: tx.credit > 0 ? this.formatMontant(tx.credit) : '',
        })));
    }

    /**
     * Résumé exercice (rapport annuel)
     */
    private drawExerciceSummary(doc: PDFKit.PDFDocument, resume: RapportExerciceData['resume']): void {
        this.drawSectionTitle(doc, 'Résumé de l\'Exercice');

        const items = [
            { label: 'Nombre de membres', value: String(resume.totalMembres), color: COLORS.accent },
            { label: 'Total cotisations collectées', value: this.formatMontant(resume.totalCotisations), color: COLORS.success },
            { label: 'Total distribué aux bénéficiaires', value: this.formatMontant(resume.totalDistributions), color: COLORS.accent },
            { label: 'Total prêts accordés', value: this.formatMontant(resume.totalPrets), color: COLORS.warning },
            { label: 'Total pénalités perçues', value: this.formatMontant(resume.totalPenalites), color: COLORS.danger },
            { label: 'Total dépenses secours', value: this.formatMontant(resume.totalSecours), color: COLORS.warning },
            { label: 'Solde épargne collectif', value: this.formatMontant(resume.soldeEpargne), color: COLORS.success },
        ];

        const startY = doc.y;
        const itemHeight = 28;

        items.forEach((item, i) => {
            const y = startY + i * itemHeight;
            const bgColor = i % 2 === 0 ? '#f5f5f5' : COLORS.white;

            doc.rect(MARGINS.left, y, CONTENT_WIDTH, itemHeight).fill(bgColor);
            doc.rect(MARGINS.left, y, 4, itemHeight).fill(item.color);

            doc.font(FONTS.body).fontSize(10).fillColor(COLORS.black)
                .text(item.label, MARGINS.left + 15, y + 8);

            doc.font(FONTS.bold).fontSize(11).fillColor(item.color)
                .text(item.value, MARGINS.left + 15, y + 8, { width: CONTENT_WIDTH - 30, align: 'right' });
        });

        doc.y = startY + items.length * itemHeight + 15;
    }

    /**
     * Tableau des membres (rapport exercice)
     */
    private drawMembresTable(doc: PDFKit.PDFDocument, membres: RapportExerciceData['membresDetail']): void {
        const columns: PdfTableColumn[] = [
            { header: 'Membre', key: 'nom', width: 120, align: 'left' },
            { header: 'Rôle', key: 'role', width: 65, align: 'center' },
            { header: 'Parts', key: 'parts', width: 35, align: 'center' },
            { header: 'Cotisé', key: 'cotise', width: 75, align: 'right' },
            { header: 'Reçu', key: 'recu', width: 75, align: 'right' },
            { header: 'Dettes', key: 'dettes', width: 65, align: 'right' },
            { header: 'Statut', key: 'statut', width: 55, align: 'center' },
        ];

        this.drawTable(doc, columns, membres.map(m => ({
            ...m,
            parts: String(m.parts),
            cotise: this.formatMontant(m.cotise),
            recu: this.formatMontant(m.recu),
            dettes: m.dettes > 0 ? this.formatMontant(m.dettes) : '-',
        })));
    }

    /**
     * Tableau des réunions (rapport exercice)
     */
    private drawReunionsTable(doc: PDFKit.PDFDocument, reunions: RapportExerciceData['reunions']): void {
        const columns: PdfTableColumn[] = [
            { header: '#', key: 'numero', width: 30, align: 'center' },
            { header: 'Date', key: 'date', width: 80, align: 'left' },
            { header: 'Lieu', key: 'lieu', width: 100, align: 'left' },
            { header: 'Bénéficiaire', key: 'beneficiaire', width: 120, align: 'left' },
            { header: 'Distribué', key: 'montantDistribue', width: 80, align: 'right' },
            { header: 'Statut', key: 'statut', width: 65, align: 'center' },
        ];

        this.drawTable(doc, columns, reunions.map(r => ({
            ...r,
            numero: String(r.numero),
            date: r.date.substring(0, 10),
            montantDistribue: this.formatMontant(r.montantDistribue),
        })));
    }

    // Info réunion (rapport mensuel)
    private drawReunionCard(doc: PDFKit.PDFDocument, reunion: RapportMensuelData['reunion']): void {
        const startY = doc.y;
        doc.roundedRect(MARGINS.left, startY, CONTENT_WIDTH, 55, 5).fill('#e8eaf6');

        doc.font(FONTS.bold).fontSize(12).fillColor(COLORS.primary)
            .text(`Réunion N°${reunion.numero}`, MARGINS.left + 15, startY + 8);
        doc.font(FONTS.body).fontSize(9).fillColor(COLORS.gray)
            .text(`${reunion.date.substring(0, 10)} • ${reunion.lieu}`, MARGINS.left + 15, startY + 25);
        doc.font(FONTS.bold).fontSize(10).fillColor(COLORS.success)
            .text(`Bénéficiaire : ${reunion.beneficiaire} → ${this.formatMontant(reunion.montantDistribue)}`,
                MARGINS.left + 15, startY + 40);

        doc.y = startY + 70;
    }

    // Totaux mensuels
    private drawMonthlyTotals(doc: PDFKit.PDFDocument, totaux: RapportMensuelData['totaux']): void {
        const boxWidth = (CONTENT_WIDTH - 10) / 4;
        const startY = doc.y;

        const items = [
            { label: 'Cotisations', value: totaux.totalCotisations, color: COLORS.accent },
            { label: 'Remboursements', value: totaux.totalRemboursements, color: COLORS.success },
            { label: 'Pénalités', value: totaux.totalPenalites, color: COLORS.danger },
            { label: 'Total réunion', value: totaux.totalReunion, color: COLORS.primary },
        ];

        items.forEach((item, i) => {
            const x = MARGINS.left + i * (boxWidth + 3);
            doc.roundedRect(x, startY, boxWidth, 45, 3).fill(COLORS.white).stroke(COLORS.lightGray);
            doc.rect(x, startY, boxWidth, 3).fill(item.color);
            doc.font(FONTS.body).fontSize(7).fillColor(COLORS.gray)
                .text(item.label, x + 6, startY + 10, { width: boxWidth - 12 });
            doc.font(FONTS.bold).fontSize(10).fillColor(item.color)
                .text(this.formatMontant(item.value), x + 6, startY + 24, { width: boxWidth - 12 });
        });

        doc.y = startY + 60;
    }

    // Cotisations (rapport mensuel)
    private drawCotisationsTable(doc: PDFKit.PDFDocument, cotisations: RapportMensuelData['cotisations']): void {
        const columns: PdfTableColumn[] = [
            { header: 'Membre', key: 'membre', width: 150, align: 'left' },
            { header: 'Dû', key: 'montantDu', width: 80, align: 'right' },
            { header: 'Payé', key: 'montantPaye', width: 80, align: 'right' },
            { header: 'Reste', key: 'soldeRestant', width: 80, align: 'right' },
            { header: 'Statut', key: 'statut', width: 70, align: 'center' },
        ];

        this.drawTable(doc, columns, cotisations.map(c => ({
            ...c,
            montantDu: this.formatMontant(c.montantDu),
            montantPaye: this.formatMontant(c.montantPaye),
            soldeRestant: c.soldeRestant > 0 ? this.formatMontant(c.soldeRestant) : '-',
        })));
    }

    // Prêts (rapport mensuel)
    private drawPretsTable(doc: PDFKit.PDFDocument, prets: RapportMensuelData['prets']): void {
        const columns: PdfTableColumn[] = [
            { header: 'Membre', key: 'membre', width: 180, align: 'left' },
            { header: 'Remboursé', key: 'montantRembourse', width: 120, align: 'right' },
            { header: 'Capital restant', key: 'capitalRestant', width: 120, align: 'right' },
        ];

        this.drawTable(doc, columns, prets.map(p => ({
            ...p,
            montantRembourse: this.formatMontant(p.montantRembourse),
            capitalRestant: this.formatMontant(p.capitalRestant),
        })));
    }

    // Pénalités (rapport mensuel)
    private drawPenalitesTable(doc: PDFKit.PDFDocument, penalites: RapportMensuelData['penalites']): void {
        const columns: PdfTableColumn[] = [
            { header: 'Membre', key: 'membre', width: 130, align: 'left' },
            { header: 'Motif', key: 'motif', width: 150, align: 'left' },
            { header: 'Montant', key: 'montant', width: 80, align: 'right' },
            { header: 'Statut', key: 'statut', width: 70, align: 'center' },
        ];

        this.drawTable(doc, columns, penalites.map(p => ({
            ...p,
            montant: this.formatMontant(p.montant),
        })));
    }

    // ===========================================================================
    // UTILITAIRES
    // ===========================================================================

    /**
     * Dessine un titre de section
     */
    private drawSectionTitle(doc: PDFKit.PDFDocument, title: string): void {
        if (doc.y > 700) doc.addPage();

        doc.font(FONTS.bold)
            .fontSize(12)
            .fillColor(COLORS.primary)
            .text(title, MARGINS.left, doc.y);

        doc.rect(MARGINS.left, doc.y + 2, 40, 2).fill('#ffd600');
        doc.moveDown(0.8);
    }

    /**
     * Dessine un tableau générique avec en-tête coloré et lignes alternées
     */
    private drawTable(doc: PDFKit.PDFDocument, columns: PdfTableColumn[], rows: Record<string, unknown>[]): void {
        const rowHeight = 20;
        const headerHeight = 22;
        let currentY = doc.y;

        // En-tête du tableau
        doc.rect(MARGINS.left, currentY, CONTENT_WIDTH, headerHeight)
            .fill(COLORS.tableHeader);

        let colX = MARGINS.left;
        columns.forEach(col => {
            doc.font(FONTS.bold)
                .fontSize(8)
                .fillColor(COLORS.white)
                .text(col.header, colX + 5, currentY + 6, {
                    width: col.width - 10,
                    align: col.align || 'left',
                });
            colX += col.width;
        });

        currentY += headerHeight;

        // Lignes de données
        rows.forEach((row, index) => {
            // Saut de page si nécessaire
            if (currentY + rowHeight > 750) {
                doc.addPage();
                currentY = MARGINS.top;

                // Re-dessiner l'en-tête
                doc.rect(MARGINS.left, currentY, CONTENT_WIDTH, headerHeight)
                    .fill(COLORS.tableHeader);
                let reColX = MARGINS.left;
                columns.forEach(col => {
                    doc.font(FONTS.bold).fontSize(8).fillColor(COLORS.white)
                        .text(col.header, reColX + 5, currentY + 6, { width: col.width - 10, align: col.align || 'left' });
                    reColX += col.width;
                });
                currentY += headerHeight;
            }

            const bgColor = index % 2 === 0 ? COLORS.tableRowEven : COLORS.tableRowOdd;
            doc.rect(MARGINS.left, currentY, CONTENT_WIDTH, rowHeight).fill(bgColor);

            colX = MARGINS.left;
            columns.forEach(col => {
                const value = String(row[col.key] ?? '');
                doc.font(FONTS.body)
                    .fontSize(8)
                    .fillColor(COLORS.black)
                    .text(value, colX + 5, currentY + 5, {
                        width: col.width - 10,
                        align: col.align || 'left',
                        lineBreak: false,
                    });
                colX += col.width;
            });

            currentY += rowHeight;
        });

        // Ligne de séparation
        doc.rect(MARGINS.left, currentY, CONTENT_WIDTH, 1).fill(COLORS.lightGray);

        doc.y = currentY + 15;
    }

    /**
     * Pied de page
     */
    private drawFooter(doc: PDFKit.PDFDocument, header: PdfReportHeader): void {
        const pages = doc.bufferedPageRange();
        for (let i = pages.start; i < pages.start + pages.count; i++) {
            doc.switchToPage(i);

            // Ligne
            doc.rect(MARGINS.left, 780, CONTENT_WIDTH, 0.5).fill(COLORS.lightGray);

            // Texte
            doc.font(FONTS.body).fontSize(7).fillColor(COLORS.gray)
                .text(`${header.tontineName} — Document confidentiel`,
                    MARGINS.left, 785, { width: CONTENT_WIDTH / 2 })
                .text(`Page ${i + 1} / ${pages.count}`,
                    MARGINS.left + CONTENT_WIDTH / 2, 785, { width: CONTENT_WIDTH / 2, align: 'right' });
        }
    }

    /**
     * Formate un montant en FCFA
     */
    private formatMontant(montant: number): string {
        return new Intl.NumberFormat('fr-FR', {
            style: 'decimal',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(montant) + ' FCFA';
    }
}

export const pdfExportService = new PdfExportService();
