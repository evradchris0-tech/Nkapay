/**
 * Service de génération Excel
 * Utilise ExcelJS pour créer des classeurs formatés professionnels
 *
 * Conventions de style:
 * - En-tête: fond bleu foncé (#1a237e), texte blanc, gras
 * - Lignes alternées: gris clair / blanc
 * - Montants: format numérique avec séparateur de milliers
 * - Colonnes auto-dimensionnées
 */

import ExcelJS from 'exceljs';
import {
    ReleveCompteData,
    RapportExerciceData,
    RapportMensuelData,
} from './pdf-export.service';

// =============================================================================
// Constantes de style
// =============================================================================

const HEADER_FILL: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1A237E' },
};

const HEADER_FONT: Partial<ExcelJS.Font> = {
    bold: true,
    color: { argb: 'FFFFFFFF' },
    size: 11,
};

const TITLE_FONT: Partial<ExcelJS.Font> = {
    bold: true,
    size: 16,
    color: { argb: 'FF1A237E' },
};

const SUBTITLE_FONT: Partial<ExcelJS.Font> = {
    bold: true,
    size: 12,
    color: { argb: 'FF0D47A1' },
};

const CURRENCY_FORMAT = '#,##0 "FCFA"';
const DATE_FORMAT = 'DD/MM/YYYY';

const EVEN_ROW_FILL: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF5F5F5' },
};

const BORDER_STYLE: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
    bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
    left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
    right: { style: 'thin', color: { argb: 'FFE0E0E0' } },
};

// =============================================================================
// Service
// =============================================================================

export class ExcelExportService {

    /**
     * Génère un relevé de compte Excel
     */
    async genererReleveCompte(data: ReleveCompteData): Promise<Buffer> {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = data.header.tontineName;
        workbook.created = new Date();

        // === Feuille Résumé ===
        const resumeSheet = workbook.addWorksheet('Résumé', {
            properties: { tabColor: { argb: 'FF1A237E' } },
        });

        // Titre
        this.addTitle(resumeSheet, data.header.tontineName, 1);
        this.addSubtitle(resumeSheet, data.header.reportTitle, 2);
        this.addSubtitle(resumeSheet, `Membre: ${data.membre.nom} | ${data.membre.role} | ${data.membre.parts} part(s)`, 3);

        if (data.header.periode) {
            resumeSheet.getCell('A4').value = `Période: ${data.header.periode}`;
            resumeSheet.getCell('A4').font = { italic: true, color: { argb: 'FF616161' } };
        }

        // Résumé financier
        let row = 6;
        resumeSheet.getCell(`A${row}`).value = 'Résumé Financier';
        resumeSheet.getCell(`A${row}`).font = SUBTITLE_FONT;
        row++;

        const summaryData = [
            ['Total Cotisé', data.solde.totalCotise],
            ['Total Dettes', data.solde.totalDettes],
            ['Total Épargne', data.solde.totalEpargne],
            ['Total Secours payé', data.solde.totalSecours],
        ];

        summaryData.forEach(([label, value], i) => {
            const r = resumeSheet.getRow(row + i);
            r.getCell(1).value = label as string;
            r.getCell(1).font = { bold: true };
            r.getCell(2).value = value as number;
            r.getCell(2).numFmt = CURRENCY_FORMAT;
            r.getCell(2).font = { bold: true, color: { argb: i === 1 ? 'FFC62828' : 'FF2E7D32' } };
        });

        resumeSheet.getColumn(1).width = 25;
        resumeSheet.getColumn(2).width = 20;

        // Prêt (si applicable)
        if (data.pret) {
            row += summaryData.length + 2;
            resumeSheet.getCell(`A${row}`).value = 'Prêt en Cours';
            resumeSheet.getCell(`A${row}`).font = SUBTITLE_FONT;
            row++;

            const pretData = [
                ['Capital emprunté', data.pret.montantCapital],
                ['Capital restant', data.pret.capitalRestant],
                ['Taux d\'intérêt', `${(data.pret.tauxInteret * 100).toFixed(1)}%`],
                ['Date décaissement', data.pret.dateDecaissement],
                ['Date échéance', data.pret.dateEcheance],
                ['Statut', data.pret.statut],
            ];

            pretData.forEach(([label, value], i) => {
                const r = resumeSheet.getRow(row + i);
                r.getCell(1).value = label as string;
                r.getCell(1).font = { bold: true };
                r.getCell(2).value = value;
                if (typeof value === 'number') {
                    r.getCell(2).numFmt = CURRENCY_FORMAT;
                }
            });
        }

        // === Feuille Transactions ===
        const txSheet = workbook.addWorksheet('Transactions', {
            properties: { tabColor: { argb: 'FF0D47A1' } },
        });

        // En-tête
        const txHeaders = ['Date', 'Référence', 'Type', 'Description', 'Débit (FCFA)', 'Crédit (FCFA)', 'Solde (FCFA)'];
        const txHeaderRow = txSheet.getRow(1);
        txHeaders.forEach((header, i) => {
            const cell = txHeaderRow.getCell(i + 1);
            cell.value = header;
            cell.font = HEADER_FONT;
            cell.fill = HEADER_FILL;
            cell.alignment = { horizontal: i >= 4 ? 'right' : 'left', vertical: 'middle' };
            cell.border = BORDER_STYLE;
        });
        txHeaderRow.height = 25;

        // Données
        data.transactions.forEach((tx, i) => {
            const r = txSheet.getRow(i + 2);
            r.getCell(1).value = tx.date.substring(0, 10);
            r.getCell(2).value = tx.reference;
            r.getCell(3).value = tx.type;
            r.getCell(4).value = tx.description;
            r.getCell(5).value = tx.debit || '';
            r.getCell(5).numFmt = CURRENCY_FORMAT;
            r.getCell(6).value = tx.credit || '';
            r.getCell(6).numFmt = CURRENCY_FORMAT;
            r.getCell(7).value = tx.solde;
            r.getCell(7).numFmt = CURRENCY_FORMAT;

            // Lignes alternées
            if (i % 2 === 0) {
                r.eachCell((cell) => { cell.fill = EVEN_ROW_FILL; });
            }
            r.eachCell((cell) => { cell.border = BORDER_STYLE; });

            // Colorer les montants
            if (tx.debit > 0) r.getCell(5).font = { color: { argb: 'FFC62828' } };
            if (tx.credit > 0) r.getCell(6).font = { color: { argb: 'FF2E7D32' } };
        });

        // Auto-largeur
        txSheet.columns = [
            { width: 12 }, { width: 15 }, { width: 18 }, { width: 35 },
            { width: 15 }, { width: 15 }, { width: 15 },
        ];

        // Filtre automatique
        txSheet.autoFilter = { from: 'A1', to: `G${data.transactions.length + 1}` };

        // Figer la première ligne
        txSheet.views = [{ state: 'frozen', ySplit: 1 }];

        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }

    /**
     * Génère un rapport d'exercice Excel
     */
    async genererRapportExercice(data: RapportExerciceData): Promise<Buffer> {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = data.header.tontineName;

        // === Feuille Résumé ===
        const resumeSheet = workbook.addWorksheet('Résumé', {
            properties: { tabColor: { argb: 'FF1A237E' } },
        });

        this.addTitle(resumeSheet, data.header.tontineName, 1);
        this.addSubtitle(resumeSheet, data.header.reportTitle, 2);

        let row = 4;
        const resumeItems = [
            ['Nombre de membres', data.resume.totalMembres],
            ['Total cotisations', data.resume.totalCotisations],
            ['Total distribué', data.resume.totalDistributions],
            ['Total prêts', data.resume.totalPrets],
            ['Total pénalités', data.resume.totalPenalites],
            ['Total secours', data.resume.totalSecours],
            ['Solde épargne', data.resume.soldeEpargne],
        ];

        resumeItems.forEach(([label, value], i) => {
            const r = resumeSheet.getRow(row + i);
            r.getCell(1).value = label as string;
            r.getCell(1).font = { bold: true, size: 11 };
            r.getCell(2).value = value;
            if (typeof value === 'number' && i > 0) r.getCell(2).numFmt = CURRENCY_FORMAT;
            r.getCell(2).font = { bold: true, size: 11, color: { argb: 'FF1A237E' } };
            r.getCell(2).alignment = { horizontal: 'right' };
        });

        resumeSheet.getColumn(1).width = 30;
        resumeSheet.getColumn(2).width = 25;

        // === Feuille Membres ===
        const membresSheet = workbook.addWorksheet('Membres', {
            properties: { tabColor: { argb: 'FF2E7D32' } },
        });

        const mHeaders = ['Membre', 'Rôle', 'Parts', 'Cotisé (FCFA)', 'Reçu (FCFA)', 'Dettes (FCFA)', 'Statut'];
        this.addTableHeader(membresSheet, mHeaders, 1);

        data.membresDetail.forEach((m, i) => {
            const r = membresSheet.getRow(i + 2);
            r.getCell(1).value = m.nom;
            r.getCell(2).value = m.role;
            r.getCell(3).value = m.parts;
            r.getCell(3).alignment = { horizontal: 'center' };
            r.getCell(4).value = m.cotise;
            r.getCell(4).numFmt = CURRENCY_FORMAT;
            r.getCell(5).value = m.recu;
            r.getCell(5).numFmt = CURRENCY_FORMAT;
            r.getCell(6).value = m.dettes;
            r.getCell(6).numFmt = CURRENCY_FORMAT;
            if (m.dettes > 0) r.getCell(6).font = { color: { argb: 'FFC62828' }, bold: true };
            r.getCell(7).value = m.statut;

            if (i % 2 === 0) r.eachCell(cell => { cell.fill = EVEN_ROW_FILL; });
            r.eachCell(cell => { cell.border = BORDER_STYLE; });
        });

        membresSheet.columns = [
            { width: 25 }, { width: 15 }, { width: 8 }, { width: 18 },
            { width: 18 }, { width: 15 }, { width: 12 },
        ];
        membresSheet.autoFilter = { from: 'A1', to: `G${data.membresDetail.length + 1}` };
        membresSheet.views = [{ state: 'frozen', ySplit: 1 }];

        // === Feuille Réunions ===
        const reunionsSheet = workbook.addWorksheet('Réunions', {
            properties: { tabColor: { argb: 'FFE65100' } },
        });

        const rHeaders = ['N°', 'Date', 'Lieu', 'Bénéficiaire', 'Montant distribué (FCFA)', 'Statut'];
        this.addTableHeader(reunionsSheet, rHeaders, 1);

        data.reunions.forEach((r, i) => {
            const row = reunionsSheet.getRow(i + 2);
            row.getCell(1).value = r.numero;
            row.getCell(1).alignment = { horizontal: 'center' };
            row.getCell(2).value = r.date.substring(0, 10);
            row.getCell(3).value = r.lieu;
            row.getCell(4).value = r.beneficiaire;
            row.getCell(5).value = r.montantDistribue;
            row.getCell(5).numFmt = CURRENCY_FORMAT;
            row.getCell(6).value = r.statut;

            if (i % 2 === 0) row.eachCell(cell => { cell.fill = EVEN_ROW_FILL; });
            row.eachCell(cell => { cell.border = BORDER_STYLE; });
        });

        reunionsSheet.columns = [
            { width: 5 }, { width: 12 }, { width: 20 }, { width: 25 }, { width: 22 }, { width: 12 },
        ];

        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }

    /**
     * Génère un rapport mensuel Excel
     */
    async genererRapportMensuel(data: RapportMensuelData): Promise<Buffer> {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = data.header.tontineName;

        // === Feuille principale ===
        const sheet = workbook.addWorksheet(`Réunion ${data.reunion.numero}`, {
            properties: { tabColor: { argb: 'FF1A237E' } },
        });

        this.addTitle(sheet, data.header.tontineName, 1);
        this.addSubtitle(sheet, `Rapport Réunion N°${data.reunion.numero} — ${data.reunion.date.substring(0, 10)}`, 2);

        // Infos réunion
        sheet.getCell('A4').value = 'Lieu:';
        sheet.getCell('A4').font = { bold: true };
        sheet.getCell('B4').value = data.reunion.lieu;
        sheet.getCell('A5').value = 'Bénéficiaire:';
        sheet.getCell('A5').font = { bold: true };
        sheet.getCell('B5').value = data.reunion.beneficiaire;
        sheet.getCell('A6').value = 'Montant distribué:';
        sheet.getCell('A6').font = { bold: true };
        sheet.getCell('B6').value = data.reunion.montantDistribue;
        sheet.getCell('B6').numFmt = CURRENCY_FORMAT;
        sheet.getCell('B6').font = { bold: true, color: { argb: 'FF2E7D32' } };

        // Totaux
        let row = 8;
        sheet.getCell(`A${row}`).value = 'Totaux';
        sheet.getCell(`A${row}`).font = SUBTITLE_FONT;
        row++;

        const totauxItems = [
            ['Total Cotisations', data.totaux.totalCotisations],
            ['Total Remboursements', data.totaux.totalRemboursements],
            ['Total Pénalités', data.totaux.totalPenalites],
            ['TOTAL RÉUNION', data.totaux.totalReunion],
        ];

        totauxItems.forEach(([label, value], i) => {
            const r = sheet.getRow(row + i);
            r.getCell(1).value = label as string;
            r.getCell(1).font = i === totauxItems.length - 1 ? { bold: true, size: 12 } : { bold: true };
            r.getCell(2).value = value;
            r.getCell(2).numFmt = CURRENCY_FORMAT;
            r.getCell(2).font = i === totauxItems.length - 1
                ? { bold: true, size: 12, color: { argb: 'FF1A237E' } }
                : { bold: true };
        });

        sheet.getColumn(1).width = 25;
        sheet.getColumn(2).width = 22;

        // === Feuille Cotisations ===
        const cotSheet = workbook.addWorksheet('Cotisations', {
            properties: { tabColor: { argb: 'FF0D47A1' } },
        });

        const cHeaders = ['Membre', 'Montant dû (FCFA)', 'Montant payé (FCFA)', 'Reste (FCFA)', 'Statut'];
        this.addTableHeader(cotSheet, cHeaders, 1);

        data.cotisations.forEach((c, i) => {
            const r = cotSheet.getRow(i + 2);
            r.getCell(1).value = c.membre;
            r.getCell(2).value = c.montantDu;
            r.getCell(2).numFmt = CURRENCY_FORMAT;
            r.getCell(3).value = c.montantPaye;
            r.getCell(3).numFmt = CURRENCY_FORMAT;
            r.getCell(4).value = c.soldeRestant;
            r.getCell(4).numFmt = CURRENCY_FORMAT;
            if (c.soldeRestant > 0) r.getCell(4).font = { color: { argb: 'FFC62828' }, bold: true };
            r.getCell(5).value = c.statut;

            if (i % 2 === 0) r.eachCell(cell => { cell.fill = EVEN_ROW_FILL; });
            r.eachCell(cell => { cell.border = BORDER_STYLE; });
        });

        cotSheet.columns = [
            { width: 25 }, { width: 18 }, { width: 18 }, { width: 15 }, { width: 12 },
        ];
        cotSheet.views = [{ state: 'frozen', ySplit: 1 }];

        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }

    // ===========================================================================
    // UTILITAIRES
    // ===========================================================================

    private addTitle(sheet: ExcelJS.Worksheet, text: string, row: number): void {
        sheet.mergeCells(`A${row}:G${row}`);
        const cell = sheet.getCell(`A${row}`);
        cell.value = text;
        cell.font = TITLE_FONT;
        cell.alignment = { horizontal: 'center' };
        sheet.getRow(row).height = 30;
    }

    private addSubtitle(sheet: ExcelJS.Worksheet, text: string, row: number): void {
        sheet.mergeCells(`A${row}:G${row}`);
        const cell = sheet.getCell(`A${row}`);
        cell.value = text;
        cell.font = SUBTITLE_FONT;
        cell.alignment = { horizontal: 'center' };
    }

    private addTableHeader(sheet: ExcelJS.Worksheet, headers: string[], rowNum: number): void {
        const headerRow = sheet.getRow(rowNum);
        headers.forEach((header, i) => {
            const cell = headerRow.getCell(i + 1);
            cell.value = header;
            cell.font = HEADER_FONT;
            cell.fill = HEADER_FILL;
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = BORDER_STYLE;
        });
        headerRow.height = 25;
    }
}

export const excelExportService = new ExcelExportService();
