/**
 * Routes pour les définitions de règles
 */

import { Router } from 'express';
import { ruleDefinitionController } from '../controllers/rule-definition.controller';
import { authenticate } from '../../../shared';

const router = Router();

router.use(authenticate);

// CRUD
router.post('/', (req, res, next) => ruleDefinitionController.create(req, res, next));
router.get('/', (req, res, next) => ruleDefinitionController.findAll(req, res, next));
router.get('/modifiables/tontine', (req, res, next) => ruleDefinitionController.findModifiablesByTontine(req, res, next));
router.get('/modifiables/exercice', (req, res, next) => ruleDefinitionController.findModifiablesByExercice(req, res, next));
router.get('/categorie/:categorie', (req, res, next) => ruleDefinitionController.findByCategorie(req, res, next));
router.get('/cle/:cle', (req, res, next) => ruleDefinitionController.findByCle(req, res, next));
router.get('/:id', (req, res, next) => ruleDefinitionController.findById(req, res, next));
router.put('/:id', (req, res, next) => ruleDefinitionController.update(req, res, next));
router.delete('/:id', (req, res, next) => ruleDefinitionController.delete(req, res, next));

export const ruleDefinitionRoutes = router;
