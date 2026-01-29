/**
 * Index des routes du module Secours
 */

import { Router } from 'express';
import { typeEvenementSecoursRoutes } from './type-evenement-secours.routes';
import { evenementSecoursRoutes } from './evenement-secours.routes';
import { bilanSecoursRoutes } from './bilan-secours.routes';

const router = Router();

// Routes pour les types d'evenement de secours
router.use('/types-evenements-secours', typeEvenementSecoursRoutes);

// Routes pour les evenements de secours
router.use('/evenements-secours', evenementSecoursRoutes);

// Routes pour les bilans et secours dus
router.use('/secours', bilanSecoursRoutes);

export const secoursModuleRoutes = router;
