/**
 * Routes pour les prets
 */

import { Router } from 'express';
import { pretController } from '../controllers/pret.controller';
import { authenticate } from '../../../shared';

const router = Router();

// Routes specifiques en premier
router.get('/summary', authenticate, (req, res, next) => pretController.getSummary(req, res, next));

// Routes CRUD
router.post('/', authenticate, (req, res, next) => pretController.create(req, res, next));
router.get('/', authenticate, (req, res, next) => pretController.findAll(req, res, next));
router.get('/:id', authenticate, (req, res, next) => pretController.findById(req, res, next));

// Actions sur les prets
router.post('/:id/approuver', authenticate, (req, res, next) =>
  pretController.approuver(req, res, next)
);
router.post('/:id/refuser', authenticate, (req, res, next) =>
  pretController.refuser(req, res, next)
);
router.post('/:id/decaisser', authenticate, (req, res, next) =>
  pretController.decaisser(req, res, next)
);
router.post('/:id/solder', authenticate, (req, res, next) => pretController.solder(req, res, next));
router.post('/:id/defaut', authenticate, (req, res, next) =>
  pretController.mettreEnDefaut(req, res, next)
);

export default router;
