/**
 * Routes pour la gestion des penalites
 */

import { Router } from 'express';
import { authenticate } from '../../../shared';
import { penaliteController } from '../controllers/penalite.controller';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     CreatePenalite:
 *       type: object
 *       required:
 *         - exerciceMembreId
 *         - typePenaliteId
 *         - montant
 *       properties:
 *         exerciceMembreId:
 *           type: string
 *           format: uuid
 *         reunionId:
 *           type: string
 *           format: uuid
 *         typePenaliteId:
 *           type: string
 *           format: uuid
 *         montant:
 *           type: number
 *         motif:
 *           type: string
 *         appliqueParExerciceMembreId:
 *           type: string
 *           format: uuid
 *     PayerPenalite:
 *       type: object
 *       required:
 *         - transactionId
 *       properties:
 *         transactionId:
 *           type: string
 *           format: uuid
 *     AnnulerPenalite:
 *       type: object
 *       required:
 *         - motifAnnulation
 *       properties:
 *         motifAnnulation:
 *           type: string
 *     PenaliteResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         exerciceMembreId:
 *           type: string
 *         typePenalite:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             code:
 *               type: string
 *             libelle:
 *               type: string
 *         montant:
 *           type: number
 *         statut:
 *           type: string
 *           enum: [EN_ATTENTE, PAYEE, ANNULEE, PARDONNEE]
 */

/**
 * @swagger
 * /penalites:
 *   post:
 *     summary: Appliquer une penalite
 *     tags: [Penalites]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePenalite'
 *     responses:
 *       201:
 *         description: Penalite appliquee
 */
router.post('/', authenticate, penaliteController.create.bind(penaliteController));

/**
 * @swagger
 * /penalites:
 *   get:
 *     summary: Lister les penalites
 *     tags: [Penalites]
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
 *           enum: [EN_ATTENTE, PAYEE, ANNULEE, PARDONNEE]
 *     responses:
 *       200:
 *         description: Liste des penalites
 */
router.get('/', authenticate, penaliteController.findAll.bind(penaliteController));

/**
 * @swagger
 * /penalites/summary:
 *   get:
 *     summary: Obtenir le resume des penalites
 *     tags: [Penalites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: exerciceId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Resume des penalites
 */
router.get('/summary', authenticate, penaliteController.getSummary.bind(penaliteController));

/**
 * @swagger
 * /penalites/{id}:
 *   get:
 *     summary: Obtenir une penalite par ID
 *     tags: [Penalites]
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
 *         description: Penalite trouvee
 *       404:
 *         description: Penalite non trouvee
 */
router.get('/:id', authenticate, penaliteController.findById.bind(penaliteController));

/**
 * @swagger
 * /penalites/{id}/payer:
 *   post:
 *     summary: Payer une penalite
 *     tags: [Penalites]
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
 *             $ref: '#/components/schemas/PayerPenalite'
 *     responses:
 *       200:
 *         description: Penalite payee
 */
router.post('/:id/payer', authenticate, penaliteController.payer.bind(penaliteController));

/**
 * @swagger
 * /penalites/{id}/annuler:
 *   post:
 *     summary: Annuler une penalite
 *     tags: [Penalites]
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
 *             $ref: '#/components/schemas/AnnulerPenalite'
 *     responses:
 *       200:
 *         description: Penalite annulee
 */
router.post('/:id/annuler', authenticate, penaliteController.annuler.bind(penaliteController));

/**
 * @swagger
 * /penalites/{id}/pardonner:
 *   post:
 *     summary: Pardonner une penalite
 *     tags: [Penalites]
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
 *               - motif
 *             properties:
 *               motif:
 *                 type: string
 *     responses:
 *       200:
 *         description: Penalite pardonnee
 */
router.post('/:id/pardonner', authenticate, penaliteController.pardonner.bind(penaliteController));

export const penaliteRoutes = router;
