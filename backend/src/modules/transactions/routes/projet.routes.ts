/**
 * Routes pour les projets
 */

import { Router } from 'express';
import { projetController } from '../controllers/projet.controller';
import { authenticate } from '../../../shared';

const router = Router();

router.use(authenticate);

// CRUD et opérations
router.post('/', (req, res, next) => projetController.create(req, res, next));
router.get('/', (req, res, next) => projetController.findAll(req, res, next));
router.get('/exercice/:exerciceId', (req, res, next) => projetController.findByExercice(req, res, next));
router.get('/exercice/:exerciceId/stats', (req, res, next) => projetController.getStatsByExercice(req, res, next));
router.get('/:id', (req, res, next) => projetController.findById(req, res, next));
router.put('/:id', (req, res, next) => projetController.update(req, res, next));
router.post('/:id/cloturer', (req, res, next) => projetController.cloturer(req, res, next));
router.post('/:id/annuler', (req, res, next) => projetController.annuler(req, res, next));
router.delete('/:id', (req, res, next) => projetController.delete(req, res, next));

export const projetRoutes = router;
