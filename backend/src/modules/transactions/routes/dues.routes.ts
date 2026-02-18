/**
 * Routes pour les dues (cotisations, pots, inscriptions)
 */

import { Router } from 'express';
import { duesController } from '../controllers/dues.controller';
import { authenticate } from '../../../shared';

const router = Router();

router.use(authenticate);

// === COTISATIONS DUES ===
router.post('/cotisations/reunion/:reunionId/generer', (req, res, next) => duesController.genererCotisations(req, res, next));
router.post('/cotisations/:id/payer', (req, res, next) => duesController.payerCotisation(req, res, next));
router.get('/cotisations/reunion/:reunionId', (req, res, next) => duesController.findCotisationsByReunion(req, res, next));
router.get('/cotisations/reunion/:reunionId/stats', (req, res, next) => duesController.getCotisationStats(req, res, next));

// === POTS DUS ===
router.post('/pots/reunion/:reunionId/generer', (req, res, next) => duesController.genererPots(req, res, next));
router.post('/pots/:id/payer', (req, res, next) => duesController.payerPot(req, res, next));
router.get('/pots/reunion/:reunionId', (req, res, next) => duesController.findPotsByReunion(req, res, next));
router.get('/pots/reunion/:reunionId/stats', (req, res, next) => duesController.getPotStats(req, res, next));
router.get('/pots/reunion/:reunionId/total', (req, res, next) => duesController.getPotTotal(req, res, next));

// === INSCRIPTIONS DUES ===
router.post('/inscriptions/exercice/:exerciceId/generer', (req, res, next) => duesController.genererInscriptions(req, res, next));
router.post('/inscriptions/:id/payer', (req, res, next) => duesController.payerInscription(req, res, next));
router.get('/inscriptions/exercice/:exerciceId', (req, res, next) => duesController.findInscriptionsByExercice(req, res, next));
router.get('/inscriptions/exercice/:exerciceId/stats', (req, res, next) => duesController.getInscriptionStats(req, res, next));
router.get('/inscriptions/en-retard', (req, res, next) => duesController.findInscriptionsEnRetard(req, res, next));

// === EPARGNES DUES ===
router.post('/epargnes/reunion/:reunionId/generer', (req, res, next) => duesController.genererEpargnes(req, res, next));
router.post('/epargnes/:id/payer', (req, res, next) => duesController.payerEpargne(req, res, next));
router.get('/epargnes/reunion/:reunionId', (req, res, next) => duesController.findEpargnesByReunion(req, res, next));
router.get('/epargnes/reunion/:reunionId/stats', (req, res, next) => duesController.getEpargneStats(req, res, next));

export const duesRoutes = router;
