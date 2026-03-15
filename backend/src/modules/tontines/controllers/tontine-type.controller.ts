/**
 * Controleur pour la gestion des types de tontines
 */

import { Request, Response, NextFunction } from 'express';
import { tontineTypeService } from '../services/tontine-type.service';
import { ApiResponse } from '../../../shared';

export class TontineTypeController {
  /**
   * POST /types - Creer un nouveau type de tontine
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await tontineTypeService.create(req.body);
      res.status(201).json(ApiResponse.success(result, 'Type de tontine cree avec succes'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /types - Lister tous les types de tontines
   */
  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actifOnly = req.query.actifOnly === 'true';
      const result = await tontineTypeService.findAll(actifOnly);
      res.json(ApiResponse.success(result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /types/:id - Trouver un type par ID
   */
  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await tontineTypeService.findById(req.params.id);
      res.json(ApiResponse.success(result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /types/code/:code - Trouver un type par code
   */
  async findByCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await tontineTypeService.findByCode(req.params.code);
      res.json(ApiResponse.success(result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /types/:id - Mettre a jour un type
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await tontineTypeService.update(req.params.id, req.body);
      res.json(ApiResponse.success(result, 'Type de tontine mis a jour'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /types/:id - Desactiver un type
   */
  async deactivate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await tontineTypeService.deactivate(req.params.id);
      res.json(ApiResponse.success(result, 'Type de tontine desactive'));
    } catch (error) {
      next(error);
    }
  }
}

export const tontineTypeController = new TontineTypeController();
