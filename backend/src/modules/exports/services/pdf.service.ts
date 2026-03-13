/**
 * Service de génération de PDF
 * Utilise PDFKit pour créer des documents PDF
 */

import PDFDocument from 'pdfkit';
import { Writable } from 'stream';

export interface PDFStyle {
  fontSize?: number;
  font?: 'normal' | 'bold' | 'italic';
  color?: string;
  align?: 'left' | 'center' | 'right' | 'justify';
}

export interface TableColumn {
  header: string;
  field: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
  format?: (value: unknown) => string;
}

export interface PDFOptions {
  title: string;
  subtitle?: string;
  author?: string;
  orientation?: 'portrait' | 'landscape';
  margin?: number;
  logo?: string;
}

export class PDFService {
  private doc: PDFKit.PDFDocument | null = null;
  private options: PDFOptions;
  private yPosition: number = 0;
  private pageWidth: number = 0;
  private pageHeight: number = 0;
  private margin: number = 50;

  constructor(options: PDFOptions) {
    this.options = options;
    this.margin = options.margin || 50;
  }

  /**
   * Initialiser le document PDF
   */
  init(): void {
    const isLandscape = this.options.orientation === 'landscape';

    this.doc = new PDFDocument({
      size: 'A4',
      layout: isLandscape ? 'landscape' : 'portrait',
      margin: this.margin,
      info: {
        Title: this.options.title,
        Author: this.options.author || 'Nkapay',
        Creator: 'Nkapay Tontine System',
      },
    });

    this.pageWidth = isLandscape ? 841.89 : 595.28;
    this.pageHeight = isLandscape ? 595.28 : 841.89;
    this.yPosition = this.margin;
  }

  /**
   * Ajouter l'en-tête du document
   */
  addHeader(): void {
    if (!this.doc) return;

    // Logo placeholder (cercle avec initiales)
    this.doc
      .circle(this.margin + 25, this.yPosition + 25, 25)
      .fillColor('#2563eb')
      .fill();

    this.doc
      .fillColor('#ffffff')
      .fontSize(18)
      .font('Helvetica-Bold')
      .text('NK', this.margin + 10, this.yPosition + 15, { width: 30, align: 'center' });

    // Titre
    this.doc
      .fillColor('#1f2937')
      .fontSize(24)
      .font('Helvetica-Bold')
      .text(this.options.title, this.margin + 70, this.yPosition + 10);

    // Sous-titre
    if (this.options.subtitle) {
      this.doc
        .fillColor('#6b7280')
        .fontSize(12)
        .font('Helvetica')
        .text(this.options.subtitle, this.margin + 70, this.yPosition + 38);
    }

    // Date de génération
    const dateStr = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    this.doc
      .fillColor('#9ca3af')
      .fontSize(10)
      .font('Helvetica')
      .text(`Généré le ${dateStr}`, this.pageWidth - this.margin - 200, this.yPosition + 10, {
        width: 200,
        align: 'right',
      });

    // Ligne de séparation
    this.yPosition += 70;
    this.doc
      .strokeColor('#e5e7eb')
      .lineWidth(1)
      .moveTo(this.margin, this.yPosition)
      .lineTo(this.pageWidth - this.margin, this.yPosition)
      .stroke();

    this.yPosition += 20;
  }

  /**
   * Ajouter un titre de section
   */
  addSectionTitle(title: string): void {
    if (!this.doc) return;

    this.checkNewPage(40);

    this.doc
      .fillColor('#1f2937')
      .fontSize(16)
      .font('Helvetica-Bold')
      .text(title, this.margin, this.yPosition);

    this.yPosition += 25;

    // Ligne sous le titre
    this.doc
      .strokeColor('#3b82f6')
      .lineWidth(2)
      .moveTo(this.margin, this.yPosition)
      .lineTo(this.margin + 80, this.yPosition)
      .stroke();

    this.yPosition += 15;
  }

  /**
   * Ajouter un paragraphe de texte
   */
  addParagraph(text: string, style?: PDFStyle): void {
    if (!this.doc) return;

    const fontSize = style?.fontSize || 11;
    const lineHeight = fontSize * 1.5;
    const estimatedLines = Math.ceil(text.length / 80);

    this.checkNewPage(lineHeight * estimatedLines + 10);

    const fontName =
      style?.font === 'bold'
        ? 'Helvetica-Bold'
        : style?.font === 'italic'
          ? 'Helvetica-Oblique'
          : 'Helvetica';

    this.doc
      .fillColor(style?.color || '#374151')
      .fontSize(fontSize)
      .font(fontName)
      .text(text, this.margin, this.yPosition, {
        width: this.pageWidth - this.margin * 2,
        align: style?.align || 'left',
        lineGap: 4,
      });

    this.yPosition = this.doc.y + 10;
  }

  /**
   * Ajouter une paire clé-valeur
   */
  addKeyValue(label: string, value: string, inline: boolean = true): void {
    if (!this.doc) return;

    this.checkNewPage(25);

    if (inline) {
      this.doc
        .fillColor('#6b7280')
        .fontSize(10)
        .font('Helvetica')
        .text(label + ' :', this.margin, this.yPosition, { continued: true });

      this.doc
        .fillColor('#1f2937')
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(' ' + value);

      this.yPosition = this.doc.y + 5;
    } else {
      this.doc
        .fillColor('#6b7280')
        .fontSize(10)
        .font('Helvetica')
        .text(label, this.margin, this.yPosition);

      this.yPosition += 15;

      this.doc
        .fillColor('#1f2937')
        .fontSize(11)
        .font('Helvetica-Bold')
        .text(value, this.margin, this.yPosition);

      this.yPosition = this.doc.y + 10;
    }
  }

  /**
   * Ajouter un tableau
   */
  addTable(columns: TableColumn[], data: Record<string, unknown>[]): void {
    if (!this.doc) return;

    const tableWidth = this.pageWidth - this.margin * 2;
    const defaultColWidth = tableWidth / columns.length;
    const rowHeight = 30;
    const headerHeight = 35;

    // Calculer les largeurs des colonnes
    const colWidths = columns.map((col) => col.width || defaultColWidth);
    const totalWidth = colWidths.reduce((a, b) => a + b, 0);
    const scale = tableWidth / totalWidth;
    const scaledWidths = colWidths.map((w) => w * scale);

    // Vérifier l'espace pour au moins l'en-tête + 1 ligne
    this.checkNewPage(headerHeight + rowHeight + 20);

    // En-tête du tableau
    let xPos = this.margin;
    this.doc
      .fillColor('#f3f4f6')
      .rect(this.margin, this.yPosition, tableWidth, headerHeight)
      .fill();

    columns.forEach((col, i) => {
      this.doc!.fillColor('#374151')
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(col.header, xPos + 5, this.yPosition + 10, {
          width: scaledWidths[i] - 10,
          align: col.align || 'left',
        });
      xPos += scaledWidths[i];
    });

    this.yPosition += headerHeight;

    // Lignes de données
    data.forEach((row, rowIndex) => {
      this.checkNewPage(rowHeight + 10);

      // Fond alterné
      if (rowIndex % 2 === 0) {
        this.doc!.fillColor('#fafafa')
          .rect(this.margin, this.yPosition, tableWidth, rowHeight)
          .fill();
      }

      // Bordure du bas
      this.doc!.strokeColor('#e5e7eb')
        .lineWidth(0.5)
        .moveTo(this.margin, this.yPosition + rowHeight)
        .lineTo(this.margin + tableWidth, this.yPosition + rowHeight)
        .stroke();

      // Cellules
      xPos = this.margin;
      columns.forEach((col, i) => {
        let value = row[col.field];
        if (col.format && value !== undefined) {
          value = col.format(value);
        }

        this.doc!.fillColor('#1f2937')
          .fontSize(9)
          .font('Helvetica')
          .text(String(value ?? '-'), xPos + 5, this.yPosition + 8, {
            width: scaledWidths[i] - 10,
            align: col.align || 'left',
            ellipsis: true,
          });
        xPos += scaledWidths[i];
      });

      this.yPosition += rowHeight;
    });

    this.yPosition += 15;
  }

  /**
   * Ajouter un résumé avec statistiques
   */
  addSummaryBox(
    title: string,
    items: { label: string; value: string; highlight?: boolean }[]
  ): void {
    if (!this.doc) return;

    const boxHeight = 30 + items.length * 25;
    this.checkNewPage(boxHeight + 20);

    const boxWidth = (this.pageWidth - this.margin * 2) / 2 - 10;

    // Fond de la boîte
    this.doc
      .fillColor('#eff6ff')
      .roundedRect(this.margin, this.yPosition, boxWidth, boxHeight, 5)
      .fill();

    // Bordure gauche colorée
    this.doc.fillColor('#3b82f6').rect(this.margin, this.yPosition, 4, boxHeight).fill();

    // Titre de la boîte
    this.doc
      .fillColor('#1e40af')
      .fontSize(12)
      .font('Helvetica-Bold')
      .text(title, this.margin + 15, this.yPosition + 10);

    let itemY = this.yPosition + 35;
    items.forEach((item) => {
      this.doc!.fillColor('#6b7280')
        .fontSize(10)
        .font('Helvetica')
        .text(item.label + ' :', this.margin + 15, itemY, { continued: true });

      this.doc!.fillColor(item.highlight ? '#059669' : '#1f2937')
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(' ' + item.value);

      itemY += 20;
    });

    this.yPosition += boxHeight + 15;
  }

  /**
   * Ajouter plusieurs boîtes de résumé côte à côte
   */
  addSummaryBoxes(
    boxes: { title: string; items: { label: string; value: string; highlight?: boolean }[] }[]
  ): void {
    if (!this.doc) return;

    const maxItems = Math.max(...boxes.map((b) => b.items.length));
    const boxHeight = 30 + maxItems * 25;
    this.checkNewPage(boxHeight + 20);

    const totalWidth = this.pageWidth - this.margin * 2;
    const gap = 15;
    const boxWidth = (totalWidth - gap * (boxes.length - 1)) / boxes.length;

    boxes.forEach((box, index) => {
      const xPos = this.margin + (boxWidth + gap) * index;

      // Fond de la boîte
      this.doc!.fillColor('#eff6ff')
        .roundedRect(xPos, this.yPosition, boxWidth, boxHeight, 5)
        .fill();

      // Bordure gauche colorée
      this.doc!.fillColor('#3b82f6').rect(xPos, this.yPosition, 4, boxHeight).fill();

      // Titre de la boîte
      this.doc!.fillColor('#1e40af')
        .fontSize(11)
        .font('Helvetica-Bold')
        .text(box.title, xPos + 12, this.yPosition + 10, { width: boxWidth - 20 });

      let itemY = this.yPosition + 35;
      box.items.forEach((item) => {
        this.doc!.fillColor('#6b7280')
          .fontSize(9)
          .font('Helvetica')
          .text(item.label, xPos + 12, itemY, { width: boxWidth - 20 });

        this.doc!.fillColor(item.highlight ? '#059669' : '#1f2937')
          .fontSize(10)
          .font('Helvetica-Bold')
          .text(item.value, xPos + 12, itemY + 12, { width: boxWidth - 20 });

        itemY += 30;
      });
    });

    this.yPosition += boxHeight + 15;
  }

  /**
   * Ajouter un espace vertical
   */
  addSpace(height: number = 20): void {
    this.yPosition += height;
  }

  /**
   * Ajouter un saut de page
   */
  addPageBreak(): void {
    if (!this.doc) return;
    this.doc.addPage();
    this.yPosition = this.margin;
  }

  /**
   * Vérifier si on doit ajouter une nouvelle page
   */
  private checkNewPage(requiredHeight: number): void {
    if (!this.doc) return;

    if (this.yPosition + requiredHeight > this.pageHeight - this.margin - 40) {
      this.addPageBreak();
    }
  }

  /**
   * Ajouter le pied de page
   */
  addFooter(): void {
    if (!this.doc) return;

    const pageCount = this.doc.bufferedPageRange().count;

    for (let i = 0; i < pageCount; i++) {
      this.doc.switchToPage(i);

      // Ligne de séparation
      this.doc
        .strokeColor('#e5e7eb')
        .lineWidth(0.5)
        .moveTo(this.margin, this.pageHeight - 40)
        .lineTo(this.pageWidth - this.margin, this.pageHeight - 40)
        .stroke();

      // Texte du pied de page
      this.doc
        .fillColor('#9ca3af')
        .fontSize(9)
        .font('Helvetica')
        .text('Nkapay Tontine System - Document confidentiel', this.margin, this.pageHeight - 30);

      // Numéro de page
      this.doc.text(
        `Page ${i + 1} / ${pageCount}`,
        this.pageWidth - this.margin - 80,
        this.pageHeight - 30,
        { width: 80, align: 'right' }
      );
    }
  }

  /**
   * Générer le buffer PDF
   */
  async generateBuffer(): Promise<Buffer> {
    if (!this.doc) {
      throw new Error('PDF document not initialized');
    }

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];

      this.doc!.on('data', (chunk: Buffer) => chunks.push(chunk));
      this.doc!.on('end', () => resolve(Buffer.concat(chunks)));
      this.doc!.on('error', reject);

      this.addFooter();
      this.doc!.end();
    });
  }

  /**
   * Pipe vers un stream
   */
  pipe(stream: Writable): void {
    if (!this.doc) {
      throw new Error('PDF document not initialized');
    }

    this.addFooter();
    this.doc.pipe(stream);
    this.doc.end();
  }
}

export const createPDFService = (options: PDFOptions): PDFService => {
  const service = new PDFService(options);
  service.init();
  return service;
};
