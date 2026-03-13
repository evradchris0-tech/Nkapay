/**
 * Routes pour les operateurs de paiement
 */

import { Router } from 'express';
import { operateurPaiementController } from '../controllers/operateur-paiement.controller';
import { authenticate } from '../../../shared';

const router = Router();

// Routes specifiques en premier
router.get('/code/:code', authenticate, (req, res, next) =>
  operateurPaiementController.findByCode(req, res, next)
);

// Routes CRUD
router.post('/', authenticate, (req, res, next) =>
  operateurPaiementController.create(req, res, next)
);
router.get('/', authenticate, (req, res, next) =>
  operateurPaiementController.findAll(req, res, next)
);
router.get('/:id', authenticate, (req, res, next) =>
  operateurPaiementController.findById(req, res, next)
);
router.patch('/:id', authenticate, (req, res, next) =>
  operateurPaiementController.update(req, res, next)
);
router.delete('/:id', authenticate, (req, res, next) =>
  operateurPaiementController.delete(req, res, next)
);

export default router;
