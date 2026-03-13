/**
 * Contrôleur d'exports PDF/Excel
 */

import { Request, Response, NextFunction } from 'express';
import { exportService, ExportFormat } from '../services/export.service';

export class ExportController {
  /**
   * Exporter le relevé de compte individuel
   * GET /exports/releve/:exerciceMembreId?format=pdf|excel
   */
  async exportReleveCompte(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { exerciceMembreId } = req.params;
      const format = (req.query.format as ExportFormat) || 'pdf';

      const result = await exportService.exportReleveCompte(exerciceMembreId, format);

      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.setHeader('Content-Length', result.buffer.length);
      res.send(result.buffer);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Exporter le rapport de fin d'exercice
   * GET /exports/rapport-exercice/:exerciceId?format=pdf|excel
   */
  async exportRapportExercice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { exerciceId } = req.params;
      const format = (req.query.format as ExportFormat) || 'pdf';

      const result = await exportService.exportRapportExercice(exerciceId, format);

      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.setHeader('Content-Length', result.buffer.length);
      res.send(result.buffer);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Exporter le rapport mensuel (par réunion)
   * GET /exports/rapport-mensuel/:reunionId?format=pdf|excel
   */
  async exportRapportMensuel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { reunionId } = req.params;
      const format = (req.query.format as ExportFormat) || 'pdf';
      const result = await exportService.exportRapportMensuel(reunionId, format);
      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.setHeader('Content-Length', result.buffer.length);
      res.send(result.buffer);
    } catch (error) {
      next(error);
    }
  }

  /** GET /exports/membres/:tontineId?format=pdf|excel */
  async exportListeMembres(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await exportService.exportListeMembres(req.params.tontineId, (req.query.format as ExportFormat) || 'pdf');
      this.sendFile(res, result);
    } catch (error) { next(error); }
  }

  /** GET /exports/rapport-organisation/:organisationId?format=pdf|excel */
  async exportRapportOrganisation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await exportService.exportRapportOrganisation(req.params.organisationId, (req.query.format as ExportFormat) || 'pdf');
      this.sendFile(res, result);
    } catch (error) { next(error); }
  }

  /** GET /exports/portefeuille-prets/:exerciceId?format=pdf|excel */
  async exportPortefeuillePrets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await exportService.exportPortefeuillePrets(req.params.exerciceId, (req.query.format as ExportFormat) || 'pdf');
      this.sendFile(res, result);
    } catch (error) { next(error); }
  }

  /** GET /exports/presences/:exerciceId?format=pdf|excel */
  async exportPresencesAssiduite(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await exportService.exportPresencesAssiduite(req.params.exerciceId, (req.query.format as ExportFormat) || 'pdf');
      this.sendFile(res, result);
    } catch (error) { next(error); }
  }

  /** GET /exports/cotisations-arrierees/:exerciceId?format=pdf|excel */
  async exportCotisationsArrieres(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await exportService.exportCotisationsArrieres(req.params.exerciceId, (req.query.format as ExportFormat) || 'pdf');
      this.sendFile(res, result);
    } catch (error) { next(error); }
  }

  /** GET /exports/secours/:exerciceId?format=pdf|excel */
  async exportEvenementsSecours(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await exportService.exportEvenementsSecours(req.params.exerciceId, (req.query.format as ExportFormat) || 'pdf');
      this.sendFile(res, result);
    } catch (error) { next(error); }
  }

  /** GET /exports/bilan/:tontineId?annee=2024&format=pdf|excel */
  async exportBilanFinancierAnnuel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const annee = parseInt(req.query.annee as string, 10) || new Date().getFullYear();
      const result = await exportService.exportBilanFinancierAnnuel(req.params.tontineId, annee, (req.query.format as ExportFormat) || 'pdf');
      this.sendFile(res, result);
    } catch (error) { next(error); }
  }

  private sendFile(res: Response, result: { buffer: Buffer; filename: string; contentType: string }): void {
    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.setHeader('Content-Length', result.buffer.length);
    res.send(result.buffer);
  }
}

export const exportController = new ExportController();
