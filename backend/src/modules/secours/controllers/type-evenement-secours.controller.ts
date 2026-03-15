/**
 * Controlleur pour la gestion des types d'evenements de secours
 */

import { Request, Response, NextFunction } from 'express';
import { typeEvenementSecoursService } from '../services/type-evenement-secours.service';

export class TypeEvenementSecoursController {
  /**
   * Creer un nouveau type d'evenement de secours
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await typeEvenementSecoursService.create(req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lister tous les types d'evenement de secours
   */
  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const result = await typeEvenementSecoursService.findAll(includeInactive);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir un type d'evenement de secours par ID
   */
  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await typeEvenementSecoursService.findById(req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mettre a jour un type d'evenement de secours
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await typeEvenementSecoursService.update(req.params.id, req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Supprimer un type d'evenement de secours
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await typeEvenementSecoursService.delete(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const typeEvenementSecoursController = new TypeEvenementSecoursController();
