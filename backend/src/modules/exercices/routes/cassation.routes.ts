/**
 * Routes pour la gestion des cassations
 */

import { Router } from 'express';
import { cassationController } from '../controllers/cassation.controller';
import { authenticate } from '../../../shared';

const router = Router();

router.use(authenticate);

// Calculer les cassations pour un exercice
router.post('/exercice/:exerciceId/calculer', (req, res, next) => cassationController.calculer(req, res, next));

// Distribuer une cassation individuelle
router.patch('/:id/distribuer', (req, res, next) => cassationController.distribuer(req, res, next));

// Distribuer toutes les cassations d'un exercice
router.patch('/exercice/:exerciceId/distribuer-tout', (req, res, next) => cassationController.distribuerTout(req, res, next));

// Annuler une cassation
router.patch('/:id/annuler', (req, res, next) => cassationController.annuler(req, res, next));

// Lister les cassations d'un exercice
router.get('/exercice/:exerciceId', (req, res, next) => cassationController.findByExercice(req, res, next));

// Résumé des cassations d'un exercice
router.get('/exercice/:exerciceId/summary', (req, res, next) => cassationController.getSummary(req, res, next));

// Récupérer une cassation par ID
router.get('/:id', (req, res, next) => cassationController.findById(req, res, next));

// Réinitialiser les cassations d'un exercice
router.delete('/exercice/:exerciceId/reset', (req, res, next) => cassationController.resetExercice(req, res, next));

export const cassationRoutes = router;
