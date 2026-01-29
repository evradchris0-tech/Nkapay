/**
 * Controller pour la gestion des demandes d'adhesion
 */

import { Request, Response, NextFunction } from 'express';
import { demandeAdhesionService } from '../services/demande-adhesion.service';
import { DemandeAdhesionFiltersDto } from '../dto/demande-adhesion.dto';

export class DemandeAdhesionController {
  /**
   * @swagger
   * /demandes-adhesion:
   *   post:
   *     summary: Creer une demande d'adhesion
   *     tags: [Demandes Adhesion]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateDemandeAdhesionDto'
   *     responses:
   *       201:
   *         description: Demande creee
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const demande = await demandeAdhesionService.create(req.body);
      res.status(201).json(demande);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /demandes-adhesion:
   *   get:
   *     summary: Lister les demandes d'adhesion
   *     tags: [Demandes Adhesion]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: tontineId
   *         schema:
   *           type: string
   *       - in: query
   *         name: utilisateurId
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
   *         description: Liste des demandes
   */
  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters: DemandeAdhesionFiltersDto = {
        tontineId: req.query.tontineId as string,
        utilisateurId: req.query.utilisateurId as string,
        statut: req.query.statut as any,
        dateDebut: req.query.dateDebut as string,
        dateFin: req.query.dateFin as string,
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      };
      const result = await demandeAdhesionService.findAll(filters);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /demandes-adhesion/summary:
   *   get:
   *     summary: Obtenir le resume des demandes
   *     tags: [Demandes Adhesion]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Resume des demandes
   */
  async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters: DemandeAdhesionFiltersDto = {
        tontineId: req.query.tontineId as string,
        utilisateurId: req.query.utilisateurId as string,
        statut: req.query.statut as any,
      };
      const summary = await demandeAdhesionService.getSummary(filters);
      res.json(summary);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /demandes-adhesion/{id}:
   *   get:
   *     summary: Obtenir une demande par ID
   *     tags: [Demandes Adhesion]
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
   *         description: Demande trouvee
   */
  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const demande = await demandeAdhesionService.findById(req.params.id);
      res.json(demande);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /demandes-adhesion/{id}/en-cours:
   *   post:
   *     summary: Mettre une demande en cours de traitement
   *     tags: [Demandes Adhesion]
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
   *         description: Demande mise en cours
   */
  async mettreEnCours(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const demande = await demandeAdhesionService.mettreEnCours(req.params.id);
      res.json(demande);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /demandes-adhesion/{id}/approuver:
   *   post:
   *     summary: Approuver une demande
   *     tags: [Demandes Adhesion]
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
   *             $ref: '#/components/schemas/ApprouverDemandeDto'
   *     responses:
   *       200:
   *         description: Demande approuvee
   */
  async approuver(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const demande = await demandeAdhesionService.approuver(req.params.id, req.body);
      res.json(demande);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /demandes-adhesion/{id}/refuser:
   *   post:
   *     summary: Refuser une demande
   *     tags: [Demandes Adhesion]
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
   *             $ref: '#/components/schemas/RefuserDemandeDto'
   *     responses:
   *       200:
   *         description: Demande refusee
   */
  async refuser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const demande = await demandeAdhesionService.refuser(req.params.id, req.body);
      res.json(demande);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /demandes-adhesion/{id}:
   *   delete:
   *     summary: Supprimer une demande
   *     tags: [Demandes Adhesion]
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
   *         description: Demande supprimee
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await demandeAdhesionService.delete(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const demandeAdhesionController = new DemandeAdhesionController();
