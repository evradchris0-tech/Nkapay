/**
 * Controlleur pour la gestion des exercices
 */

import { Request, Response, NextFunction } from 'express';
import { exerciceService } from '../services/exercice.service';
import { ApiResponse } from '../../../shared';

export class ExerciceController {
  /**
   * Creer un nouvel exercice
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await exerciceService.create(req.body);
      res.status(201).json(ApiResponse.success(result, 'Exercice cree avec succes'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Ouvrir un exercice
   */
  async ouvrir(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await exerciceService.ouvrir(req.params.id, req.body);
      res.json(ApiResponse.success(result, 'Exercice ouvert avec succes'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Suspendre un exercice
   */
  async suspendre(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await exerciceService.suspendre(req.params.id);
      res.json(ApiResponse.success(result, 'Exercice suspendu'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reprendre un exercice suspendu
   */
  async reprendre(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await exerciceService.reprendre(req.params.id);
      res.json(ApiResponse.success(result, 'Exercice repris'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Fermer un exercice
   */
  async fermer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await exerciceService.fermer(req.params.id);
      res.json(ApiResponse.success(result, 'Exercice ferme'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lister tous les exercices d'une tontine
   */
  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await exerciceService.findAll(req.query as any);
      res.json(ApiResponse.success(result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Trouver l'exercice ouvert d'une tontine
   */
  async findExerciceOuvert(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await exerciceService.findExerciceOuvert(req.params.tontineId);
      res.json(ApiResponse.success(result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir un exercice par ID
   */
  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await exerciceService.findById(req.params.id);
      res.json(ApiResponse.success(result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mettre a jour un exercice
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await exerciceService.update(req.params.id, req.body);
      res.json(ApiResponse.success(result, 'Exercice mis a jour'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Supprimer un exercice
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await exerciceService.delete(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const exerciceController = new ExerciceController();
