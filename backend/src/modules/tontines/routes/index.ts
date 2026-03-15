/**
 * Routes du module Tontines
 */

import { Router } from 'express';
import tontineTypeRoutes from './tontine-type.routes';
import tontineRoutes from './tontine.routes';
import adhesionRoutes from './adhesion-tontine.routes';
import { ruleDefinitionRoutes } from './rule-definition.routes';
import { regleTontineRoutes } from './regle-tontine.routes';

const router = Router();

// Sous-routes
router.use('/types', tontineTypeRoutes);
router.use('/adhesions', adhesionRoutes);
router.use('/rule-definitions', ruleDefinitionRoutes);
router.use('/regles-tontine', regleTontineRoutes);
router.use('/', tontineRoutes);

export { router as tontineModuleRoutes };
export default router;
