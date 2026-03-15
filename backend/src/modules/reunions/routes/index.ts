/**
 * Index des routes du module Reunions
 */

import { Router } from 'express';
import { reunionRoutes } from './reunion.routes';
import { presenceReunionRoutes } from './presence-reunion.routes';

const router = Router();

// Routes pour les reunions
router.use('/reunions', reunionRoutes);

// Routes pour les presences
router.use('/presences', presenceReunionRoutes);

export const reunionModuleRoutes = router;
