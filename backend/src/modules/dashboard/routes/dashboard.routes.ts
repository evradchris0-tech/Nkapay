import { Router } from 'express';
import { authenticate } from '../../../shared';
import { dashboardController } from '../controllers/dashboard.controller';
import { memberDashboardController } from '../controllers/member-dashboard.controller';

const router = Router();

router.get('/stats', authenticate, (req, res, next) =>
  dashboardController.getStats(req, res, next)
);
router.get('/activities', authenticate, (req, res, next) =>
  dashboardController.getRecentActivities(req, res, next)
);

// Dashboard Membre
router.get('/member/:exerciceMembreId', authenticate, (req, res, next) =>
  memberDashboardController.getDashboard(req, res, next)
);

export default router;
