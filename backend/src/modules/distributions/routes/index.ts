/**
 * Index des routes du module Distributions
 */

import { Router } from 'express';
import distributionRoutes from './distribution.routes';

const router = Router();

router.use('/distributions', distributionRoutes);

export default router;
export { router as distributionModuleRoutes };
