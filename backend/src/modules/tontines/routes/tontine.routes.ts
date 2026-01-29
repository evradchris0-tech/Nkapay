/**
 * Routes pour les tontines
 */

import { Router } from 'express';
import { tontineController } from '../controllers/tontine.controller';
import { authenticate } from '../../../shared';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     TontineResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         nom:
 *           type: string
 *         nomCourt:
 *           type: string
 *         anneeFondation:
 *           type: integer
 *           nullable: true
 *         motto:
 *           type: string
 *           nullable: true
 *         logo:
 *           type: string
 *           nullable: true
 *         estOfficiellementDeclaree:
 *           type: boolean
 *         numeroEnregistrement:
 *           type: string
 *           nullable: true
 *         statut:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, SUSPENDUE]
 *         tontineType:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             code:
 *               type: string
 *             libelle:
 *               type: string
 *         creeLe:
 *           type: string
 *           format: date-time
 *     CreateTontine:
 *       type: object
 *       required:
 *         - nom
 *         - nomCourt
 *         - tontineTypeId
 *       properties:
 *         nom:
 *           type: string
 *           example: Ma Tontine Familiale
 *         nomCourt:
 *           type: string
 *           example: MTF
 *         tontineTypeId:
 *           type: string
 *           format: uuid
 *         anneeFondation:
 *           type: integer
 *           example: 2020
 *         motto:
 *           type: string
 *         logo:
 *           type: string
 *         estOfficiellementDeclaree:
 *           type: boolean
 *         numeroEnregistrement:
 *           type: string
 */

/**
 * @swagger
 * /tontines:
 *   post:
 *     summary: Creer une nouvelle tontine
 *     tags: [Tontines]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTontine'
 *     responses:
 *       201:
 *         description: Tontine creee avec succes
 *       400:
 *         description: Donnees invalides
 *       401:
 *         description: Non authentifie
 */
router.post('/', authenticate, tontineController.create.bind(tontineController));

/**
 * @swagger
 * /tontines:
 *   get:
 *     summary: Lister toutes les tontines
 *     tags: [Tontines]
 *     parameters:
 *       - in: query
 *         name: statut
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, SUSPENDUE]
 *         description: Filtrer par statut
 *     responses:
 *       200:
 *         description: Liste des tontines
 */
router.get('/', tontineController.findAll.bind(tontineController));

/**
 * @swagger
 * /tontines/code/{nomCourt}:
 *   get:
 *     summary: Trouver une tontine par nom court
 *     tags: [Tontines]
 *     parameters:
 *       - in: path
 *         name: nomCourt
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tontine trouvee
 *       404:
 *         description: Tontine non trouvee
 */
router.get('/code/:nomCourt', tontineController.findByNomCourt.bind(tontineController));

/**
 * @swagger
 * /tontines/{id}:
 *   get:
 *     summary: Trouver une tontine par ID
 *     tags: [Tontines]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Tontine trouvee
 *       404:
 *         description: Tontine non trouvee
 */
router.get('/:id', tontineController.findById.bind(tontineController));

/**
 * @swagger
 * /tontines/{id}:
 *   put:
 *     summary: Mettre a jour une tontine
 *     tags: [Tontines]
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
 *             type: object
 *             properties:
 *               nom:
 *                 type: string
 *               nomCourt:
 *                 type: string
 *               motto:
 *                 type: string
 *               statut:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE, SUSPENDUE]
 *     responses:
 *       200:
 *         description: Tontine mise a jour
 *       404:
 *         description: Tontine non trouvee
 */
router.put('/:id', authenticate, tontineController.update.bind(tontineController));

/**
 * @swagger
 * /tontines/{id}/suspend:
 *   post:
 *     summary: Suspendre une tontine
 *     tags: [Tontines]
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
 *         description: Tontine suspendue
 *       404:
 *         description: Tontine non trouvee
 */
router.post('/:id/suspend', authenticate, tontineController.suspend.bind(tontineController));

/**
 * @swagger
 * /tontines/{id}/activate:
 *   post:
 *     summary: Reactiver une tontine
 *     tags: [Tontines]
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
 *         description: Tontine reactivee
 *       404:
 *         description: Tontine non trouvee
 */
router.post('/:id/activate', authenticate, tontineController.activate.bind(tontineController));

/**
 * @swagger
 * /tontines/{id}:
 *   delete:
 *     summary: Supprimer une tontine
 *     tags: [Tontines]
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
 *         description: Tontine supprimee
 *       404:
 *         description: Tontine non trouvee
 */
router.delete('/:id', authenticate, tontineController.delete.bind(tontineController));

export default router;
