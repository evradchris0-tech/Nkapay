/**
 * Contrôleur pour la gestion des cassations
 */

import { Request, Response, NextFunction } from 'express';
import { cassationService } from '../services/cassation.service';

export class CassationController {
  /**
   * @swagger
   * /api/cassations/exercice/{exerciceId}/calculer:
   *   post:
   *     summary: Calculer les cassations pour un exercice
   *     tags: [Cassations]
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
   *         description: Cassations calculées
   */
  async calculer(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await cassationService.calculerPourExercice(req.params.exerciceId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/cassations/{id}/distribuer:
   *   patch:
   *     summary: Distribuer une cassation individuelle
   *     tags: [Cassations]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               transactionId:
   *                 type: string
   *     responses:
   *       200:
   *         description: Cassation distribuée
   */
  async distribuer(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await cassationService.distribuer(req.params.id, req.body.transactionId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/cassations/exercice/{exerciceId}/distribuer-tout:
   *   patch:
   *     summary: Distribuer toutes les cassations d'un exercice
   *     tags: [Cassations]
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
   *         description: Cassations distribuées
   */
  async distribuerTout(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await cassationService.distribuerTout(req.params.exerciceId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/cassations/{id}/annuler:
   *   patch:
   *     summary: Annuler une cassation
   *     tags: [Cassations]
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
   *         description: Cassation annulée
   */
  async annuler(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await cassationService.annuler(req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/cassations/exercice/{exerciceId}:
   *   get:
   *     summary: Lister les cassations d'un exercice
   *     tags: [Cassations]
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
   *         description: Liste des cassations
   */
  async findByExercice(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await cassationService.findByExercice(req.params.exerciceId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/cassations/{id}:
   *   get:
   *     summary: Récupérer une cassation par ID
   *     tags: [Cassations]
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
   *         description: Détail de la cassation
   */
  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await cassationService.findById(req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/cassations/exercice/{exerciceId}/summary:
   *   get:
   *     summary: Résumé des cassations d'un exercice
   *     tags: [Cassations]
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
   *         description: Résumé
   */
  async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await cassationService.getSummary(req.params.exerciceId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/cassations/exercice/{exerciceId}/reset:
   *   delete:
   *     summary: Réinitialiser les cassations d'un exercice
   *     tags: [Cassations]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: exerciceId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       204:
   *         description: Cassations supprimées
   */
  async resetExercice(req: Request, res: Response, next: NextFunction) {
    try {
      await cassationService.resetExercice(req.params.exerciceId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const cassationController = new CassationController();
