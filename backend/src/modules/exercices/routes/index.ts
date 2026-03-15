/**
 * Index des routes du module Exercices
 */

import { Router } from 'express';
import { exerciceRoutes } from './exercice.routes';
import { exerciceMembreRoutes } from './exercice-membre.routes';
import { regleExerciceRoutes } from './regle-exercice.routes';
import { cassationRoutes } from './cassation.routes';

const router = Router();

// Routes pour les exercices
router.use('/exercices', exerciceRoutes);

// Routes pour les membres d'exercice
router.use('/exercices-membres', exerciceMembreRoutes);

// Routes pour les règles d'exercice
router.use('/regles-exercice', regleExerciceRoutes);

// Routes pour les cassations
router.use('/cassations', cassationRoutes);

export const exerciceModuleRoutes = router;

