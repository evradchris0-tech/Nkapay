/**
 * Controller pour la gestion des transactions
 */

import { Request, Response, NextFunction } from 'express';
import { transactionService } from '../services/transaction.service';
import { TransactionFiltersDto } from '../dto/transaction.dto';
import { ApiResponse, PaginationQuery } from '../../../shared';

export class TransactionController {
  /**
   * @swagger
   * /transactions:
   *   post:
   *     summary: Creer une nouvelle transaction
   *     tags: [Transactions]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateTransactionDto'
   *     responses:
   *       201:
   *         description: Transaction creee
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const transaction = await transactionService.create(req.body);
      res.status(201).json(transaction);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /transactions/cotisation:
   *   post:
   *     summary: Creer une cotisation
   *     tags: [Transactions]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateCotisationDto'
   *     responses:
   *       201:
   *         description: Cotisation creee
   */
  async createCotisation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const transaction = await transactionService.createCotisation(req.body);
      res.status(201).json(transaction);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /transactions/pot:
   *   post:
   *     summary: Creer une contribution au pot
   *     tags: [Transactions]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreatePotDto'
   *     responses:
   *       201:
   *         description: Contribution au pot creee
   */
  async createPot(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const transaction = await transactionService.createPot(req.body);
      res.status(201).json(transaction);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /transactions/inscription:
   *   post:
   *     summary: Creer des frais d'inscription
   *     tags: [Transactions]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateInscriptionDto'
   *     responses:
   *       201:
   *         description: Frais d'inscription crees
   */
  async createInscription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const transaction = await transactionService.createInscription(req.body);
      res.status(201).json(transaction);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /transactions:
   *   get:
   *     summary: Lister les transactions
   *     tags: [Transactions]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: reunionId
   *         schema:
   *           type: string
   *       - in: query
   *         name: exerciceId
   *         schema:
   *           type: string
   *       - in: query
   *         name: exerciceMembreId
   *         schema:
   *           type: string
   *       - in: query
   *         name: typeTransaction
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
   *         description: Liste des transactions
   */
  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters: TransactionFiltersDto = {
        reunionId: req.query.reunionId as string,
        exerciceId: req.query.exerciceId as string,
        exerciceMembreId: req.query.exerciceMembreId as string,
        typeTransaction: req.query.typeTransaction as any,
        statut: req.query.statut as any,
        dateDebut: req.query.dateDebut as string,
        dateFin: req.query.dateFin as string,
      };

      const pagination: PaginationQuery = {
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'ASC' | 'DESC',
      };

      const result = await transactionService.findAll(filters, pagination);
      res.json(ApiResponse.paginated(result.data, result.meta));
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /transactions/summary:
   *   get:
   *     summary: Obtenir le resume des transactions
   *     tags: [Transactions]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Resume des transactions
   */
  async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters: TransactionFiltersDto = {
        reunionId: req.query.reunionId as string,
        exerciceId: req.query.exerciceId as string,
        exerciceMembreId: req.query.exerciceMembreId as string,
        typeTransaction: req.query.typeTransaction as any,
        statut: req.query.statut as any,
      };

      const summary = await transactionService.getSummary(filters);
      res.json(summary);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /transactions/{id}:
   *   get:
   *     summary: Obtenir une transaction par ID
   *     tags: [Transactions]
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
   *         description: Transaction trouvee
   */
  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const transaction = await transactionService.findById(req.params.id);
      res.json(transaction);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /transactions/reference/{reference}:
   *   get:
   *     summary: Obtenir une transaction par reference
   *     tags: [Transactions]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: reference
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Transaction trouvee
   */
  async findByReference(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const transaction = await transactionService.findByReference(req.params.reference);
      res.json(transaction);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /transactions/{id}:
   *   patch:
   *     summary: Mettre a jour une transaction
   *     tags: [Transactions]
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
   *             $ref: '#/components/schemas/UpdateTransactionDto'
   *     responses:
   *       200:
   *         description: Transaction mise a jour
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const transaction = await transactionService.update(req.params.id, req.body);
      res.json(transaction);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /transactions/{id}/soumettre:
   *   post:
   *     summary: Soumettre une transaction
   *     tags: [Transactions]
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
   *         description: Transaction soumise
   */
  async soumettre(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const transaction = await transactionService.soumettre(req.params.id);
      res.json(transaction);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /transactions/{id}/valider:
   *   post:
   *     summary: Valider une transaction
   *     tags: [Transactions]
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
   *             $ref: '#/components/schemas/ValiderTransactionDto'
   *     responses:
   *       200:
   *         description: Transaction validee
   */
  async valider(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const transaction = await transactionService.valider(req.params.id, req.body);
      res.json(transaction);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /transactions/{id}/rejeter:
   *   post:
   *     summary: Rejeter une transaction
   *     tags: [Transactions]
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
   *             $ref: '#/components/schemas/RejeterTransactionDto'
   *     responses:
   *       200:
   *         description: Transaction rejetee
   */
  async rejeter(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const transaction = await transactionService.rejeter(req.params.id, req.body);
      res.json(transaction);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /transactions/{id}/annuler:
   *   post:
   *     summary: Annuler une transaction
   *     tags: [Transactions]
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
   *         description: Transaction annulee
   */
  async annuler(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const transaction = await transactionService.annuler(req.params.id);
      res.json(transaction);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /transactions/{id}:
   *   delete:
   *     summary: Supprimer une transaction
   *     tags: [Transactions]
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
   *         description: Transaction supprimee
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await transactionService.delete(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const transactionController = new TransactionController();
