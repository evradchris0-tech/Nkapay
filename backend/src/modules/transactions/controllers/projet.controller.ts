/**
 * Contrôleur pour la gestion des projets
 */

import { Request, Response, NextFunction } from 'express';
import { projetService } from '../services/projet.service';

export class ProjetController {
  /**
   * @swagger
   * /api/projets:
   *   post:
   *     summary: Créer un nouveau projet
   *     tags: [Projets]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - exerciceId
   *               - nom
   *               - creeParExerciceMembreId
   *             properties:
   *               exerciceId:
   *                 type: string
   *               nom:
   *                 type: string
   *               description:
   *                 type: string
   *               budgetPrevu:
   *                 type: number
   *               creeParExerciceMembreId:
   *                 type: string
   *     responses:
   *       201:
   *         description: Projet créé
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await projetService.create(req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/projets:
   *   get:
   *     summary: Récupérer tous les projets
   *     tags: [Projets]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: exerciceId
   *         schema:
   *           type: string
   *       - in: query
   *         name: statut
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Liste des projets
   */
  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await projetService.findAll(req.query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/projets/exercice/{exerciceId}:
   *   get:
   *     summary: Récupérer les projets d'un exercice
   *     tags: [Projets]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: exerciceId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Liste des projets
   */
  async findByExercice(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await projetService.findByExercice(req.params.exerciceId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/projets/exercice/{exerciceId}/stats:
   *   get:
   *     summary: Récupérer les statistiques des projets d'un exercice
   *     tags: [Projets]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: exerciceId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Statistiques des projets
   */
  async getStatsByExercice(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await projetService.getStatsByExercice(req.params.exerciceId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/projets/{id}:
   *   get:
   *     summary: Récupérer un projet par ID
   *     tags: [Projets]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Projet trouvé
   */
  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await projetService.findById(req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/projets/{id}:
   *   put:
   *     summary: Mettre à jour un projet
   *     tags: [Projets]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *     responses:
   *       200:
   *         description: Projet mis à jour
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await projetService.update(req.params.id, req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/projets/{id}/cloturer:
   *   post:
   *     summary: Clôturer un projet
   *     tags: [Projets]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Projet clôturé
   */
  async cloturer(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await projetService.cloturer(req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/projets/{id}/annuler:
   *   post:
   *     summary: Annuler un projet
   *     tags: [Projets]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Projet annulé
   */
  async annuler(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await projetService.annuler(req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/projets/{id}:
   *   delete:
   *     summary: Supprimer un projet
   *     tags: [Projets]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       204:
   *         description: Projet supprimé
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await projetService.delete(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const projetController = new ProjetController();
