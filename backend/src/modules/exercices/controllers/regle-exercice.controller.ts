/**
 * Contrôleur pour la gestion des règles au niveau exercice
 */

import { Request, Response, NextFunction } from 'express';
import { regleExerciceService } from '../services/regle-exercice.service';

export class RegleExerciceController {
  /**
   * @swagger
   * /api/regles-exercice:
   *   post:
   *     summary: Créer ou mettre à jour une règle exercice
   *     tags: [ReglesExercice]
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
   *               - ruleDefinitionId
   *               - valeur
   *             properties:
   *               exerciceId:
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
      const result = await regleExerciceService.upsert(req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/regles-exercice/exercice/{exerciceId}:
   *   get:
   *     summary: Récupérer les règles d'un exercice
   *     tags: [ReglesExercice]
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
   *         description: Liste des règles
   */
  async findByExercice(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await regleExerciceService.findByExercice(req.params.exerciceId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/regles-exercice/exercice/{exerciceId}/effectives:
   *   get:
   *     summary: Récupérer les règles effectives d'un exercice (cascade exercice > tontine > défaut)
   *     tags: [ReglesExercice]
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
   *         description: Liste des règles effectives
   */
  async getEffectiveRules(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await regleExerciceService.getEffectiveRules(req.params.exerciceId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/regles-exercice/exercice/{exerciceId}/valeur/{cle}:
   *   get:
   *     summary: Récupérer la valeur effective d'une règle par clé
   *     tags: [ReglesExercice]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: exerciceId
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
  async getEffectiveValueByCle(req: Request, res: Response, next: NextFunction) {
    try {
      const valeur = await regleExerciceService.getEffectiveValueByCle(
        req.params.exerciceId,
        req.params.cle
      );
      res.json({ cle: req.params.cle, valeur });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/regles-exercice/{id}:
   *   get:
   *     summary: Récupérer une règle par ID
   *     tags: [ReglesExercice]
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
      const result = await regleExerciceService.findById(req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/regles-exercice/{id}:
   *   put:
   *     summary: Mettre à jour une règle
   *     tags: [ReglesExercice]
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
      const result = await regleExerciceService.update(req.params.id, req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/regles-exercice/{id}:
   *   delete:
   *     summary: Supprimer une règle (revenir à la valeur tontine/défaut)
   *     tags: [ReglesExercice]
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
      await regleExerciceService.delete(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/regles-exercice/exercice/{exerciceId}/initialize:
   *   post:
   *     summary: Initialiser les règles d'un exercice depuis la tontine
   *     tags: [ReglesExercice]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: exerciceId
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
   *               - tontineId
   *             properties:
   *               tontineId:
   *                 type: string
   *     responses:
   *       200:
   *         description: Règles initialisées
   */
  async initializeFromTontine(req: Request, res: Response, next: NextFunction) {
    try {
      await regleExerciceService.initializeFromTontine(req.params.exerciceId, req.body.tontineId);
      res.json({ message: 'Règles initialisées depuis la tontine' });
    } catch (error) {
      next(error);
    }
  }
}

export const regleExerciceController = new RegleExerciceController();
