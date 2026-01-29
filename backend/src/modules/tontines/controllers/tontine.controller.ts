/**
 * Controleur pour la gestion des tontines
 */

import { Request, Response, NextFunction } from 'express';
import { tontineService } from '../services/tontine.service';
import { ApiResponse } from '../../../shared';
import { StatutTontine } from '../entities/tontine.entity';

export class TontineController {
  /**
   * POST / - Creer une nouvelle tontine
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await tontineService.create(req.body);
      res.status(201).json(ApiResponse.success(result, 'Tontine creee avec succes'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET / - Lister toutes les tontines
   */
  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const statut = req.query.statut as StatutTontine | undefined;
      const result = await tontineService.findAll({ statut });
      res.json(ApiResponse.success(result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /:id - Trouver une tontine par ID
   */
  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await tontineService.findById(req.params.id);
      res.json(ApiResponse.success(result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /code/:nomCourt - Trouver une tontine par nom court
   */
  async findByNomCourt(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await tontineService.findByNomCourt(req.params.nomCourt);
      res.json(ApiResponse.success(result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /:id - Mettre a jour une tontine
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await tontineService.update(req.params.id, req.body);
      res.json(ApiResponse.success(result, 'Tontine mise a jour'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /:id/suspend - Suspendre une tontine
   */
  async suspend(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await tontineService.suspend(req.params.id);
      res.json(ApiResponse.success(result, 'Tontine suspendue'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /:id/activate - Reactiver une tontine
   */
  async activate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await tontineService.activate(req.params.id);
      res.json(ApiResponse.success(result, 'Tontine reactivee'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /:id - Supprimer une tontine
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await tontineService.delete(req.params.id);
      res.json(ApiResponse.success(null, 'Tontine supprimee'));
    } catch (error) {
      next(error);
    }
  }
}

export const tontineController = new TontineController();
