/**
 * Contrôleur pour le Dashboard Membre
 */

import { Request, Response, NextFunction } from 'express';
import { memberDashboardService } from '../services/member-dashboard.service';

export class MemberDashboardController {
  /**
   * Récupérer le dashboard complet d'un membre
   */
  async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { exerciceMembreId } = req.params;
      const dashboard = await memberDashboardService.getMemberStats(exerciceMembreId);
      res.json(dashboard);
    } catch (error) {
      next(error);
    }
  }
}

export const memberDashboardController = new MemberDashboardController();
