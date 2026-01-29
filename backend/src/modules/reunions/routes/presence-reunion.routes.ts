/**
 * Routes pour la gestion des presences aux reunions
 */

import { Router } from 'express';
import { authenticate } from '../../../shared';
import { presenceReunionController } from '../controllers/presence-reunion.controller';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     CreatePresenceReunion:
 *       type: object
 *       required:
 *         - reunionId
 *         - exerciceMembreId
 *         - estPresent
 *       properties:
 *         reunionId:
 *           type: string
 *           format: uuid
 *         exerciceMembreId:
 *           type: string
 *           format: uuid
 *         estPresent:
 *           type: boolean
 *         estEnRetard:
 *           type: boolean
 *         heureArrivee:
 *           type: string
 *           pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'
 *         note:
 *           type: string
 *     CreatePresencesBulk:
 *       type: object
 *       required:
 *         - reunionId
 *         - presences
 *       properties:
 *         reunionId:
 *           type: string
 *           format: uuid
 *         presences:
 *           type: array
 *           items:
 *             type: object
 *             required:
 *               - exerciceMembreId
 *               - estPresent
 *             properties:
 *               exerciceMembreId:
 *                 type: string
 *               estPresent:
 *                 type: boolean
 *               estEnRetard:
 *                 type: boolean
 *               heureArrivee:
 *                 type: string
 *               note:
 *                 type: string
 *     UpdatePresenceReunion:
 *       type: object
 *       properties:
 *         estPresent:
 *           type: boolean
 *         estEnRetard:
 *           type: boolean
 *         heureArrivee:
 *           type: string
 *         note:
 *           type: string
 *     PresenceReunionSummary:
 *       type: object
 *       properties:
 *         reunionId:
 *           type: string
 *         totalMembres:
 *           type: integer
 *         presents:
 *           type: integer
 *         absents:
 *           type: integer
 *         enRetard:
 *           type: integer
 *         tauxPresence:
 *           type: number
 */

/**
 * @swagger
 * /presences:
 *   post:
 *     summary: Enregistrer une presence
 *     tags: [Presences]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePresenceReunion'
 *     responses:
 *       201:
 *         description: Presence enregistree
 */
router.post('/', authenticate, presenceReunionController.create.bind(presenceReunionController));

/**
 * @swagger
 * /presences/bulk:
 *   post:
 *     summary: Enregistrer plusieurs presences en une fois
 *     tags: [Presences]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePresencesBulk'
 *     responses:
 *       200:
 *         description: Resume des presences
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PresenceReunionSummary'
 */
router.post('/bulk', authenticate, presenceReunionController.createBulk.bind(presenceReunionController));

/**
 * @swagger
 * /presences/reunion/{reunionId}:
 *   get:
 *     summary: Obtenir les presences d'une reunion
 *     tags: [Presences]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reunionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Liste des presences
 */
router.get('/reunion/:reunionId', authenticate, presenceReunionController.findByReunion.bind(presenceReunionController));

/**
 * @swagger
 * /presences/reunion/{reunionId}/summary:
 *   get:
 *     summary: Obtenir le resume des presences d'une reunion
 *     tags: [Presences]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reunionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Resume des presences
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PresenceReunionSummary'
 */
router.get('/reunion/:reunionId/summary', authenticate, presenceReunionController.getSummary.bind(presenceReunionController));

/**
 * @swagger
 * /presences/{id}:
 *   get:
 *     summary: Obtenir une presence par ID
 *     tags: [Presences]
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
 *         description: Presence trouvee
 *       404:
 *         description: Presence non trouvee
 */
router.get('/:id', authenticate, presenceReunionController.findById.bind(presenceReunionController));

/**
 * @swagger
 * /presences/{id}:
 *   patch:
 *     summary: Mettre a jour une presence
 *     tags: [Presences]
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
 *             $ref: '#/components/schemas/UpdatePresenceReunion'
 *     responses:
 *       200:
 *         description: Presence mise a jour
 */
router.patch('/:id', authenticate, presenceReunionController.update.bind(presenceReunionController));

/**
 * @swagger
 * /presences/{id}:
 *   delete:
 *     summary: Supprimer une presence
 *     tags: [Presences]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Presence supprimee
 */
router.delete('/:id', authenticate, presenceReunionController.delete.bind(presenceReunionController));

export const presenceReunionRoutes = router;
