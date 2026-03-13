import { Request, Response, NextFunction } from 'express';
import { exerciceMembreService } from '../services/exercice-membre.service';
import { ApiResponse } from '../../../shared';

export class ExerciceMembreController {
  /**
   * Ajouter un membre a un exercice
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await exerciceMembreService.create(req.body);
      res.status(201).json(ApiResponse.success(result, "Membre ajouté à l'exercice"));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lister les membres d'un exercice
   */
  async findByExercice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await exerciceMembreService.findByExercice(
        req.params.exerciceId,
        req.query as any
      );
      res.json(ApiResponse.success(result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir un membre d'exercice par ID
   */
  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await exerciceMembreService.findById(req.params.id);
      res.json(ApiResponse.success(result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mettre a jour un membre d'exercice
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await exerciceMembreService.update(req.params.id, req.body);
      res.json(ApiResponse.success(result, "Membre d'exercice mis à jour"));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Desactiver un membre d'exercice
   */
  async deactivate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await exerciceMembreService.deactivate(req.params.id);
      res.json(ApiResponse.success(result, "Membre d'exercice désactivé"));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reactiver un membre d'exercice
   */
  async reactivate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await exerciceMembreService.reactivate(req.params.id);
      res.json(ApiResponse.success(result, "Membre d'exercice réactivé"));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Supprimer un membre d'exercice
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await exerciceMembreService.delete(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const exerciceMembreController = new ExerciceMembreController();
