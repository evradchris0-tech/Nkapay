/**
 * Contrôleur pour la gestion des bilans de secours et secours dus annuels
 */

import { Request, Response, NextFunction } from 'express';
import { bilanSecoursService } from '../services/bilan-secours.service';
import { secoursDuAnnuelService } from '../services/secours-du-annuel.service';

export class BilanSecoursController {
  // ==================== BILAN SECOURS ====================

  /**
   * @swagger
   * /api/bilans-secours/exercice/{exerciceId}:
   *   get:
   *     summary: Récupérer ou créer le bilan de secours d'un exercice
   *     tags: [BilansSecours]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: exerciceId
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: soldeInitial
   *         schema:
   *           type: number
   *     responses:
   *       200:
   *         description: Bilan de secours
   */
  async getOrCreateBilan(req: Request, res: Response, next: NextFunction) {
    try {
      const soldeInitial = parseFloat(req.query.soldeInitial as string) || 0;
      const result = await bilanSecoursService.getOrCreate(req.params.exerciceId, soldeInitial);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/bilans-secours:
   *   get:
   *     summary: Récupérer tous les bilans de secours
   *     tags: [BilansSecours]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Liste des bilans
   */
  async findAllBilans(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await bilanSecoursService.findAll();
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/bilans-secours/{id}:
   *   get:
   *     summary: Récupérer un bilan par ID
   *     tags: [BilansSecours]
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
   *         description: Bilan trouvé
   */
  async findBilanById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await bilanSecoursService.findById(req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/bilans-secours/exercice/{exerciceId}/solde-initial:
   *   put:
   *     summary: Mettre à jour le solde initial
   *     tags: [BilansSecours]
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
   *               - soldeInitial
   *             properties:
   *               soldeInitial:
   *                 type: number
   *     responses:
   *       200:
   *         description: Bilan mis à jour
   */
  async updateSoldeInitial(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await bilanSecoursService.updateSoldeInitial(
        req.params.exerciceId, 
        req.body.soldeInitial
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/bilans-secours/exercice/{exerciceId}/recalculer:
   *   post:
   *     summary: Recalculer le bilan à partir des événements
   *     tags: [BilansSecours]
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
   *         description: Bilan recalculé
   */
  async recalculerBilan(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await bilanSecoursService.recalculer(req.params.exerciceId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/bilans-secours/exercice/{exerciceId}/cloturer:
   *   post:
   *     summary: Clôturer le bilan et reporter sur le prochain exercice
   *     tags: [BilansSecours]
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
   *               - exerciceSuivantId
   *             properties:
   *               exerciceSuivantId:
   *                 type: string
   *     responses:
   *       200:
   *         description: Bilan clôturé et nouveau bilan créé
   */
  async cloturerBilan(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await bilanSecoursService.cloturer(
        req.params.exerciceId, 
        req.body.exerciceSuivantId
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // ==================== SECOURS DUS ANNUELS ====================

  /**
   * @swagger
   * /api/secours-dus/exercice/{exerciceId}/generer:
   *   post:
   *     summary: Générer les secours dus pour un exercice
   *     tags: [SecoursDus]
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
   *               - montantSecours
   *             properties:
   *               montantSecours:
   *                 type: number
   *     responses:
   *       200:
   *         description: Secours générés
   */
  async genererSecoursDus(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await secoursDuAnnuelService.genererPourExercice(
        req.params.exerciceId, 
        req.body.montantSecours
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/secours-dus/{id}/payer:
   *   post:
   *     summary: Enregistrer un paiement de secours
   *     tags: [SecoursDus]
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
   *             required:
   *               - montantPaye
   *             properties:
   *               montantPaye:
   *                 type: number
   *     responses:
   *       200:
   *         description: Paiement enregistré
   */
  async payerSecours(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await secoursDuAnnuelService.enregistrerPaiement(req.params.id, req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/secours-dus/exercice/{exerciceId}:
   *   get:
   *     summary: Récupérer les secours d'un exercice
   *     tags: [SecoursDus]
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
   *         description: Liste des secours
   */
  async findSecoursByExercice(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await secoursDuAnnuelService.findByExercice(req.params.exerciceId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/secours-dus/{id}:
   *   get:
   *     summary: Récupérer un secours dû par ID
   *     tags: [SecoursDus]
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
   *         description: Secours trouvé
   */
  async findSecoursById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await secoursDuAnnuelService.findById(req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/secours-dus/exercice/{exerciceId}/stats:
   *   get:
   *     summary: Statistiques des secours d'un exercice
   *     tags: [SecoursDus]
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
   *         description: Statistiques
   */
  async getSecoursStats(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await secoursDuAnnuelService.getStatsByExercice(req.params.exerciceId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/secours-dus/en-retard:
   *   get:
   *     summary: Récupérer les secours en retard
   *     tags: [SecoursDus]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: exerciceId
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Liste des secours en retard
   */
  async findSecoursEnRetard(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await secoursDuAnnuelService.findEnRetard(req.query.exerciceId as string);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const bilanSecoursController = new BilanSecoursController();
