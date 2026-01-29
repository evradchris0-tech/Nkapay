/**
 * Contrôleur pour la gestion des paiements mobiles
 */

import { Request, Response, NextFunction } from 'express';
import { paiementMobileService } from '../services/paiement-mobile.service';

export class PaiementMobileController {
  /**
   * @swagger
   * /api/paiements-mobile:
   *   post:
   *     summary: Initier un paiement mobile
   *     tags: [PaiementsMobile]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - transactionId
   *               - operateur
   *               - numeroTelephone
   *               - montant
   *             properties:
   *               transactionId:
   *                 type: string
   *               operateur:
   *                 type: string
   *                 enum: [MTN_MOBILE_MONEY, ORANGE_MONEY, MOOV_MONEY, WAVE, FREE_MONEY, AIRTEL_MONEY]
   *               numeroTelephone:
   *                 type: string
   *               montant:
   *                 type: number
   *     responses:
   *       201:
   *         description: Paiement initié
   */
  async initier(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await paiementMobileService.initier(req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/paiements-mobile:
   *   get:
   *     summary: Récupérer tous les paiements mobiles
   *     tags: [PaiementsMobile]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: transactionId
   *         schema:
   *           type: string
   *       - in: query
   *         name: operateur
   *         schema:
   *           type: string
   *       - in: query
   *         name: statut
   *         schema:
   *           type: string
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Liste des paiements
   */
  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await paiementMobileService.findAll(req.query as any, page, limit);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/paiements-mobile/pending:
   *   get:
   *     summary: Récupérer les paiements en attente
   *     tags: [PaiementsMobile]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Liste des paiements en attente
   */
  async findPending(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await paiementMobileService.findPending();
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/paiements-mobile/stats:
   *   get:
   *     summary: Statistiques par opérateur
   *     tags: [PaiementsMobile]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Statistiques
   */
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await paiementMobileService.getStatsByOperateur();
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/paiements-mobile/{id}:
   *   get:
   *     summary: Récupérer un paiement par ID
   *     tags: [PaiementsMobile]
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
   *         description: Paiement trouvé
   */
  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await paiementMobileService.findById(req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/paiements-mobile/transaction/{transactionId}:
   *   get:
   *     summary: Récupérer les paiements d'une transaction
   *     tags: [PaiementsMobile]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: transactionId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Liste des paiements
   */
  async findByTransaction(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await paiementMobileService.findByTransaction(req.params.transactionId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/paiements-mobile/{id}/envoyer:
   *   post:
   *     summary: Marquer le paiement comme envoyé
   *     tags: [PaiementsMobile]
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
   *               referenceOperateur:
   *                 type: string
   *     responses:
   *       200:
   *         description: Paiement marqué comme envoyé
   */
  async marquerEnvoye(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await paiementMobileService.marquerEnvoye(
        req.params.id, 
        req.body.referenceOperateur
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/paiements-mobile/{id}/confirmer:
   *   post:
   *     summary: Confirmer le paiement
   *     tags: [PaiementsMobile]
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
   *               referenceOperateur:
   *                 type: string
   *     responses:
   *       200:
   *         description: Paiement confirmé
   */
  async confirmer(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await paiementMobileService.confirmer(
        req.params.id, 
        req.body.referenceOperateur
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/paiements-mobile/{id}/echouer:
   *   post:
   *     summary: Marquer le paiement comme échoué
   *     tags: [PaiementsMobile]
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
   *               messageOperateur:
   *                 type: string
   *     responses:
   *       200:
   *         description: Paiement marqué comme échoué
   */
  async marquerEchoue(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await paiementMobileService.marquerEchoue(
        req.params.id, 
        req.body.messageOperateur
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/paiements-mobile/{id}/annuler:
   *   post:
   *     summary: Annuler le paiement
   *     tags: [PaiementsMobile]
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
   *               motif:
   *                 type: string
   *     responses:
   *       200:
   *         description: Paiement annulé
   */
  async annuler(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await paiementMobileService.annuler(req.params.id, req.body.motif);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const paiementMobileController = new PaiementMobileController();
