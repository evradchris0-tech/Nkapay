/**
 * Controlleur pour la gestion des evenements de secours
 */

import { Request, Response, NextFunction } from 'express';
import { evenementSecoursService } from '../services/evenement-secours.service';

export class EvenementSecoursController {
  /**
   * Declarer un evenement de secours
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await evenementSecoursService.create(req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Soumettre un evenement pour validation
   */
  async soumettre(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await evenementSecoursService.soumettre(req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Valider un evenement de secours
   */
  async valider(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await evenementSecoursService.valider(req.params.id, req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refuser un evenement de secours
   */
  async refuser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await evenementSecoursService.refuser(req.params.id, req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Payer un evenement de secours
   */
  async payer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await evenementSecoursService.payer(req.params.id, req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lister les evenements de secours
   */
  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await evenementSecoursService.findAll(req.query as any);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir un evenement de secours par ID
   */
  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await evenementSecoursService.findById(req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir le resume des secours
   */
  async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await evenementSecoursService.getSummary(req.query as any);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const evenementSecoursController = new EvenementSecoursController();
