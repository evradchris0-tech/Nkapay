import { Router } from 'express';
import dashboardRoutes from './dashboard.routes';

const router = Router();

router.use('/', dashboardRoutes);

export default router;
export { router as dashboardRoutes };
