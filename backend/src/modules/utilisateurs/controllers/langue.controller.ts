/**
 * Controller Langue
 */

import { Request, Response, NextFunction } from 'express';
import { langueService } from '../services/langue.service';
import { CreateLangueDto, UpdateLangueDto } from '../dto/langue.dto';

export class LangueController {
  /**
   * POST /langues
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto: CreateLangueDto = req.body;
      const result = await langueService.create(dto);
      res.status(201).json({
        success: true,
        data: result,
        message: 'Langue créée avec succès',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /langues
   */
  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await langueService.findAll();
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /langues/default
   */
  async findDefault(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await langueService.findDefault();
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /langues/:id
   */
  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await langueService.findById(id);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /langues/:id
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const dto: UpdateLangueDto = req.body;
      const result = await langueService.update(id, dto);
      res.json({
        success: true,
        data: result,
        message: 'Langue mise à jour avec succès',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /langues/:id
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await langueService.delete(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const langueController = new LangueController();
