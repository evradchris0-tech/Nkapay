/**
 * Controlleur pour la gestion des penalites
 */

import { Request, Response, NextFunction } from 'express';
import { penaliteService } from '../services/penalite.service';

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
   * Lister les penalites
   */
  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await penaliteService.findAll(req.query as any);
      res.json(result);
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
