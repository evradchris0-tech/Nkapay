/**
 * Controlleur pour la gestion des presences aux reunions
 */

import { Request, Response, NextFunction } from 'express';
import { presenceReunionService } from '../services/presence-reunion.service';

export class PresenceReunionController {
  /**
   * Enregistrer une presence
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await presenceReunionService.create(req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Enregistrer plusieurs presences en une fois
   */
  async createBulk(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await presenceReunionService.createBulk(req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir les presences d'une reunion
   */
  async findByReunion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await presenceReunionService.findByReunion(req.params.reunionId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir une presence par ID
   */
  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await presenceReunionService.findById(req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mettre a jour une presence
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await presenceReunionService.update(req.params.id, req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Supprimer une presence
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await presenceReunionService.delete(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir le resume des presences d'une reunion
   */
  async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await presenceReunionService.getSummary(req.params.reunionId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const presenceReunionController = new PresenceReunionController();
