/**
 * Routes pour les transactions
 */

import { Router } from 'express';
import { transactionController } from '../controllers/transaction.controller';
import { authenticate } from '../../../shared';

const router = Router();

// Routes specifiques en premier
router.post('/cotisation', authenticate, (req, res, next) => transactionController.createCotisation(req, res, next));
router.post('/pot', authenticate, (req, res, next) => transactionController.createPot(req, res, next));
router.post('/inscription', authenticate, (req, res, next) => transactionController.createInscription(req, res, next));
router.get('/summary', authenticate, (req, res, next) => transactionController.getSummary(req, res, next));
router.get('/reference/:reference', authenticate, (req, res, next) => transactionController.findByReference(req, res, next));

// Routes CRUD
router.post('/', authenticate, (req, res, next) => transactionController.create(req, res, next));
router.get('/', authenticate, (req, res, next) => transactionController.findAll(req, res, next));
router.get('/:id', authenticate, (req, res, next) => transactionController.findById(req, res, next));
router.patch('/:id', authenticate, (req, res, next) => transactionController.update(req, res, next));
router.delete('/:id', authenticate, (req, res, next) => transactionController.delete(req, res, next));

// Actions sur les transactions
router.post('/:id/soumettre', authenticate, (req, res, next) => transactionController.soumettre(req, res, next));
router.post('/:id/valider', authenticate, (req, res, next) => transactionController.valider(req, res, next));
router.post('/:id/rejeter', authenticate, (req, res, next) => transactionController.rejeter(req, res, next));
router.post('/:id/annuler', authenticate, (req, res, next) => transactionController.annuler(req, res, next));

export default router;
