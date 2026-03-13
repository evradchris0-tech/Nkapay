/**
 * Controlleur pour la gestion des reunions
 */

import { Request, Response, NextFunction } from 'express';
import { reunionService } from '../services/reunion.service';
import { ApiResponse } from '../../../shared';

export class ReunionController {
  /**
   * Planifier une nouvelle reunion
   */
  async planifier(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await reunionService.planifier(req.body);
      res.status(201).json(ApiResponse.success(result, 'Réunion planifiée avec succès'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Ouvrir une reunion
   */
  async ouvrir(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await reunionService.ouvrir(req.params.id, req.body);
      res.json(ApiResponse.success(result, 'Réunion ouverte'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cloturer une reunion
   */
  async cloturer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await reunionService.cloturer(req.params.id, req.body);
      res.json(ApiResponse.success(result, 'Réunion clôturée'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Annuler une reunion
   */
  async annuler(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await reunionService.annuler(req.params.id);
      res.json(ApiResponse.success(result, 'Réunion annulée'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lister les reunions
   */
  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await reunionService.findAll(req.query as any);
      res.json(ApiResponse.success(result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir une reunion par ID
   */
  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await reunionService.findById(req.params.id);
      res.json(ApiResponse.success(result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mettre a jour une reunion
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await reunionService.update(req.params.id, req.body);
      res.json(ApiResponse.success(result, 'Réunion mise à jour'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Supprimer une reunion
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await reunionService.delete(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const reunionController = new ReunionController();
