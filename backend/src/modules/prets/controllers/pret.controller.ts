/**
 * Controller pour la gestion des prets
 */

import { Request, Response, NextFunction } from 'express';
import { pretService } from '../services/pret.service';
import { PretFiltersDto } from '../dto/pret.dto';

export class PretController {
  /**
   * @swagger
   * /prets:
   *   post:
   *     summary: Demander un pret
   *     tags: [Prets]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreatePretDto'
   *     responses:
   *       201:
   *         description: Pret demande
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pret = await pretService.create(req.body);
      res.status(201).json(pret);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /prets:
   *   get:
   *     summary: Lister les prets
   *     tags: [Prets]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: exerciceId
   *         schema:
   *           type: string
   *       - in: query
   *         name: exerciceMembreId
   *         schema:
   *           type: string
   *       - in: query
   *         name: statut
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Liste des prets
   */
  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters: PretFiltersDto = {
        exerciceId: req.query.exerciceId as string,
        exerciceMembreId: req.query.exerciceMembreId as string,
        statut: req.query.statut as any,
        dateDebut: req.query.dateDebut as string,
        dateFin: req.query.dateFin as string,
      };
      const result = await pretService.findAll(filters);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /prets/summary:
   *   get:
   *     summary: Obtenir le resume des prets
   *     tags: [Prets]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Resume des prets
   */
  async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters: PretFiltersDto = {
        exerciceId: req.query.exerciceId as string,
        exerciceMembreId: req.query.exerciceMembreId as string,
        statut: req.query.statut as any,
      };
      const summary = await pretService.getSummary(filters);
      res.json(summary);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /prets/{id}:
   *   get:
   *     summary: Obtenir un pret par ID
   *     tags: [Prets]
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
   *         description: Pret trouve
   */
  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pret = await pretService.findById(req.params.id);
      res.json(pret);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /prets/{id}/approuver:
   *   post:
   *     summary: Approuver un pret
   *     tags: [Prets]
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
   *             $ref: '#/components/schemas/ApprouverPretDto'
   *     responses:
   *       200:
   *         description: Pret approuve
   */
  async approuver(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pret = await pretService.approuver(req.params.id, req.body);
      res.json(pret);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /prets/{id}/refuser:
   *   post:
   *     summary: Refuser un pret
   *     tags: [Prets]
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
   *             $ref: '#/components/schemas/RefuserPretDto'
   *     responses:
   *       200:
   *         description: Pret refuse
   */
  async refuser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pret = await pretService.refuser(req.params.id, req.body);
      res.json(pret);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /prets/{id}/decaisser:
   *   post:
   *     summary: Decaisser un pret
   *     tags: [Prets]
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
   *             $ref: '#/components/schemas/DecaisserPretDto'
   *     responses:
   *       200:
   *         description: Pret decaisse
   */
  async decaisser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pret = await pretService.decaisser(req.params.id, req.body || {});
      res.json(pret);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /prets/{id}/solder:
   *   post:
   *     summary: Marquer un pret comme solde
   *     tags: [Prets]
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
   *         description: Pret solde
   */
  async solder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pret = await pretService.solder(req.params.id);
      res.json(pret);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /prets/{id}/defaut:
   *   post:
   *     summary: Marquer un pret en defaut
   *     tags: [Prets]
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
   *         description: Pret en defaut
   */
  async mettreEnDefaut(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pret = await pretService.mettreEnDefaut(req.params.id);
      res.json(pret);
    } catch (error) {
      next(error);
    }
  }
}

export const pretController = new PretController();
