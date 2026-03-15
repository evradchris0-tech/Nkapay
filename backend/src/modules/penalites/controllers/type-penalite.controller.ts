/**
 * Controlleur pour la gestion des types de penalite
 */

import { Request, Response, NextFunction } from 'express';
import { typePenaliteService } from '../services/type-penalite.service';

export class TypePenaliteController {
  /**
   * Creer un nouveau type de penalite
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await typePenaliteService.create(req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lister tous les types de penalite
   */
  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const result = await typePenaliteService.findAll(includeInactive);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir un type de penalite par ID
   */
  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await typePenaliteService.findById(req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mettre a jour un type de penalite
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await typePenaliteService.update(req.params.id, req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Supprimer un type de penalite
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await typePenaliteService.delete(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const typePenaliteController = new TypePenaliteController();
