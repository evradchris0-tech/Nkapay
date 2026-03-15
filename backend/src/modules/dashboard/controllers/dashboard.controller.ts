import { Request, Response, NextFunction } from 'express';
import { dashboardService } from '../services/dashboard.service';

export class DashboardController {
  async getStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await dashboardService.getStats();
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }

  async getRecentActivities(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const activities = await dashboardService.getRecentActivities();
      res.json(activities);
    } catch (error) {
      next(error);
    }
  }
}

export const dashboardController = new DashboardController();
