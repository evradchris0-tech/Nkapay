/**
 * Contrôleur pour la gestion des dues (cotisations, pots, inscriptions, épargnes)
 */

import { Request, Response, NextFunction } from 'express';
import { cotisationDueService } from '../services/cotisation-due.service';
import { potDuService } from '../services/pot-du.service';
import { inscriptionDueService } from '../services/inscription-due.service';
import { epargneDueService } from '../services/epargne-due.service';

export class DuesController {
  // ==================== COTISATIONS ====================

  /**
   * @swagger
   * /api/cotisations-dues/reunion/{reunionId}/generer:
   *   post:
   *     summary: Générer les cotisations dues pour une réunion
   *     tags: [CotisationsDues]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: reunionId
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
   *               - montantCotisation
   *             properties:
   *               montantCotisation:
   *                 type: number
   *     responses:
   *       200:
   *         description: Cotisations générées
   */
  async genererCotisations(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await cotisationDueService.genererPourReunion(
        req.params.reunionId,
        req.body.montantCotisation
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/cotisations-dues/{id}/payer:
   *   post:
   *     summary: Enregistrer un paiement de cotisation
   *     tags: [CotisationsDues]
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
  async payerCotisation(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await cotisationDueService.enregistrerPaiement(req.params.id, req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/cotisations-dues/reunion/{reunionId}:
   *   get:
   *     summary: Récupérer les cotisations d'une réunion
   *     tags: [CotisationsDues]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: reunionId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Liste des cotisations
   */
  async findCotisationsByReunion(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await cotisationDueService.findByReunion(req.params.reunionId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/cotisations-dues/reunion/{reunionId}/stats:
   *   get:
   *     summary: Statistiques des cotisations d'une réunion
   *     tags: [CotisationsDues]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: reunionId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Statistiques
   */
  async getCotisationStats(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await cotisationDueService.getStatsByReunion(req.params.reunionId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // ==================== POTS ====================

  /**
   * @swagger
   * /api/pots-dus/reunion/{reunionId}/generer:
   *   post:
   *     summary: Générer les pots dus pour une réunion
   *     tags: [PotsDus]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: reunionId
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
   *               - montantPot
   *             properties:
   *               montantPot:
   *                 type: number
   *     responses:
   *       200:
   *         description: Pots générés
   */
  async genererPots(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await potDuService.genererPourReunion(
        req.params.reunionId,
        req.body.montantPot
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/pots-dus/{id}/payer:
   *   post:
   *     summary: Enregistrer un paiement de pot
   *     tags: [PotsDus]
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
  async payerPot(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await potDuService.enregistrerPaiement(req.params.id, req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/pots-dus/reunion/{reunionId}:
   *   get:
   *     summary: Récupérer les pots d'une réunion
   *     tags: [PotsDus]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: reunionId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Liste des pots
   */
  async findPotsByReunion(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await potDuService.findByReunion(req.params.reunionId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/pots-dus/reunion/{reunionId}/stats:
   *   get:
   *     summary: Statistiques des pots d'une réunion
   *     tags: [PotsDus]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: reunionId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Statistiques
   */
  async getPotStats(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await potDuService.getStatsByReunion(req.params.reunionId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/pots-dus/reunion/{reunionId}/total:
   *   get:
   *     summary: Pot total collecté pour une réunion
   *     tags: [PotsDus]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: reunionId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Total du pot
   */
  async getPotTotal(req: Request, res: Response, next: NextFunction) {
    try {
      const total = await potDuService.getPotTotalReunion(req.params.reunionId);
      res.json({ reunionId: req.params.reunionId, potTotal: total });
    } catch (error) {
      next(error);
    }
  }

  // ==================== INSCRIPTIONS ====================

  /**
   * @swagger
   * /api/inscriptions-dues/exercice/{exerciceId}/generer:
   *   post:
   *     summary: Générer les inscriptions dues pour un exercice
   *     tags: [InscriptionsDues]
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
   *               - montantInscription
   *             properties:
   *               montantInscription:
   *                 type: number
   *     responses:
   *       200:
   *         description: Inscriptions générées
   */
  async genererInscriptions(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await inscriptionDueService.genererPourExercice(
        req.params.exerciceId,
        req.body.montantInscription
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/inscriptions-dues/{id}/payer:
   *   post:
   *     summary: Enregistrer un paiement d'inscription
   *     tags: [InscriptionsDues]
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
  async payerInscription(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await inscriptionDueService.enregistrerPaiement(req.params.id, req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/inscriptions-dues/exercice/{exerciceId}:
   *   get:
   *     summary: Récupérer les inscriptions d'un exercice
   *     tags: [InscriptionsDues]
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
   *         description: Liste des inscriptions
   */
  async findInscriptionsByExercice(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await inscriptionDueService.findByExercice(req.params.exerciceId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/inscriptions-dues/exercice/{exerciceId}/stats:
   *   get:
   *     summary: Statistiques des inscriptions d'un exercice
   *     tags: [InscriptionsDues]
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
  async getInscriptionStats(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await inscriptionDueService.getStatsByExercice(req.params.exerciceId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/inscriptions-dues/en-retard:
   *   get:
   *     summary: Récupérer les inscriptions en retard
   *     tags: [InscriptionsDues]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: exerciceId
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Liste des inscriptions en retard
   */
  async findInscriptionsEnRetard(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await inscriptionDueService.findEnRetard(req.query.exerciceId as string);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // ==================== EPARGNES ====================

  /**
   * @swagger
   * /api/epargnes-dues/reunion/{reunionId}/generer:
   *   post:
   *     summary: Générer les épargnes dues pour une réunion
   *     tags: [EpargnesDues]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: reunionId
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
   *               - montantEpargne
   *             properties:
   *               montantEpargne:
   *                 type: number
   *     responses:
   *       200:
   *         description: Épargnes générées
   */
  async genererEpargnes(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await epargneDueService.genererPourReunion(
        req.params.reunionId,
        req.body.montantEpargne
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/epargnes-dues/{id}/payer:
   *   post:
   *     summary: Enregistrer un paiement d'épargne
   *     tags: [EpargnesDues]
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
  async payerEpargne(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await epargneDueService.payer(req.params.id, req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/epargnes-dues/reunion/{reunionId}:
   *   get:
   *     summary: Récupérer les épargnes d'une réunion
   *     tags: [EpargnesDues]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: reunionId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Liste des épargnes
   */
  async findEpargnesByReunion(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await epargneDueService.findByReunion(req.params.reunionId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/epargnes-dues/reunion/{reunionId}/stats:
   *   get:
   *     summary: Statistiques des épargnes d'une réunion
   *     tags: [EpargnesDues]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: reunionId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Statistiques
   */
  async getEpargneStats(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await epargneDueService.getStatsByReunion(req.params.reunionId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const duesController = new DuesController();
