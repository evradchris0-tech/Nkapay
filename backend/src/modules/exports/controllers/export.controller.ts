/**
 * Contrôleur pour les exports PDF
 */

import { Request, Response, NextFunction } from 'express';
import { tontineExportService } from '../services/tontine-export.service';
import { financeExportService } from '../services/finance-export.service';

export class ExportController {
  /**
   * Exporter la fiche d'une tontine
   * GET /api/v1/exports/tontines/:id/fiche
   */
  async exportTontineFiche(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const buffer = await tontineExportService.exportTontineFiche(id);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="tontine-${id}.pdf"`);
      res.setHeader('Content-Length', buffer.length);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Exporter la liste des membres d'une tontine
   * GET /api/v1/exports/tontines/:id/membres
   */
  async exportMembresListe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const buffer = await tontineExportService.exportMembresListe(id);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="membres-tontine-${id}.pdf"`);
      res.setHeader('Content-Length', buffer.length);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Exporter le bilan d'un exercice
   * GET /api/v1/exports/exercices/:id/bilan
   */
  async exportExerciceBilan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const buffer = await tontineExportService.exportExerciceBilan(id);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="bilan-exercice-${id}.pdf"`);
      res.setHeader('Content-Length', buffer.length);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Exporter le rapport d'une réunion
   * GET /api/v1/exports/reunions/:id/rapport
   */
  async exportReunionRapport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const buffer = await tontineExportService.exportReunionRapport(id);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="rapport-reunion-${id}.pdf"`);
      res.setHeader('Content-Length', buffer.length);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Exporter le rapport financier d'un exercice
   * GET /api/v1/exports/exercices/:id/financier
   */
  async exportRapportFinancier(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const buffer = await financeExportService.exportRapportFinancier(id);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="rapport-financier-${id}.pdf"`);
      res.setHeader('Content-Length', buffer.length);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Exporter le relevé d'un membre
   * GET /api/v1/exports/exercices/:exerciceId/membres/:membreId/releve
   */
  async exportReleveMembre(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { exerciceId, membreId } = req.params;
      const buffer = await financeExportService.exportReleveMembre(exerciceId, membreId);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="releve-membre-${membreId}.pdf"`);
      res.setHeader('Content-Length', buffer.length);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Exporter le rapport des prêts
   * GET /api/v1/exports/exercices/:id/prets
   */
  async exportRapportPrets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const buffer = await financeExportService.exportRapportPrets(id);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="rapport-prets-${id}.pdf"`);
      res.setHeader('Content-Length', buffer.length);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Exporter le rapport des pénalités
   * GET /api/v1/exports/exercices/:id/penalites
   */
  async exportRapportPenalites(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const buffer = await financeExportService.exportRapportPenalites(id);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="rapport-penalites-${id}.pdf"`);
      res.setHeader('Content-Length', buffer.length);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }
}

export const exportController = new ExportController();
