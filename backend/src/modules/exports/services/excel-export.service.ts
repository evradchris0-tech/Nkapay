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
import { ExportStrategy } from '../interfaces/export-strategy.interface';
import {
  ReleveCompteData,
  RapportExerciceData,
  RapportMensuelData,
  ListeMembresData,
  RapportOrganisationData,
  PortefeuillePretsData,
  PresencesAssiduiteData,
  CotisationsArrieresData,
  EvenementsSecoursData,
  BilanFinancierAnnuelData,
} from '../types/export-data.types';

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

export class ExcelExportService implements ExportStrategy {
  getExtension(): string {
    return 'xlsx';
  }

  getContentType(): string {
    return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  }

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
    this.addSubtitle(
      resumeSheet,
      `Membre: ${data.membre.nom} | ${data.membre.role} | ${data.membre.parts} part(s)`,
      3
    );

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
        ["Taux d'intérêt", `${(data.pret.tauxInteret * 100).toFixed(1)}%`],
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
    const txHeaders = [
      'Date',
      'Référence',
      'Type',
      'Description',
      'Débit (FCFA)',
      'Crédit (FCFA)',
      'Solde (FCFA)',
    ];
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
        r.eachCell((cell) => {
          cell.fill = EVEN_ROW_FILL;
        });
      }
      r.eachCell((cell) => {
        cell.border = BORDER_STYLE;
      });

      // Colorer les montants
      if (tx.debit > 0) r.getCell(5).font = { color: { argb: 'FFC62828' } };
      if (tx.credit > 0) r.getCell(6).font = { color: { argb: 'FF2E7D32' } };
    });

    // Auto-largeur
    txSheet.columns = [
      { width: 12 },
      { width: 15 },
      { width: 18 },
      { width: 35 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
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

    const row = 4;
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

    const mHeaders = [
      'Membre',
      'Rôle',
      'Parts',
      'Cotisé (FCFA)',
      'Reçu (FCFA)',
      'Dettes (FCFA)',
      'Statut',
    ];
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

      if (i % 2 === 0)
        r.eachCell((cell) => {
          cell.fill = EVEN_ROW_FILL;
        });
      r.eachCell((cell) => {
        cell.border = BORDER_STYLE;
      });
    });

    membresSheet.columns = [
      { width: 25 },
      { width: 15 },
      { width: 8 },
      { width: 18 },
      { width: 18 },
      { width: 15 },
      { width: 12 },
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

      if (i % 2 === 0)
        row.eachCell((cell) => {
          cell.fill = EVEN_ROW_FILL;
        });
      row.eachCell((cell) => {
        cell.border = BORDER_STYLE;
      });
    });

    reunionsSheet.columns = [
      { width: 5 },
      { width: 12 },
      { width: 20 },
      { width: 25 },
      { width: 22 },
      { width: 12 },
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
    this.addSubtitle(
      sheet,
      `Rapport Réunion N°${data.reunion.numero} — ${data.reunion.date.substring(0, 10)}`,
      2
    );

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
      r.getCell(2).font =
        i === totauxItems.length - 1
          ? { bold: true, size: 12, color: { argb: 'FF1A237E' } }
          : { bold: true };
    });

    sheet.getColumn(1).width = 25;
    sheet.getColumn(2).width = 22;

    // === Feuille Cotisations ===
    const cotSheet = workbook.addWorksheet('Cotisations', {
      properties: { tabColor: { argb: 'FF0D47A1' } },
    });

    const cHeaders = [
      'Membre',
      'Montant dû (FCFA)',
      'Montant payé (FCFA)',
      'Reste (FCFA)',
      'Statut',
    ];
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

      if (i % 2 === 0)
        r.eachCell((cell) => {
          cell.fill = EVEN_ROW_FILL;
        });
      r.eachCell((cell) => {
        cell.border = BORDER_STYLE;
      });
    });

    cotSheet.columns = [{ width: 25 }, { width: 18 }, { width: 18 }, { width: 15 }, { width: 12 }];
    cotSheet.views = [{ state: 'frozen', ySplit: 1 }];

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  // ===========================================================================
  // RAPPORT 4 — LISTE DES MEMBRES
  // ===========================================================================

  async genererListeMembres(data: ListeMembresData): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = data.header.tontineName;

    const sheet = workbook.addWorksheet('Membres', { properties: { tabColor: { argb: 'FF1A237E' } } });
    this.addTitle(sheet, data.header.tontineName, 1);
    this.addSubtitle(sheet, `Liste des Membres — ${data.tontine.nom}`, 2);

    // Résumé
    sheet.getCell('A4').value = `Membres actifs: ${data.totaux.totalActifs}  |  Inactifs: ${data.totaux.totalInactifs}  |  Total: ${data.totaux.totalMembres}`;
    sheet.getCell('A4').font = { italic: true, color: { argb: 'FF616161' } };

    const headers = ['Matricule', 'Prénom', 'Nom', 'Téléphone', 'Rôle', 'Statut', 'Date adhésion', 'Parts'];
    this.addTableHeader(sheet, headers, 6);

    data.membres.forEach((m, i) => {
      const r = sheet.getRow(i + 7);
      r.getCell(1).value = m.matricule;
      r.getCell(2).value = m.prenom;
      r.getCell(3).value = m.nom;
      r.getCell(4).value = m.telephone;
      r.getCell(5).value = m.role;
      r.getCell(6).value = m.statut;
      r.getCell(7).value = m.dateAdhesion;
      r.getCell(8).value = m.nombreParts;
      r.getCell(8).alignment = { horizontal: 'center' };
      if (m.statut !== 'ACTIVE') r.getCell(6).font = { color: { argb: 'FFC62828' } };
      if (i % 2 === 0) r.eachCell((c) => { c.fill = EVEN_ROW_FILL; });
      r.eachCell((c) => { c.border = BORDER_STYLE; });
    });

    sheet.columns = [{ width: 12 }, { width: 18 }, { width: 18 }, { width: 15 }, { width: 12 }, { width: 12 }, { width: 15 }, { width: 7 }];
    sheet.autoFilter = { from: 'A6', to: `H${data.membres.length + 6}` };
    sheet.views = [{ state: 'frozen', ySplit: 6 }];

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  // ===========================================================================
  // RAPPORT 5 — RAPPORT ORGANISATION
  // ===========================================================================

  async genererRapportOrganisation(data: RapportOrganisationData): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = data.organisation.nom;

    // Feuille résumé organisation
    const orgSheet = workbook.addWorksheet('Organisation', { properties: { tabColor: { argb: 'FF1A237E' } } });
    this.addTitle(orgSheet, data.organisation.nom, 1);
    this.addSubtitle(orgSheet, 'Rapport Organisation', 2);

    const orgInfo = [
      ['Nom', data.organisation.nom],
      ['Slug', data.organisation.slug],
      ['Plan', data.organisation.plan],
      ['Pays', data.organisation.pays],
      ['Devise', data.organisation.devise],
      ['Date de création', data.organisation.dateCreation],
      ['Nombre de tontines', data.organisation.nbTontines],
      ['Membres actifs', data.organisation.nbMembresTotal],
    ];
    orgInfo.forEach(([label, value], i) => {
      orgSheet.getCell(`A${i + 4}`).value = label;
      orgSheet.getCell(`A${i + 4}`).font = { bold: true };
      orgSheet.getCell(`B${i + 4}`).value = value;
    });

    const consRow = orgInfo.length + 5;
    orgSheet.getCell(`A${consRow}`).value = 'Consolidation financière';
    orgSheet.getCell(`A${consRow}`).font = SUBTITLE_FONT;
    const cons = data.consolidation;
    [
      ['Total cotisé', cons.totalCotise],
      ['Total distribué', cons.totalDistribue],
      ['Prêts en cours', cons.pretsEnCours],
      ['Capital prêts en cours', cons.pretsEnCoursMontant],
    ].forEach(([label, value], i) => {
      orgSheet.getCell(`A${consRow + 1 + i}`).value = label;
      orgSheet.getCell(`A${consRow + 1 + i}`).font = { bold: true };
      orgSheet.getCell(`B${consRow + 1 + i}`).value = value;
      if (typeof value === 'number' && i !== 2) orgSheet.getCell(`B${consRow + 1 + i}`).numFmt = CURRENCY_FORMAT;
    });
    orgSheet.getColumn(1).width = 28; orgSheet.getColumn(2).width = 25;

    // Feuille tontines
    const tSheet = workbook.addWorksheet('Tontines', { properties: { tabColor: { argb: 'FF2E7D32' } } });
    this.addTableHeader(tSheet, ['Nom', 'Type', 'Statut', 'Membres actifs', 'Exercice actif'], 1);
    data.tontines.forEach((t, i) => {
      const r = tSheet.getRow(i + 2);
      r.getCell(1).value = t.nom; r.getCell(2).value = t.type;
      r.getCell(3).value = t.statut; r.getCell(4).value = t.nbMembres;
      r.getCell(4).alignment = { horizontal: 'center' };
      r.getCell(5).value = t.exerciceActif || 'Aucun';
      if (i % 2 === 0) r.eachCell((c) => { c.fill = EVEN_ROW_FILL; });
      r.eachCell((c) => { c.border = BORDER_STYLE; });
    });
    tSheet.columns = [{ width: 25 }, { width: 15 }, { width: 12 }, { width: 15 }, { width: 25 }];

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  // ===========================================================================
  // RAPPORT 6 — PORTEFEUILLE PRÊTS
  // ===========================================================================

  async genererPortefeuillePrets(data: PortefeuillePretsData): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = data.header.tontineName;

    // Feuille KPIs
    const kpiSheet = workbook.addWorksheet('KPIs', { properties: { tabColor: { argb: 'FF1A237E' } } });
    this.addTitle(kpiSheet, data.header.tontineName, 1);
    this.addSubtitle(kpiSheet, `Portefeuille des Prêts — Exercice ${data.exercice.annee}`, 2);
    const kpis = data.kpis;
    [
      ['Total décaissé', kpis.totalDecaisse, true],
      ['Total remboursé', kpis.totalRembourse, true],
      ['Intérêts collectés', kpis.interetsCollectes, true],
      ['Taux de recouvrement', `${kpis.tauxRecouvrement}%`, false],
      ['Prêts actifs', kpis.nbPretsActifs, false],
      ['Prêts soldés', kpis.nbPretsSoldes, false],
    ].forEach(([label, value, currency], i) => {
      kpiSheet.getCell(`A${i + 4}`).value = label as string;
      kpiSheet.getCell(`A${i + 4}`).font = { bold: true, size: 11 };
      kpiSheet.getCell(`B${i + 4}`).value = value;
      if (currency) kpiSheet.getCell(`B${i + 4}`).numFmt = CURRENCY_FORMAT;
      kpiSheet.getCell(`B${i + 4}`).font = { bold: true, size: 11, color: { argb: 'FF1A237E' } };
    });
    kpiSheet.getColumn(1).width = 28; kpiSheet.getColumn(2).width = 25;

    // Feuille prêts actifs
    if (data.pretsActifs.length > 0) {
      const actSheet = workbook.addWorksheet('Prêts actifs', { properties: { tabColor: { argb: 'FFE65100' } } });
      this.addTableHeader(actSheet, ['Membre', 'Capital (FCFA)', 'Taux %', 'Restant (FCFA)', 'Échéance', 'Statut'], 1);
      data.pretsActifs.forEach((p, i) => {
        const r = actSheet.getRow(i + 2);
        r.getCell(1).value = p.membre; r.getCell(2).value = p.montantCapital; r.getCell(2).numFmt = CURRENCY_FORMAT;
        r.getCell(3).value = p.tauxInteret; r.getCell(3).numFmt = '0.00"%"';
        r.getCell(4).value = p.capitalRestant; r.getCell(4).numFmt = CURRENCY_FORMAT;
        r.getCell(5).value = p.dateEcheance; r.getCell(6).value = p.statut;
        if (i % 2 === 0) r.eachCell((c) => { c.fill = EVEN_ROW_FILL; });
        r.eachCell((c) => { c.border = BORDER_STYLE; });
      });
      actSheet.columns = [{ width: 22 }, { width: 18 }, { width: 10 }, { width: 18 }, { width: 13 }, { width: 12 }];
    }

    // Feuille prêts soldés
    if (data.pretsSoldes.length > 0) {
      const soldSheet = workbook.addWorksheet('Prêts soldés', { properties: { tabColor: { argb: 'FF2E7D32' } } });
      this.addTableHeader(soldSheet, ['Membre', 'Capital (FCFA)', 'Intérêts payés (FCFA)', 'Date soldé'], 1);
      data.pretsSoldes.forEach((p, i) => {
        const r = soldSheet.getRow(i + 2);
        r.getCell(1).value = p.membre; r.getCell(2).value = p.montantCapital; r.getCell(2).numFmt = CURRENCY_FORMAT;
        r.getCell(3).value = p.interetsPaies; r.getCell(3).numFmt = CURRENCY_FORMAT; r.getCell(4).value = p.dateSolde;
        if (i % 2 === 0) r.eachCell((c) => { c.fill = EVEN_ROW_FILL; });
        r.eachCell((c) => { c.border = BORDER_STYLE; });
      });
      soldSheet.columns = [{ width: 22 }, { width: 18 }, { width: 22 }, { width: 13 }];
    }

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  // ===========================================================================
  // RAPPORT 7 — PRÉSENCES & ASSIDUITÉ
  // ===========================================================================

  async genererPresencesAssiduite(data: PresencesAssiduiteData): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = data.header.tontineName;

    // Par membre
    const memSheet = workbook.addWorksheet('Par Membre', { properties: { tabColor: { argb: 'FF1A237E' } } });
    this.addTitle(memSheet, data.header.tontineName, 1);
    this.addSubtitle(memSheet, `Présences & Assiduité — Exercice ${data.exercice.annee}`, 2);
    this.addTableHeader(memSheet, ['Membre', 'Présences', 'Absences', 'Total réunions', 'Taux présence %'], 4);
    data.parMembre.forEach((m, i) => {
      const r = memSheet.getRow(i + 5);
      r.getCell(1).value = m.nom; r.getCell(2).value = m.nbPresences; r.getCell(3).value = m.nbAbsences;
      r.getCell(4).value = m.nbReunionsTotal; r.getCell(5).value = m.tauxPresence / 100;
      r.getCell(5).numFmt = '0%';
      if (m.tauxPresence < 50) r.getCell(5).font = { color: { argb: 'FFC62828' }, bold: true };
      else if (m.tauxPresence >= 80) r.getCell(5).font = { color: { argb: 'FF2E7D32' }, bold: true };
      [2, 3, 4].forEach((col) => { r.getCell(col).alignment = { horizontal: 'center' }; });
      if (i % 2 === 0) r.eachCell((c) => { c.fill = EVEN_ROW_FILL; });
      r.eachCell((c) => { c.border = BORDER_STYLE; });
    });
    memSheet.columns = [{ width: 25 }, { width: 12 }, { width: 12 }, { width: 15 }, { width: 18 }];
    memSheet.autoFilter = { from: 'A4', to: `E${data.parMembre.length + 4}` };

    // Par réunion
    const reunSheet = workbook.addWorksheet('Par Réunion', { properties: { tabColor: { argb: 'FF0D47A1' } } });
    this.addTableHeader(reunSheet, ['N° Réunion', 'Date', 'Présents', 'Absents', 'Taux présence %'], 1);
    data.parReunion.forEach((r, i) => {
      const row = reunSheet.getRow(i + 2);
      row.getCell(1).value = r.numero; row.getCell(1).alignment = { horizontal: 'center' };
      row.getCell(2).value = r.date; row.getCell(3).value = r.nbPresents;
      row.getCell(4).value = r.nbAbsents; row.getCell(5).value = r.tauxPresence / 100; row.getCell(5).numFmt = '0%';
      if (i % 2 === 0) row.eachCell((c) => { c.fill = EVEN_ROW_FILL; });
      row.eachCell((c) => { c.border = BORDER_STYLE; });
    });
    reunSheet.columns = [{ width: 12 }, { width: 13 }, { width: 12 }, { width: 12 }, { width: 18 }];

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  // ===========================================================================
  // RAPPORT 8 — COTISATIONS & ARRIÉRÉS
  // ===========================================================================

  async genererCotisationsArrieres(data: CotisationsArrieresData): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = data.header.tontineName;

    const sheet = workbook.addWorksheet('Cotisations', { properties: { tabColor: { argb: 'FFCC0000' } } });
    this.addTitle(sheet, data.header.tontineName, 1);
    this.addSubtitle(sheet, `Cotisations & Arriérés — Exercice ${data.exercice.annee}`, 2);

    // Totaux
    const tot = data.totaux;
    sheet.getCell('A4').value = `Total dû: ${tot.totalDu}  |  Total payé: ${tot.totalPaye}  |  Arriéré: ${tot.totalArriere}  |  Taux: ${tot.tauxRecouvrementGlobal}%  |  En défaut: ${tot.nbMembresEnDefaut}`;
    sheet.getCell('A4').font = { italic: true, color: { argb: 'FF616161' } };

    this.addTableHeader(sheet, ['Membre', 'Total dû (FCFA)', 'Total payé (FCFA)', 'Arriéré (FCFA)', 'Taux %', 'En défaut'], 6);

    data.membres.forEach((m, i) => {
      const r = sheet.getRow(i + 7);
      r.getCell(1).value = m.nom; r.getCell(2).value = m.totalDu; r.getCell(2).numFmt = CURRENCY_FORMAT;
      r.getCell(3).value = m.totalPaye; r.getCell(3).numFmt = CURRENCY_FORMAT;
      r.getCell(4).value = m.arriere; r.getCell(4).numFmt = CURRENCY_FORMAT;
      if (m.arriere > 0) r.getCell(4).font = { color: { argb: 'FFC62828' }, bold: true };
      r.getCell(5).value = m.tauxRecouvrement / 100; r.getCell(5).numFmt = '0%';
      r.getCell(6).value = m.enDefaut ? 'OUI' : 'NON';
      if (m.enDefaut) r.getCell(6).font = { bold: true, color: { argb: 'FFC62828' } };
      if (i % 2 === 0) r.eachCell((c) => { c.fill = EVEN_ROW_FILL; });
      r.eachCell((c) => { c.border = BORDER_STYLE; });
    });

    sheet.columns = [{ width: 25 }, { width: 18 }, { width: 18 }, { width: 18 }, { width: 12 }, { width: 12 }];
    sheet.autoFilter = { from: 'A6', to: `F${data.membres.length + 6}` };
    sheet.views = [{ state: 'frozen', ySplit: 6 }];

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  // ===========================================================================
  // RAPPORT 9 — ÉVÉNEMENTS SECOURS
  // ===========================================================================

  async genererEvenementsSecours(data: EvenementsSecoursData): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = data.header.tontineName;

    const sheet = workbook.addWorksheet('Secours', { properties: { tabColor: { argb: 'FF2E7D32' } } });
    this.addTitle(sheet, data.header.tontineName, 1);
    this.addSubtitle(sheet, `Événements Secours — Exercice ${data.exercice.annee}`, 2);

    const kpis = data.kpis;
    sheet.getCell('A4').value = `Événements: ${kpis.nbEvenements}  |  Total distribué: ${kpis.montantTotalDistribue} FCFA  |  En attente: ${kpis.nbEnAttente} (${kpis.montantEnAttente} FCFA)`;
    sheet.getCell('A4').font = { italic: true, color: { argb: 'FF616161' } };

    this.addTableHeader(sheet, ['Membre', 'Type événement', 'Date', 'Montant approuvé (FCFA)', 'Statut', 'Pièces justif.'], 6);

    data.evenements.forEach((e, i) => {
      const r = sheet.getRow(i + 7);
      r.getCell(1).value = e.membre; r.getCell(2).value = e.typeEvenement; r.getCell(3).value = e.date;
      r.getCell(4).value = e.montantApprouve; r.getCell(4).numFmt = CURRENCY_FORMAT;
      r.getCell(5).value = e.statut;
      r.getCell(6).value = e.nbPiecesJustificatives; r.getCell(6).alignment = { horizontal: 'center' };
      if (i % 2 === 0) r.eachCell((c) => { c.fill = EVEN_ROW_FILL; });
      r.eachCell((c) => { c.border = BORDER_STYLE; });
    });

    sheet.columns = [{ width: 22 }, { width: 20 }, { width: 13 }, { width: 22 }, { width: 18 }, { width: 14 }];
    sheet.autoFilter = { from: 'A6', to: `F${data.evenements.length + 6}` };
    sheet.views = [{ state: 'frozen', ySplit: 6 }];

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  // ===========================================================================
  // RAPPORT 10 — BILAN FINANCIER ANNUEL
  // ===========================================================================

  async genererBilanFinancierAnnuel(data: BilanFinancierAnnuelData): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = data.header.tontineName;

    const sheet = workbook.addWorksheet('Bilan', { properties: { tabColor: { argb: 'FF1A237E' } } });
    this.addTitle(sheet, data.header.tontineName, 1);
    this.addSubtitle(sheet, `Bilan Financier — ${data.tontine.nom}`, 2);

    this.addTableHeader(sheet, ['Année', 'Statut', 'Cotisations', 'Distributions', 'Prêts décaissés', 'Prêts remboursés', 'Pénalités', 'Secours', 'Solde net'], 4);

    data.parExercice.forEach((ex, i) => {
      const r = sheet.getRow(i + 5);
      r.getCell(1).value = ex.annee; r.getCell(1).alignment = { horizontal: 'center' };
      r.getCell(2).value = ex.statut;
      [3, 4, 5, 6, 7, 8, 9].forEach((col, j) => {
        const vals = [ex.cotisations, ex.distributions, ex.pretsDecaisses, ex.pretsRembourses, ex.penalites, ex.secours, ex.soldeNet];
        r.getCell(col).value = vals[j];
        r.getCell(col).numFmt = CURRENCY_FORMAT;
        if (col === 9) r.getCell(col).font = { bold: true, color: { argb: vals[j] >= 0 ? 'FF2E7D32' : 'FFC62828' } };
      });
      if (i % 2 === 0) r.eachCell((c) => { c.fill = EVEN_ROW_FILL; });
      r.eachCell((c) => { c.border = BORDER_STYLE; });
    });

    // Ligne totaux
    const totRow = sheet.getRow(data.parExercice.length + 5);
    totRow.getCell(1).value = 'TOTAL'; totRow.getCell(1).font = { bold: true }; totRow.getCell(2).value = '';
    const tot = data.totaux;
    [tot.cotisations, tot.distributions, tot.pretsDecaisses, tot.pretsRembourses, tot.penalites, tot.secours].forEach((val, j) => {
      totRow.getCell(j + 3).value = val; totRow.getCell(j + 3).numFmt = CURRENCY_FORMAT; totRow.getCell(j + 3).font = { bold: true };
    });
    const soldeTotal = tot.cotisations + tot.penalites + tot.pretsRembourses - tot.distributions - tot.pretsDecaisses - tot.secours;
    totRow.getCell(9).value = soldeTotal; totRow.getCell(9).numFmt = CURRENCY_FORMAT;
    totRow.getCell(9).font = { bold: true, color: { argb: soldeTotal >= 0 ? 'FF2E7D32' : 'FFC62828' } };
    totRow.eachCell((c) => { c.border = BORDER_STYLE; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8EAF6' } }; });

    sheet.columns = [{ width: 8 }, { width: 12 }, { width: 18 }, { width: 18 }, { width: 18 }, { width: 18 }, { width: 15 }, { width: 15 }, { width: 18 }];
    sheet.views = [{ state: 'frozen', ySplit: 4 }];

    return Buffer.from(await workbook.xlsx.writeBuffer());
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
