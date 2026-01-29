/**
 * Routes pour les types de tontines
 */

import { Router } from 'express';
import { tontineTypeController } from '../controllers/tontine-type.controller';
import { authenticate } from '../../../shared';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     TontineTypeResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         code:
 *           type: string
 *         libelle:
 *           type: string
 *         description:
 *           type: string
 *           nullable: true
 *         estActif:
 *           type: boolean
 *         creeLe:
 *           type: string
 *           format: date-time
 *     CreateTontineType:
 *       type: object
 *       required:
 *         - code
 *         - libelle
 *       properties:
 *         code:
 *           type: string
 *           example: STANDARD
 *         libelle:
 *           type: string
 *           example: Tontine Standard
 *         description:
 *           type: string
 *           example: Tontine avec cotisation mensuelle simple
 *     UpdateTontineType:
 *       type: object
 *       properties:
 *         libelle:
 *           type: string
 *         description:
 *           type: string
 *         estActif:
 *           type: boolean
 */

/**
 * @swagger
 * /tontines/types:
 *   post:
 *     summary: Creer un nouveau type de tontine
 *     tags: [Types de Tontine]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTontineType'
 *     responses:
 *       201:
 *         description: Type cree avec succes
 *       400:
 *         description: Donnees invalides ou code deja existant
 *       401:
 *         description: Non authentifie
 */
router.post('/', authenticate, tontineTypeController.create.bind(tontineTypeController));

/**
 * @swagger
 * /tontines/types:
 *   get:
 *     summary: Lister tous les types de tontines
 *     tags: [Types de Tontine]
 *     parameters:
 *       - in: query
 *         name: actifOnly
 *         schema:
 *           type: boolean
 *         description: Filtrer seulement les types actifs
 *     responses:
 *       200:
 *         description: Liste des types
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TontineTypeResponse'
 */
router.get('/', tontineTypeController.findAll.bind(tontineTypeController));

/**
 * @swagger
 * /tontines/types/code/{code}:
 *   get:
 *     summary: Trouver un type par code
 *     tags: [Types de Tontine]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Type trouve
 *       404:
 *         description: Type non trouve
 */
router.get('/code/:code', tontineTypeController.findByCode.bind(tontineTypeController));

/**
 * @swagger
 * /tontines/types/{id}:
 *   get:
 *     summary: Trouver un type par ID
 *     tags: [Types de Tontine]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Type trouve
 *       404:
 *         description: Type non trouve
 */
router.get('/:id', tontineTypeController.findById.bind(tontineTypeController));

/**
 * @swagger
 * /tontines/types/{id}:
 *   put:
 *     summary: Mettre a jour un type
 *     tags: [Types de Tontine]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTontineType'
 *     responses:
 *       200:
 *         description: Type mis a jour
 *       404:
 *         description: Type non trouve
 */
router.put('/:id', authenticate, tontineTypeController.update.bind(tontineTypeController));

/**
 * @swagger
 * /tontines/types/{id}:
 *   delete:
 *     summary: Desactiver un type
 *     tags: [Types de Tontine]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Type desactive
 *       404:
 *         description: Type non trouve
 */
router.delete('/:id', authenticate, tontineTypeController.deactivate.bind(tontineTypeController));

export default router;
