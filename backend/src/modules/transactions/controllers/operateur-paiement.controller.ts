/**
 * Controller pour la gestion des operateurs de paiement
 */

import { Request, Response, NextFunction } from 'express';
import { operateurPaiementService } from '../services/operateur-paiement.service';

export class OperateurPaiementController {
  /**
   * @swagger
   * /operateurs-paiement:
   *   post:
   *     summary: Creer un operateur de paiement
   *     tags: [Operateurs de paiement]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateOperateurPaiementDto'
   *     responses:
   *       201:
   *         description: Operateur cree
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const operateur = await operateurPaiementService.create(req.body);
      res.status(201).json(operateur);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /operateurs-paiement:
   *   get:
   *     summary: Lister les operateurs de paiement
   *     tags: [Operateurs de paiement]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: actifSeulement
   *         schema:
   *           type: boolean
   *     responses:
   *       200:
   *         description: Liste des operateurs
   */
  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actifSeulement = req.query.actifSeulement === 'true';
      const operateurs = await operateurPaiementService.findAll(actifSeulement);
      res.json(operateurs);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /operateurs-paiement/{id}:
   *   get:
   *     summary: Obtenir un operateur par ID
   *     tags: [Operateurs de paiement]
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
   *         description: Operateur trouve
   */
  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const operateur = await operateurPaiementService.findById(req.params.id);
      res.json(operateur);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /operateurs-paiement/code/{code}:
   *   get:
   *     summary: Obtenir un operateur par code
   *     tags: [Operateurs de paiement]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: code
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Operateur trouve
   */
  async findByCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const operateur = await operateurPaiementService.findByCode(req.params.code);
      res.json(operateur);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /operateurs-paiement/{id}:
   *   patch:
   *     summary: Mettre a jour un operateur
   *     tags: [Operateurs de paiement]
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
   *             $ref: '#/components/schemas/UpdateOperateurPaiementDto'
   *     responses:
   *       200:
   *         description: Operateur mis a jour
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const operateur = await operateurPaiementService.update(req.params.id, req.body);
      res.json(operateur);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /operateurs-paiement/{id}:
   *   delete:
   *     summary: Supprimer un operateur
   *     tags: [Operateurs de paiement]
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
   *         description: Operateur supprime
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await operateurPaiementService.delete(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const operateurPaiementController = new OperateurPaiementController();
