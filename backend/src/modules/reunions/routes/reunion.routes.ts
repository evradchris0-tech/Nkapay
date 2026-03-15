/**
 * Routes pour la gestion des reunions
 */

import { Router } from 'express';
import { authenticate } from '../../../shared';
import { reunionController } from '../controllers/reunion.controller';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     PlanifierReunion:
 *       type: object
 *       required:
 *         - exerciceId
 *         - numeroReunion
 *         - dateReunion
 *       properties:
 *         exerciceId:
 *           type: string
 *           format: uuid
 *         numeroReunion:
 *           type: integer
 *           minimum: 1
 *         dateReunion:
 *           type: string
 *           format: date
 *         heureDebut:
 *           type: string
 *           pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'
 *         lieu:
 *           type: string
 *         hoteExerciceMembreId:
 *           type: string
 *           format: uuid
 *     UpdateReunion:
 *       type: object
 *       properties:
 *         dateReunion:
 *           type: string
 *           format: date
 *         heureDebut:
 *           type: string
 *         lieu:
 *           type: string
 *         hoteExerciceMembreId:
 *           type: string
 *     CloturerReunion:
 *       type: object
 *       required:
 *         - clotureeParExerciceMembreId
 *       properties:
 *         clotureeParExerciceMembreId:
 *           type: string
 *           format: uuid
 *     ReunionResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         exerciceId:
 *           type: string
 *         numeroReunion:
 *           type: integer
 *         dateReunion:
 *           type: string
 *           format: date
 *         heureDebut:
 *           type: string
 *         lieu:
 *           type: string
 *         statut:
 *           type: string
 *           enum: [PLANIFIEE, OUVERTE, CLOTUREE, ANNULEE]
 *         nombrePresents:
 *           type: integer
 *         nombreAbsents:
 *           type: integer
 */

/**
 * @swagger
 * /reunions:
 *   post:
 *     summary: Planifier une nouvelle reunion
 *     tags: [Reunions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PlanifierReunion'
 *     responses:
 *       201:
 *         description: Reunion planifiee
 */
router.post('/', authenticate, reunionController.planifier.bind(reunionController));

/**
 * @swagger
 * /reunions:
 *   get:
 *     summary: Lister les reunions
 *     tags: [Reunions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: exerciceId
 *         schema:
 *           type: string
 *       - in: query
 *         name: statut
 *         schema:
 *           type: string
 *           enum: [PLANIFIEE, OUVERTE, CLOTUREE, ANNULEE]
 *     responses:
 *       200:
 *         description: Liste des reunions
 */
router.get('/', authenticate, reunionController.findAll.bind(reunionController));

/**
 * @swagger
 * /reunions/{id}:
 *   get:
 *     summary: Obtenir une reunion par ID
 *     tags: [Reunions]
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
 *         description: Reunion trouvee
 *       404:
 *         description: Reunion non trouvee
 */
router.get('/:id', authenticate, reunionController.findById.bind(reunionController));

/**
 * @swagger
 * /reunions/{id}:
 *   patch:
 *     summary: Mettre a jour une reunion
 *     tags: [Reunions]
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
 *             $ref: '#/components/schemas/UpdateReunion'
 *     responses:
 *       200:
 *         description: Reunion mise a jour
 */
router.patch('/:id', authenticate, reunionController.update.bind(reunionController));

/**
 * @swagger
 * /reunions/{id}:
 *   delete:
 *     summary: Supprimer une reunion
 *     tags: [Reunions]
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
 *         description: Reunion supprimee
 */
router.delete('/:id', authenticate, reunionController.delete.bind(reunionController));

/**
 * @swagger
 * /reunions/{id}/ouvrir:
 *   post:
 *     summary: Ouvrir une reunion
 *     tags: [Reunions]
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
 *         description: Reunion ouverte
 */
router.post('/:id/ouvrir', authenticate, reunionController.ouvrir.bind(reunionController));

/**
 * @swagger
 * /reunions/{id}/cloturer:
 *   post:
 *     summary: Cloturer une reunion
 *     tags: [Reunions]
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
 *             $ref: '#/components/schemas/CloturerReunion'
 *     responses:
 *       200:
 *         description: Reunion cloturee
 */
router.post('/:id/cloturer', authenticate, reunionController.cloturer.bind(reunionController));

/**
 * @swagger
 * /reunions/{id}/annuler:
 *   post:
 *     summary: Annuler une reunion
 *     tags: [Reunions]
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
 *         description: Reunion annulee
 */
router.post('/:id/annuler', authenticate, reunionController.annuler.bind(reunionController));

export const reunionRoutes = router;
