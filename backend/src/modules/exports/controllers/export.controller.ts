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
}

export const exportController = new ExportController();
