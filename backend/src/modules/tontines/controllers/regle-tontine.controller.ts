/**
 * Contrôleur pour la gestion des règles au niveau tontine
 */

import { Request, Response, NextFunction } from 'express';
import { regleTontineService } from '../services/regle-tontine.service';
import { ApiResponse } from '../../../shared';

export class RegleTontineController {
  /**
   * @swagger
   * /api/regles-tontine:
   *   post:
   *     summary: Créer ou mettre à jour une règle tontine
   *     tags: [ReglesTontine]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - tontineId
   *               - ruleDefinitionId
   *               - valeur
   *             properties:
   *               tontineId:
   *                 type: string
   *               ruleDefinitionId:
   *                 type: string
   *               valeur:
   *                 type: string
   *     responses:
   *       200:
   *         description: Règle créée ou mise à jour
   */
  async upsert(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await regleTontineService.upsert(req.body);
      res.json(ApiResponse.success(result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/regles-tontine/tontine/{tontineId}:
   *   get:
   *     summary: Récupérer les règles d'une tontine
   *     tags: [ReglesTontine]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: tontineId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Liste des règles
   */
  async findByTontine(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await regleTontineService.findByTontine(req.params.tontineId);
      res.json(ApiResponse.success(result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/regles-tontine/tontine/{tontineId}/effectives:
   *   get:
   *     summary: Récupérer les règles effectives d'une tontine
   *     tags: [ReglesTontine]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: tontineId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Liste des règles effectives
   */
  async getEffectiveRules(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await regleTontineService.getEffectiveRules(req.params.tontineId);
      res.json(ApiResponse.success(result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/regles-tontine/tontine/{tontineId}/valeur/{cle}:
   *   get:
   *     summary: Récupérer la valeur d'une règle par clé
   *     tags: [ReglesTontine]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: tontineId
   *         required: true
   *         schema:
   *           type: string
   *       - in: path
   *         name: cle
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Valeur de la règle
   */
  async getValueByCle(req: Request, res: Response, next: NextFunction) {
    try {
      const valeur = await regleTontineService.getValueByCle(
        req.params.tontineId, 
        req.params.cle
      );
      res.json(ApiResponse.success({ cle: req.params.cle, valeur }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/regles-tontine/{id}:
   *   get:
   *     summary: Récupérer une règle par ID
   *     tags: [ReglesTontine]
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
   *         description: Règle trouvée
   */
  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await regleTontineService.findById(req.params.id);
      res.json(ApiResponse.success(result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/regles-tontine/{id}:
   *   put:
   *     summary: Mettre à jour une règle
   *     tags: [ReglesTontine]
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
   *         description: Règle mise à jour
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await regleTontineService.update(req.params.id, req.body);
      res.json(ApiResponse.success(result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/regles-tontine/{id}:
   *   delete:
   *     summary: Supprimer une règle (revenir à la valeur par défaut)
   *     tags: [ReglesTontine]
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
   *         description: Règle supprimée
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await regleTontineService.delete(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/regles-tontine/tontine/{tontineId}/initialize:
   *   post:
   *     summary: Initialiser les règles par défaut d'une tontine
   *     tags: [ReglesTontine]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: tontineId
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - adhesionTontineId
   *             properties:
   *               adhesionTontineId:
   *                 type: string
   *     responses:
   *       200:
   *         description: Règles initialisées
   */
  async initializeDefaultRules(req: Request, res: Response, next: NextFunction) {
    try {
      await regleTontineService.initializeDefaultRules(
        req.params.tontineId, 
        req.body.adhesionTontineId
      );
      res.json({ message: 'Règles par défaut initialisées' });
    } catch (error) {
      next(error);
    }
  }
}

export const regleTontineController = new RegleTontineController();
