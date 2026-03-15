/**
 * Controller pour la gestion des prets
 */

import { Request, Response, NextFunction } from 'express';
import { pretService } from '../services/pret.service';
import { PretFiltersDto } from '../dto/pret.dto';
import { ApiResponse } from '../../../shared';

export class PretController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pret = await pretService.create(req.body);
      res.status(201).json(ApiResponse.created(pret, 'Prêt créé avec succès'));
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters: PretFiltersDto = {
        exerciceId: req.query.exerciceId as string,
        exerciceMembreId: req.query.exerciceMembreId as string,
        statut: req.query.statut as any,
        dateDebut: req.query.dateDebut as string,
        dateFin: req.query.dateFin as string,
      };
      const result = await pretService.findAll(filters);
      res.json(ApiResponse.paginated(result.prets, {
        page: 1,
        limit: result.prets.length,
        total: result.total,
        totalPages: 1,
      }));
    } catch (error) {
      next(error);
    }
  }

  async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters: PretFiltersDto = {
        exerciceId: req.query.exerciceId as string,
        exerciceMembreId: req.query.exerciceMembreId as string,
        statut: req.query.statut as any,
      };
      const summary = await pretService.getSummary(filters);
      res.json(ApiResponse.success(summary));
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pret = await pretService.findById(req.params.id);
      res.json(ApiResponse.success(pret));
    } catch (error) {
      next(error);
    }
  }

  async approuver(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pret = await pretService.approuver(req.params.id, req.body);
      res.json(ApiResponse.success(pret, 'Prêt approuvé'));
    } catch (error) {
      next(error);
    }
  }

  async refuser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pret = await pretService.refuser(req.params.id, req.body);
      res.json(ApiResponse.success(pret, 'Prêt refusé'));
    } catch (error) {
      next(error);
    }
  }

  async decaisser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pret = await pretService.decaisser(req.params.id, req.body || {});
      res.json(ApiResponse.success(pret, 'Prêt décaissé'));
    } catch (error) {
      next(error);
    }
  }

  async solder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pret = await pretService.solder(req.params.id);
      res.json(ApiResponse.success(pret, 'Prêt soldé'));
    } catch (error) {
      next(error);
    }
  }

  async mettreEnDefaut(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pret = await pretService.mettreEnDefaut(req.params.id);
      res.json(ApiResponse.success(pret, 'Prêt marqué en défaut'));
    } catch (error) {
      next(error);
    }
  }
}

export const pretController = new PretController();
