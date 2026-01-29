/**
 * Routes pour les bilans de secours et secours dus annuels
 */

import { Router } from 'express';
import { bilanSecoursController } from '../controllers/bilan-secours.controller';
import { authenticate } from '../../../shared';

const router = Router();

router.use(authenticate);

// === BILANS SECOURS ===
router.get('/bilans', (req, res, next) => bilanSecoursController.findAllBilans(req, res, next));
router.get('/bilans/exercice/:exerciceId', (req, res, next) => bilanSecoursController.getOrCreateBilan(req, res, next));
router.get('/bilans/:id', (req, res, next) => bilanSecoursController.findBilanById(req, res, next));
router.put('/bilans/exercice/:exerciceId/solde-initial', (req, res, next) => bilanSecoursController.updateSoldeInitial(req, res, next));
router.post('/bilans/exercice/:exerciceId/recalculer', (req, res, next) => bilanSecoursController.recalculerBilan(req, res, next));
router.post('/bilans/exercice/:exerciceId/cloturer', (req, res, next) => bilanSecoursController.cloturerBilan(req, res, next));

// === SECOURS DUS ANNUELS ===
router.post('/dus/exercice/:exerciceId/generer', (req, res, next) => bilanSecoursController.genererSecoursDus(req, res, next));
router.post('/dus/:id/payer', (req, res, next) => bilanSecoursController.payerSecours(req, res, next));
router.get('/dus/exercice/:exerciceId', (req, res, next) => bilanSecoursController.findSecoursByExercice(req, res, next));
router.get('/dus/exercice/:exerciceId/stats', (req, res, next) => bilanSecoursController.getSecoursStats(req, res, next));
router.get('/dus/en-retard', (req, res, next) => bilanSecoursController.findSecoursEnRetard(req, res, next));
router.get('/dus/:id', (req, res, next) => bilanSecoursController.findSecoursById(req, res, next));

export const bilanSecoursRoutes = router;
