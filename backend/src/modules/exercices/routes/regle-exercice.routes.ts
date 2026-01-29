/**
 * Routes pour les règles au niveau exercice
 */

import { Router } from 'express';
import { regleExerciceController } from '../controllers/regle-exercice.controller';
import { authenticate } from '../../../shared';

const router = Router();

router.use(authenticate);

// CRUD et opérations
router.post('/', (req, res, next) => regleExerciceController.upsert(req, res, next));
router.get('/exercice/:exerciceId', (req, res, next) => regleExerciceController.findByExercice(req, res, next));
router.get('/exercice/:exerciceId/effectives', (req, res, next) => regleExerciceController.getEffectiveRules(req, res, next));
router.get('/exercice/:exerciceId/valeur/:cle', (req, res, next) => regleExerciceController.getEffectiveValueByCle(req, res, next));
router.post('/exercice/:exerciceId/initialize', (req, res, next) => regleExerciceController.initializeFromTontine(req, res, next));
router.get('/:id', (req, res, next) => regleExerciceController.findById(req, res, next));
router.put('/:id', (req, res, next) => regleExerciceController.update(req, res, next));
router.delete('/:id', (req, res, next) => regleExerciceController.delete(req, res, next));

export const regleExerciceRoutes = router;
