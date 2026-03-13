/**
 * Contrôleur pour la gestion des événements de secours
 *
 * Endpoints:
 * POST   /                        — Déclarer un événement
 * GET    /                        — Lister les événements
 * GET    /summary                 — Résumé statistique
 * GET    /fonds/:exerciceId       — Solde du fonds
 * GET    /renflouement/:exerciceId — Calcul de renflouement
 * GET    /:id                     — Détail d'un événement
 * POST   /:id/soumettre           — Soumettre pour validation
 * POST   /:id/valider             — Valider
 * POST   /:id/refuser             — Refuser
 * POST   /:id/payer               — Payer (lien transaction manuelle)
 * POST   /:id/decaisser           — Décaisser (workflow automatique)
 * POST   /:id/pieces              — Ajouter pièce justificative
 * GET    /:id/pieces              — Lister pièces justificatives
 * DELETE /:id/pieces/:pieceId     — Supprimer pièce justificative
 */

import { Request, Response, NextFunction } from 'express';
import { evenementSecoursService } from '../services/evenement-secours.service';
import { ApiResponse } from '../../../shared';

export class EvenementSecoursController {
  /**
   * Déclarer un événement de secours
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await evenementSecoursService.create(req.body);
      res.status(201).json(ApiResponse.success(result, 'Événement de secours déclaré avec succès'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Soumettre un événement pour validation
   */
  async soumettre(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await evenementSecoursService.soumettre(req.params.id);
      res.json(ApiResponse.success(result, 'Événement soumis pour validation'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Valider un événement de secours
   */
  async valider(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await evenementSecoursService.valider(req.params.id, req.body);
      res.json(ApiResponse.success(result, 'Événement validé avec succès'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refuser un événement de secours
   */
  async refuser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await evenementSecoursService.refuser(req.params.id, req.body);
      res.json(ApiResponse.success(result, 'Événement refusé'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Payer un événement de secours (lien vers transaction existante)
   */
  async payer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await evenementSecoursService.payer(req.params.id, req.body);
      res.json(ApiResponse.success(result, 'Événement marqué comme payé'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Décaisser un événement de secours (workflow automatisé)
   * Crée la transaction + met à jour le bilan + calcule le renflouement
   */
  async decaisser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await evenementSecoursService.decaisser(req.params.id, req.body);
      res.json(ApiResponse.success(result, 'Décaissement effectué avec succès'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lister les événements de secours
   */
  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pagination = {
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'ASC' | 'DESC',
      };
      const filters = { ...req.query } as any;
      delete filters.page;
      delete filters.limit;
      delete filters.sortBy;
      delete filters.sortOrder;

      const result = await evenementSecoursService.findAll(filters, pagination);
      res.json(ApiResponse.paginated(result.data, result.meta));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir un événement de secours par ID
   */
  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await evenementSecoursService.findById(req.params.id);
      res.json(ApiResponse.success(result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir le résumé des secours
   */
  async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await evenementSecoursService.getSummary(req.query as any);
      res.json(ApiResponse.success(result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir le solde du fonds de secours
   */
  async getSoldeFonds(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await evenementSecoursService.getSoldeFonds(req.params.exerciceId);
      res.json(ApiResponse.success(result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Calculer le renflouement nécessaire
   */
  async calculerRenflouement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const montantCible = req.query.montantCible ? Number(req.query.montantCible) : undefined;
      const result = await evenementSecoursService.calculerRenflouement(
        req.params.exerciceId,
        montantCible
      );
      res.json(ApiResponse.success(result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Ajouter une pièce justificative
   */
  async ajouterPiece(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await evenementSecoursService.ajouterPieceJustificative(
        req.params.id,
        req.body
      );
      res.status(201).json(ApiResponse.success(result, 'Pièce justificative ajoutée'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lister les pièces justificatives d'un événement
   */
  async getPieces(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await evenementSecoursService.getPiecesJustificatives(req.params.id);
      res.json(ApiResponse.success(result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Supprimer une pièce justificative
   */
  async supprimerPiece(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await evenementSecoursService.supprimerPieceJustificative(req.params.pieceId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const evenementSecoursController = new EvenementSecoursController();
