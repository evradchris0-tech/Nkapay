/**
 * Routes pour les remboursements de prets
 */

import { Router } from 'express';
import { remboursementPretController } from '../controllers/remboursement-pret.controller';
import { authenticate } from '../../../shared';

const router = Router();

// Routes specifiques en premier
router.get('/pret/:pretId', authenticate, (req, res, next) => remboursementPretController.findByPret(req, res, next));
router.get('/reunion/:reunionId', authenticate, (req, res, next) => remboursementPretController.findByReunion(req, res, next));

// Routes CRUD
router.post('/', authenticate, (req, res, next) => remboursementPretController.create(req, res, next));
router.get('/:id', authenticate, (req, res, next) => remboursementPretController.findById(req, res, next));
router.delete('/:id', authenticate, (req, res, next) => remboursementPretController.delete(req, res, next));

export default router;
