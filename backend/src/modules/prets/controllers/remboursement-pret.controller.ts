/**
 * Controller pour la gestion des remboursements de prets
 */

import { Request, Response, NextFunction } from 'express';
import { remboursementPretService } from '../services/remboursement-pret.service';

export class RemboursementPretController {
  /**
   * @swagger
   * /remboursements-prets:
   *   post:
   *     summary: Creer un remboursement de pret
   *     tags: [Remboursements Prets]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateRemboursementDto'
   *     responses:
   *       201:
   *         description: Remboursement cree
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const remboursement = await remboursementPretService.create(req.body);
      res.status(201).json(remboursement);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /remboursements-prets/pret/{pretId}:
   *   get:
   *     summary: Lister les remboursements d'un pret
   *     tags: [Remboursements Prets]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: pretId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Liste des remboursements
   */
  async findByPret(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const remboursements = await remboursementPretService.findByPret(req.params.pretId);
      res.json(remboursements);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /remboursements-prets/reunion/{reunionId}:
   *   get:
   *     summary: Lister les remboursements d'une reunion
   *     tags: [Remboursements Prets]
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
   *         description: Liste des remboursements
   */
  async findByReunion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const remboursements = await remboursementPretService.findByReunion(req.params.reunionId);
      res.json(remboursements);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /remboursements-prets/{id}:
   *   get:
   *     summary: Obtenir un remboursement par ID
   *     tags: [Remboursements Prets]
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
   *         description: Remboursement trouve
   */
  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const remboursement = await remboursementPretService.findById(req.params.id);
      res.json(remboursement);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /remboursements-prets/{id}:
   *   delete:
   *     summary: Supprimer un remboursement
   *     tags: [Remboursements Prets]
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
   *         description: Remboursement supprime
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await remboursementPretService.delete(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const remboursementPretController = new RemboursementPretController();
