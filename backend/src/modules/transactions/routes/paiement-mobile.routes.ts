/**
 * Routes pour les paiements mobiles
 */

import { Router } from 'express';
import { paiementMobileController } from '../controllers/paiement-mobile.controller';
import { authenticate } from '../../../shared';

const router = Router();

router.use(authenticate);

// CRUD et opérations
router.post('/', (req, res, next) => paiementMobileController.initier(req, res, next));
router.get('/', (req, res, next) => paiementMobileController.findAll(req, res, next));
router.get('/pending', (req, res, next) => paiementMobileController.findPending(req, res, next));
router.get('/stats', (req, res, next) => paiementMobileController.getStats(req, res, next));
router.get('/transaction/:transactionId', (req, res, next) =>
  paiementMobileController.findByTransaction(req, res, next)
);
router.get('/:id', (req, res, next) => paiementMobileController.findById(req, res, next));
router.post('/:id/envoyer', (req, res, next) =>
  paiementMobileController.marquerEnvoye(req, res, next)
);
router.post('/:id/confirmer', (req, res, next) =>
  paiementMobileController.confirmer(req, res, next)
);
router.post('/:id/echouer', (req, res, next) =>
  paiementMobileController.marquerEchoue(req, res, next)
);
router.post('/:id/annuler', (req, res, next) => paiementMobileController.annuler(req, res, next));

export const paiementMobileRoutes = router;
