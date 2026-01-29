/**
 * Routes pour les distributions
 */

import { Router } from 'express';
import { distributionController } from '../controllers/distribution.controller';
import { authenticate } from '../../../shared';

const router = Router();

// Routes specifiques en premier
router.get('/summary', authenticate, (req, res, next) => distributionController.getSummary(req, res, next));
router.get('/reunion/:reunionId', authenticate, (req, res, next) => distributionController.findByReunion(req, res, next));

// Routes CRUD
router.post('/', authenticate, (req, res, next) => distributionController.create(req, res, next));
router.get('/', authenticate, (req, res, next) => distributionController.findAll(req, res, next));
router.get('/:id', authenticate, (req, res, next) => distributionController.findById(req, res, next));
router.patch('/:id', authenticate, (req, res, next) => distributionController.update(req, res, next));
router.delete('/:id', authenticate, (req, res, next) => distributionController.delete(req, res, next));

// Actions
router.post('/:id/distribuer', authenticate, (req, res, next) => distributionController.distribuer(req, res, next));
router.post('/:id/annuler', authenticate, (req, res, next) => distributionController.annuler(req, res, next));

export default router;
