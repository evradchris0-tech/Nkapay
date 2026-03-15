/**
 * Routes pour les règles au niveau tontine
 */

import { Router } from 'express';
import { regleTontineController } from '../controllers/regle-tontine.controller';
import { authenticate } from '../../../shared';

const router = Router();

router.use(authenticate);

// CRUD et opérations
router.post('/', (req, res, next) => regleTontineController.upsert(req, res, next));
router.get('/tontine/:tontineId', (req, res, next) => regleTontineController.findByTontine(req, res, next));
router.get('/tontine/:tontineId/effectives', (req, res, next) => regleTontineController.getEffectiveRules(req, res, next));
router.get('/tontine/:tontineId/valeur/:cle', (req, res, next) => regleTontineController.getValueByCle(req, res, next));
router.post('/tontine/:tontineId/initialize', (req, res, next) => regleTontineController.initializeDefaultRules(req, res, next));
router.get('/:id', (req, res, next) => regleTontineController.findById(req, res, next));
router.put('/:id', (req, res, next) => regleTontineController.update(req, res, next));
router.delete('/:id', (req, res, next) => regleTontineController.delete(req, res, next));

export const regleTontineRoutes = router;
