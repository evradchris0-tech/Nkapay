/**
 * Controlleur pour la gestion des penalites
 */

import { Request, Response, NextFunction } from 'express';
import { penaliteService } from '../services/penalite.service';
import { ApiResponse, PaginationQuery } from '../../../shared';
import { PenaliteFiltersDto } from '../dto/penalite.dto';

export class PenaliteController {
  /**
   * Appliquer une penalite
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await penaliteService.create(req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Payer une penalite
   */
  async payer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await penaliteService.payer(req.params.id, req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Annuler une penalite
   */
  async annuler(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await penaliteService.annuler(req.params.id, req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Pardonner une penalite
   */
  async pardonner(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { motif } = req.body;
      const result = await penaliteService.pardonner(req.params.id, motif);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lister les penalites avec pagination
   */
  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters: PenaliteFiltersDto = {
        exerciceId: req.query.exerciceId as string | undefined,
        exerciceMembreId: req.query.exerciceMembreId as string | undefined,
        reunionId: req.query.reunionId as string | undefined,
        typePenaliteId: req.query.typePenaliteId as string | undefined,
        statut: req.query.statut as any,
        dateDebut: req.query.dateDebut as string | undefined,
        dateFin: req.query.dateFin as string | undefined,
      };
      const pagination: PaginationQuery = {
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        sortBy: req.query.sortBy as string | undefined,
        sortOrder: req.query.sortOrder as 'ASC' | 'DESC' | undefined,
      };
      const result = await penaliteService.findAll(filters, pagination);
      res.json(ApiResponse.paginated(result.data, result.meta));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir une penalite par ID
   */
  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await penaliteService.findById(req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir le resume des penalites
   */
  async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await penaliteService.getSummary(req.query as any);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const penaliteController = new PenaliteController();
