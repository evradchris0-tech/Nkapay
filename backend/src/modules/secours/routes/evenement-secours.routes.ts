/**
 * Routes pour la gestion des evenements de secours
 */

import { Router } from 'express';
import { authenticate } from '../../../shared';
import { evenementSecoursController } from '../controllers/evenement-secours.controller';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateEvenementSecours:
 *       type: object
 *       required:
 *         - exerciceMembreId
 *         - typeEvenementSecoursId
 *         - dateEvenement
 *       properties:
 *         exerciceMembreId:
 *           type: string
 *           format: uuid
 *         typeEvenementSecoursId:
 *           type: string
 *           format: uuid
 *         dateEvenement:
 *           type: string
 *           format: date
 *         description:
 *           type: string
 *         montantDemande:
 *           type: number
 *     ValiderEvenementSecours:
 *       type: object
 *       required:
 *         - valideParExerciceMembreId
 *         - montantApprouve
 *       properties:
 *         valideParExerciceMembreId:
 *           type: string
 *           format: uuid
 *         montantApprouve:
 *           type: number
 *     RefuserEvenementSecours:
 *       type: object
 *       required:
 *         - refuseParExerciceMembreId
 *         - motifRefus
 *       properties:
 *         refuseParExerciceMembreId:
 *           type: string
 *           format: uuid
 *         motifRefus:
 *           type: string
 *     EvenementSecoursResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         exerciceMembreId:
 *           type: string
 *         typeEvenementSecours:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             code:
 *               type: string
 *             libelle:
 *               type: string
 *         dateEvenement:
 *           type: string
 *           format: date
 *         montantDemande:
 *           type: number
 *         montantApprouve:
 *           type: number
 *         statut:
 *           type: string
 *           enum: [DECLARE, EN_COURS_VALIDATION, VALIDE, REFUSE, PAYE]
 */

/**
 * @swagger
 * /evenements-secours:
 *   post:
 *     summary: Declarer un evenement de secours
 *     tags: [EvenementsSecours]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateEvenementSecours'
 *     responses:
 *       201:
 *         description: Evenement de secours declare
 */
router.post('/', authenticate, evenementSecoursController.create.bind(evenementSecoursController));

/**
 * @swagger
 * /evenements-secours:
 *   get:
 *     summary: Lister les evenements de secours
 *     tags: [EvenementsSecours]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: exerciceId
 *         schema:
 *           type: string
 *       - in: query
 *         name: exerciceMembreId
 *         schema:
 *           type: string
 *       - in: query
 *         name: statut
 *         schema:
 *           type: string
 *           enum: [DECLARE, EN_COURS_VALIDATION, VALIDE, REFUSE, PAYE]
 *     responses:
 *       200:
 *         description: Liste des evenements de secours
 */
router.get('/', authenticate, evenementSecoursController.findAll.bind(evenementSecoursController));

/**
 * @swagger
 * /evenements-secours/summary:
 *   get:
 *     summary: Obtenir le resume des secours
 *     tags: [EvenementsSecours]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: exerciceId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Resume des secours
 */
router.get('/summary', authenticate, evenementSecoursController.getSummary.bind(evenementSecoursController));

/**
 * @swagger
 * /evenements-secours/{id}:
 *   get:
 *     summary: Obtenir un evenement de secours par ID
 *     tags: [EvenementsSecours]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Evenement de secours trouve
 *       404:
 *         description: Evenement de secours non trouve
 */
router.get('/:id', authenticate, evenementSecoursController.findById.bind(evenementSecoursController));

/**
 * @swagger
 * /evenements-secours/{id}/soumettre:
 *   post:
 *     summary: Soumettre un evenement pour validation
 *     tags: [EvenementsSecours]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Evenement soumis pour validation
 */
router.post('/:id/soumettre', authenticate, evenementSecoursController.soumettre.bind(evenementSecoursController));

/**
 * @swagger
 * /evenements-secours/{id}/valider:
 *   post:
 *     summary: Valider un evenement de secours
 *     tags: [EvenementsSecours]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ValiderEvenementSecours'
 *     responses:
 *       200:
 *         description: Evenement valide
 */
router.post('/:id/valider', authenticate, evenementSecoursController.valider.bind(evenementSecoursController));

/**
 * @swagger
 * /evenements-secours/{id}/refuser:
 *   post:
 *     summary: Refuser un evenement de secours
 *     tags: [EvenementsSecours]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefuserEvenementSecours'
 *     responses:
 *       200:
 *         description: Evenement refuse
 */
router.post('/:id/refuser', authenticate, evenementSecoursController.refuser.bind(evenementSecoursController));

/**
 * @swagger
 * /evenements-secours/{id}/payer:
 *   post:
 *     summary: Payer un evenement de secours
 *     tags: [EvenementsSecours]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - transactionId
 *             properties:
 *               transactionId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Evenement paye
 */
router.post('/:id/payer', authenticate, evenementSecoursController.payer.bind(evenementSecoursController));

export const evenementSecoursRoutes = router;
