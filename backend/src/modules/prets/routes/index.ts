/**
 * Index des routes du module Prets
 */

import { Router } from 'express';
import pretRoutes from './pret.routes';
import remboursementPretRoutes from './remboursement-pret.routes';

const router = Router();

router.use('/prets', pretRoutes);
router.use('/remboursements-prets', remboursementPretRoutes);

export default router;
export { router as pretModuleRoutes };
