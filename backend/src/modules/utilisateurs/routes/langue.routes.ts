/**
 * Routes Langue
 */

import { Router } from 'express';
import { langueController } from '../controllers/langue.controller';
import { authenticate } from '../../../shared';

const router = Router();

/**
 * @swagger
 * /api/v1/langues:
 *   get:
 *     summary: Liste toutes les langues
 *     tags: [Langues]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des langues
 */
router.get('/', authenticate, langueController.findAll.bind(langueController));

/**
 * @swagger
 * /api/v1/langues/default:
 *   get:
 *     summary: Récupérer la langue par défaut
 *     tags: [Langues]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Langue par défaut
 */
router.get('/default', authenticate, langueController.findDefault.bind(langueController));

/**
 * @swagger
 * /api/v1/langues:
 *   post:
 *     summary: Créer une langue
 *     tags: [Langues]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - nom
 *             properties:
 *               code:
 *                 type: string
 *                 example: fr
 *               nom:
 *                 type: string
 *                 example: Français
 *               estDefaut:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Langue créée
 */
router.post('/', authenticate, langueController.create.bind(langueController));

/**
 * @swagger
 * /api/v1/langues/{id}:
 *   get:
 *     summary: Récupérer une langue
 *     tags: [Langues]
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
 *         description: Langue
 */
router.get('/:id', authenticate, langueController.findById.bind(langueController));

/**
 * @swagger
 * /api/v1/langues/{id}:
 *   put:
 *     summary: Mettre à jour une langue
 *     tags: [Langues]
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
 *         description: Langue mise à jour
 */
router.put('/:id', authenticate, langueController.update.bind(langueController));

/**
 * @swagger
 * /api/v1/langues/{id}:
 *   delete:
 *     summary: Supprimer une langue
 *     tags: [Langues]
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
 *         description: Langue supprimée
 */
router.delete('/:id', authenticate, langueController.delete.bind(langueController));

export default router;
