import { Request, Response, NextFunction } from 'express';
import { Repository } from 'typeorm';
import { AppDataSource } from '../../../config';
import { ApiResponse } from '../../../shared/utils/api-response.util';
import { NotFoundError } from '../../../shared';
import { Organisation } from '../../organisations/entities/organisation.entity';
import { PlanAbonnement } from '../../organisations/entities/plan-abonnement.entity';
import { organisationService } from '../../organisations/services/organisation.service';

export class AdminController {
  private get orgRepo(): Repository<Organisation> {
    return AppDataSource.getRepository(Organisation);
  }

  private get planRepo(): Repository<PlanAbonnement> {
    return AppDataSource.getRepository(PlanAbonnement);
  }

  // ─── Organisations ───────────────────────────────────────────────────────────

  async getAllOrganisations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const organisations = await organisationService.findAll();
      res.json(ApiResponse.success(organisations));
    } catch (err) {
      next(err);
    }
  }

  async getOrganisation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const org = await organisationService.findById(req.params.id);
      res.json(ApiResponse.success(org));
    } catch (err) {
      next(err);
    }
  }

  async createOrganisation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const org = await organisationService.create(req.body);
      res.status(201).json(ApiResponse.created(org, 'Organisation créée'));
    } catch (err) {
      next(err);
    }
  }

  async suspendOrganisation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const org = await organisationService.suspend(req.params.id);
      res.json(ApiResponse.success(org, 'Organisation suspendue'));
    } catch (err) {
      next(err);
    }
  }

  async reactivateOrganisation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const org = await organisationService.reactivate(req.params.id);
      res.json(ApiResponse.success(org, 'Organisation réactivée'));
    } catch (err) {
      next(err);
    }
  }

  // ─── Plans abonnement ────────────────────────────────────────────────────────

  async getAllPlans(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const plans = await this.planRepo.find({ order: { prixMensuel: 'ASC' } });
      res.json(ApiResponse.success(plans));
    } catch (err) {
      next(err);
    }
  }

  async updatePlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const plan = await this.planRepo.findOne({ where: { id: req.params.id } });
      if (!plan) throw new NotFoundError(`Plan introuvable: ${req.params.id}`);

      Object.assign(plan, req.body);
      const saved = await this.planRepo.save(plan);
      res.json(ApiResponse.success(saved, 'Plan mis à jour'));
    } catch (err) {
      next(err);
    }
  }
}

export const adminController = new AdminController();
