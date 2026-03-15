/**
 * Controleur pour la gestion des adhesions aux tontines
 */

import { Request, Response, NextFunction } from 'express';
import { adhesionTontineService } from '../services/adhesion-tontine.service';
import { ApiResponse } from '../../../shared';
import { RoleMembre, StatutAdhesion } from '../entities/adhesion-tontine.entity';

export class AdhesionTontineController {
  /**
   * POST / - Creer une nouvelle adhesion
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await adhesionTontineService.create(req.body);
      res.status(201).json(ApiResponse.success(result, 'Adhesion creee avec succes'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /tontine/:tontineId - Lister les membres d'une tontine
   */
  async findByTontine(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = {
        role: req.query.role as RoleMembre | undefined,
        statut: req.query.statut as StatutAdhesion | undefined,
      };
      const result = await adhesionTontineService.findByTontine(req.params.tontineId, filters);
      res.json(ApiResponse.success(result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /user/:utilisateurId - Lister les adhesions d'un utilisateur
   */
  async findByUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await adhesionTontineService.findByUser(req.params.utilisateurId);
      res.json(ApiResponse.success(result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /:id - Trouver une adhesion par ID
   */
  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await adhesionTontineService.findById(req.params.id);
      res.json(ApiResponse.success(result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /:id - Mettre a jour une adhesion
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await adhesionTontineService.update(req.params.id, req.body);
      res.json(ApiResponse.success(result, 'Adhesion mise a jour'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /:id/deactivate - Desactiver une adhesion
   */
  async deactivate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await adhesionTontineService.deactivate(req.params.id);
      res.json(ApiResponse.success(result, 'Adhesion desactivee'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /:id/reactivate - Reactiver une adhesion
   */
  async reactivate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await adhesionTontineService.reactivate(req.params.id);
      res.json(ApiResponse.success(result, 'Adhesion reactivee'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /:id/role - Changer le role d'un membre
   */
  async changeRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { role } = req.body;
      const result = await adhesionTontineService.changeRole(req.params.id, role);
      res.json(ApiResponse.success(result, 'Role mis a jour'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /:id - Supprimer une adhesion
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await adhesionTontineService.delete(req.params.id);
      res.json(ApiResponse.success(null, 'Adhesion supprimee'));
    } catch (error) {
      next(error);
    }
  }
}

export const adhesionTontineController = new AdhesionTontineController();
