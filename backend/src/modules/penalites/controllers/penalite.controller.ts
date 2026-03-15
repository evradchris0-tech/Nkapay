/**
 * Controlleur pour la gestion des penalites
 */

import { Request, Response, NextFunction } from 'express';
import { penaliteService } from '../services/penalite.service';
import { ApiResponse } from '../../../shared';

export class PenaliteController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await penaliteService.create(req.body);
      res.status(201).json(ApiResponse.created(result, 'Pénalité créée'));
    } catch (error) {
      next(error);
    }
  }

  async payer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await penaliteService.payer(req.params.id, req.body);
      res.json(ApiResponse.success(result, 'Pénalité payée'));
    } catch (error) {
      next(error);
    }
  }

  async annuler(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await penaliteService.annuler(req.params.id, req.body);
      res.json(ApiResponse.success(result, 'Pénalité annulée'));
    } catch (error) {
      next(error);
    }
  }

  async pardonner(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { motif } = req.body;
      const result = await penaliteService.pardonner(req.params.id, motif);
      res.json(ApiResponse.success(result, 'Pénalité pardonnée'));
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await penaliteService.findAll(req.query as any);
      res.json(ApiResponse.paginated(result, {
        page: 1,
        limit: result.length,
        total: result.length,
        totalPages: 1,
      }));
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await penaliteService.findById(req.params.id);
      res.json(ApiResponse.success(result));
    } catch (error) {
      next(error);
    }
  }

  async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await penaliteService.getSummary(req.query as any);
      res.json(ApiResponse.success(result));
    } catch (error) {
      next(error);
    }
  }
}

export const penaliteController = new PenaliteController();
