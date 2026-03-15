/**
 * Index des routes du module Adhesions
 */

import { Router } from 'express';
import demandeAdhesionRoutes from './demande-adhesion.routes';

const router = Router();

router.use('/demandes-adhesion', demandeAdhesionRoutes);

export default router;
export { router as adhesionModuleRoutes };
