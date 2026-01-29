/**
 * Contrôleur pour la gestion du catalogue des règles
 */

import { Request, Response, NextFunction } from 'express';
import { ruleDefinitionService } from '../services/rule-definition.service';
import { CategorieRegle } from '../entities/rule-definition.entity';

export class RuleDefinitionController {
  /**
   * @swagger
   * /api/rule-definitions:
   *   post:
   *     summary: Créer une nouvelle définition de règle
   *     tags: [RuleDefinitions]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - cle
   *               - libelle
   *               - typeValeur
   *               - categorie
   *             properties:
   *               cle:
   *                 type: string
   *               libelle:
   *                 type: string
   *               typeValeur:
   *                 type: string
   *                 enum: [MONTANT, POURCENTAGE, ENTIER, BOOLEEN, TEXTE]
   *               valeurDefaut:
   *                 type: string
   *               categorie:
   *                 type: string
   *                 enum: [GLOBAL, COTISATION, POT, SECOURS, PRET, EPARGNE, INSCRIPTION, PENALITE, SECURITE]
   *     responses:
   *       201:
   *         description: Définition créée
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ruleDefinitionService.create(req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/rule-definitions:
   *   get:
   *     summary: Récupérer toutes les définitions de règles
   *     tags: [RuleDefinitions]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: categorie
   *         schema:
   *           type: string
   *       - in: query
   *         name: typeValeur
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Liste des définitions
   */
  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ruleDefinitionService.findAll(req.query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/rule-definitions/categorie/{categorie}:
   *   get:
   *     summary: Récupérer les définitions par catégorie
   *     tags: [RuleDefinitions]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: categorie
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Liste des définitions
   */
  async findByCategorie(req: Request, res: Response, next: NextFunction) {
    try {
      const categorie = req.params.categorie as CategorieRegle;
      const result = await ruleDefinitionService.findByCategorie(categorie);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/rule-definitions/modifiables/tontine:
   *   get:
   *     summary: Récupérer les règles modifiables par tontine
   *     tags: [RuleDefinitions]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Liste des définitions
   */
  async findModifiablesByTontine(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ruleDefinitionService.findModifiablesByTontine();
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/rule-definitions/modifiables/exercice:
   *   get:
   *     summary: Récupérer les règles modifiables par exercice
   *     tags: [RuleDefinitions]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Liste des définitions
   */
  async findModifiablesByExercice(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ruleDefinitionService.findModifiablesByExercice();
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/rule-definitions/{id}:
   *   get:
   *     summary: Récupérer une définition par ID
   *     tags: [RuleDefinitions]
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
   *         description: Définition trouvée
   */
  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ruleDefinitionService.findById(req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/rule-definitions/cle/{cle}:
   *   get:
   *     summary: Récupérer une définition par clé
   *     tags: [RuleDefinitions]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: cle
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Définition trouvée
   */
  async findByCle(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ruleDefinitionService.findByCle(req.params.cle);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/rule-definitions/{id}:
   *   put:
   *     summary: Mettre à jour une définition
   *     tags: [RuleDefinitions]
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
   *         description: Définition mise à jour
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ruleDefinitionService.update(req.params.id, req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/rule-definitions/{id}:
   *   delete:
   *     summary: Supprimer une définition
   *     tags: [RuleDefinitions]
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
   *         description: Définition supprimée
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await ruleDefinitionService.delete(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const ruleDefinitionController = new RuleDefinitionController();
