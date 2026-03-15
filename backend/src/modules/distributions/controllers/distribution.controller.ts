/**
 * Controller pour la gestion des distributions
 */

import { Request, Response, NextFunction } from 'express';
import { distributionService } from '../services/distribution.service';
import { DistributionFiltersDto } from '../dto/distribution.dto';
import { ApiResponse } from '../../../shared';

export class DistributionController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const distribution = await distributionService.create(req.body);
      res.status(201).json(ApiResponse.created(distribution, 'Distribution créée'));
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters: DistributionFiltersDto = {
        reunionId: req.query.reunionId as string,
        exerciceId: req.query.exerciceId as string,
        exerciceMembreId: req.query.exerciceMembreId as string,
        statut: req.query.statut as any,
      };
      const result = await distributionService.findAll(filters);
      res.json(ApiResponse.paginated(result.distributions, {
        page: 1,
        limit: result.distributions.length,
        total: result.total,
        totalPages: 1,
      }));
    } catch (error) {
      next(error);
    }
  }

  async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters: DistributionFiltersDto = {
        reunionId: req.query.reunionId as string,
        exerciceId: req.query.exerciceId as string,
        exerciceMembreId: req.query.exerciceMembreId as string,
        statut: req.query.statut as any,
      };
      const summary = await distributionService.getSummary(filters);
      res.json(ApiResponse.success(summary));
    } catch (error) {
      next(error);
    }
  }

  async findByReunion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const distributions = await distributionService.findByReunion(req.params.reunionId);
      res.json(ApiResponse.success(distributions));
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const distribution = await distributionService.findById(req.params.id);
      res.json(ApiResponse.success(distribution));
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const distribution = await distributionService.update(req.params.id, req.body);
      res.json(ApiResponse.success(distribution, 'Distribution mise à jour'));
    } catch (error) {
      next(error);
    }
  }

  async distribuer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const distribution = await distributionService.distribuer(req.params.id, req.body || {});
      res.json(ApiResponse.success(distribution, 'Distribution effectuée'));
    } catch (error) {
      next(error);
    }
  }

  async annuler(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const distribution = await distributionService.annuler(req.params.id);
      res.json(ApiResponse.success(distribution, 'Distribution annulée'));
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await distributionService.delete(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const distributionController = new DistributionController();
