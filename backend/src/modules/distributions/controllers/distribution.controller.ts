/**
 * Controller pour la gestion des distributions
 */

import { Request, Response, NextFunction } from 'express';
import { distributionService } from '../services/distribution.service';
import { DistributionFiltersDto } from '../dto/distribution.dto';
import { ApiResponse, PaginationQuery } from '../../../shared';

export class DistributionController {
  /**
   * @swagger
   * /distributions:
   *   post:
   *     summary: Creer une distribution
   *     tags: [Distributions]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateDistributionDto'
   *     responses:
   *       201:
   *         description: Distribution creee
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const distribution = await distributionService.create(req.body);
      res.status(201).json(distribution);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /distributions:
   *   get:
   *     summary: Lister les distributions
   *     tags: [Distributions]
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
   *         name: statut
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Liste des distributions
   */
  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters: DistributionFiltersDto = {
        reunionId: req.query.reunionId as string | undefined,
        exerciceId: req.query.exerciceId as string | undefined,
        exerciceMembreId: req.query.exerciceMembreId as string | undefined,
        statut: req.query.statut as any,
        dateDebut: req.query.dateDebut as string | undefined,
        dateFin: req.query.dateFin as string | undefined,
        montantMin: req.query.montantMin ? parseFloat(req.query.montantMin as string) : undefined,
        montantMax: req.query.montantMax ? parseFloat(req.query.montantMax as string) : undefined,
      };
      const pagination: PaginationQuery = {
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        sortBy: req.query.sortBy as string | undefined,
        sortOrder: req.query.sortOrder as 'ASC' | 'DESC' | undefined,
      };
      const result = await distributionService.findAll(filters, pagination);
      res.json(ApiResponse.paginated(result.data, result.meta));
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /distributions/summary:
   *   get:
   *     summary: Obtenir le resume des distributions
   *     tags: [Distributions]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Resume des distributions
   */
  async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters: DistributionFiltersDto = {
        reunionId: req.query.reunionId as string,
        exerciceId: req.query.exerciceId as string,
        exerciceMembreId: req.query.exerciceMembreId as string,
        statut: req.query.statut as any,
      };
      const summary = await distributionService.getSummary(filters);
      res.json(summary);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /distributions/reunion/{reunionId}:
   *   get:
   *     summary: Obtenir les distributions d'une reunion
   *     tags: [Distributions]
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
   *         description: Liste des distributions
   */
  async findByReunion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const distributions = await distributionService.findByReunion(req.params.reunionId);
      res.json(distributions);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /distributions/{id}:
   *   get:
   *     summary: Obtenir une distribution par ID
   *     tags: [Distributions]
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
   *         description: Distribution trouvee
   */
  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const distribution = await distributionService.findById(req.params.id);
      res.json(distribution);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /distributions/{id}:
   *   patch:
   *     summary: Mettre a jour une distribution
   *     tags: [Distributions]
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
   *             $ref: '#/components/schemas/UpdateDistributionDto'
   *     responses:
   *       200:
   *         description: Distribution mise a jour
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const distribution = await distributionService.update(req.params.id, req.body);
      res.json(distribution);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /distributions/{id}/distribuer:
   *   post:
   *     summary: Effectuer une distribution
   *     tags: [Distributions]
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
   *             $ref: '#/components/schemas/DistribuerDto'
   *     responses:
   *       200:
   *         description: Distribution effectuee
   */
  async distribuer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const distribution = await distributionService.distribuer(req.params.id, req.body || {});
      res.json(distribution);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /distributions/{id}/annuler:
   *   post:
   *     summary: Annuler une distribution
   *     tags: [Distributions]
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
   *         description: Distribution annulee
   */
  async annuler(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const distribution = await distributionService.annuler(req.params.id);
      res.json(distribution);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /distributions/{id}:
   *   delete:
   *     summary: Supprimer une distribution
   *     tags: [Distributions]
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
   *         description: Distribution supprimee
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await distributionService.delete(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const distributionController = new DistributionController();
