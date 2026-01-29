/**
 * Routes pour les demandes d'adhesion
 */

import { Router } from 'express';
import { demandeAdhesionController } from '../controllers/demande-adhesion.controller';
import { authenticate } from '../../../shared';

const router = Router();

// Routes specifiques en premier
router.get('/summary', authenticate, (req, res, next) => demandeAdhesionController.getSummary(req, res, next));

// Routes CRUD
router.post('/', authenticate, (req, res, next) => demandeAdhesionController.create(req, res, next));
router.get('/', authenticate, (req, res, next) => demandeAdhesionController.findAll(req, res, next));
router.get('/:id', authenticate, (req, res, next) => demandeAdhesionController.findById(req, res, next));
router.delete('/:id', authenticate, (req, res, next) => demandeAdhesionController.delete(req, res, next));

// Actions
router.post('/:id/en-cours', authenticate, (req, res, next) => demandeAdhesionController.mettreEnCours(req, res, next));
router.post('/:id/approuver', authenticate, (req, res, next) => demandeAdhesionController.approuver(req, res, next));
router.post('/:id/refuser', authenticate, (req, res, next) => demandeAdhesionController.refuser(req, res, next));

export default router;
