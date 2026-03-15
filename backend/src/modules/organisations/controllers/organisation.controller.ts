import { Request, Response, NextFunction } from 'express';
import { organisationService } from '../services/organisation.service';
import { regleOrganisationService } from '../services/regle-organisation.service';
import { ApiResponse } from '../../../shared/utils/api-response.util';
import { RoleOrganisation } from '../entities/membre-organisation.entity';

export class OrganisationController {
  // ─── Profil organisation ────────────────────────────────────────────────────

  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organisationId!;
      const org = await organisationService.findById(orgId);
      res.json(ApiResponse.success(org));
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organisationId!;
      const org = await organisationService.update(orgId, req.body);
      res.json(ApiResponse.success(org, 'Organisation mise à jour'));
    } catch (err) {
      next(err);
    }
  }

  // ─── Membres ────────────────────────────────────────────────────────────────

  async getMembres(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organisationId!;
      const membres = await organisationService.getMembres(orgId);
      res.json(ApiResponse.success(membres));
    } catch (err) {
      next(err);
    }
  }

  async addMembre(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organisationId!;
      const { utilisateurId, role } = req.body;
      const membre = await organisationService.addMembre(
        orgId,
        utilisateurId,
        role as RoleOrganisation,
        req.user!.id
      );
      res.status(201).json(ApiResponse.created(membre, 'Membre ajouté'));
    } catch (err) {
      next(err);
    }
  }

  // ─── Règles organisation ────────────────────────────────────────────────────

  async getRegles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organisationId!;
      const regles = await regleOrganisationService.findByOrganisation(orgId);
      res.json(ApiResponse.success(regles));
    } catch (err) {
      next(err);
    }
  }

  async setRegle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organisationId!;
      const regle = await regleOrganisationService.set(orgId, req.body);
      res.json(ApiResponse.success(regle, 'Règle mise à jour'));
    } catch (err) {
      next(err);
    }
  }

  async resetRegle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organisationId!;
      const { ruleDefinitionId } = req.params;
      await regleOrganisationService.reset(orgId, ruleDefinitionId);
      res.json(ApiResponse.success(null, 'Règle réinitialisée au défaut global'));
    } catch (err) {
      next(err);
    }
  }

  // ─── Abonnement ─────────────────────────────────────────────────────────────

  async getAbonnement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organisationId!;
      const org = await organisationService.findWithPlan(orgId);
      res.json(ApiResponse.success({
        planCode: org.planAbonnement?.code,
        planLibelle: org.planAbonnement?.libelle,
        prixMensuel: org.planAbonnement?.prixMensuel,
        fonctionnalites: org.planAbonnement?.fonctionnalites,
        abonnementDebutLe: org.abonnementDebutLe,
        abonnementFinLe: org.abonnementFinLe,
      }));
    } catch (err) {
      next(err);
    }
  }
}

export const organisationController = new OrganisationController();
