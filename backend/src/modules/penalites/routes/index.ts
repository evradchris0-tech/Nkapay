/**
 * Index des routes du module Penalites
 */

import { Router } from 'express';
import { typePenaliteRoutes } from './type-penalite.routes';
import { penaliteRoutes } from './penalite.routes';

const router = Router();

// Routes pour les types de penalite
router.use('/types-penalites', typePenaliteRoutes);

// Routes pour les penalites
router.use('/penalites', penaliteRoutes);

export const penaliteModuleRoutes = router;
