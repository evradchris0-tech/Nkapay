/**
 * Routes pour les adhesions aux tontines
 */

import { Router } from 'express';
import { adhesionTontineController } from '../controllers/adhesion-tontine.controller';
import { authenticate } from '../../../shared';

const router = Router();

/**
 * @swagger
 * /tontines/adhesions:
 *   post:
 *     summary: Creer une nouvelle adhesion
 *     tags: [Adhesions Tontine]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tontineId
 *               - utilisateurId
 *               - matricule
 *             properties:
 *               tontineId:
 *                 type: string
 *                 format: uuid
 *               utilisateurId:
 *                 type: string
 *                 format: uuid
 *               matricule:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [PRESIDENT, VICE_PRESIDENT, TRESORIER, SECRETAIRE, COMMISSAIRE, MEMBRE]
 *     responses:
 *       201:
 *         description: Adhesion creee
 */
router.post('/', authenticate, adhesionTontineController.create.bind(adhesionTontineController));

/**
 * @swagger
 * /tontines/adhesions/tontine/{tontineId}:
 *   get:
 *     summary: Lister les membres d'une tontine
 *     tags: [Adhesions Tontine]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tontineId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Liste des membres
 */
router.get(
  '/tontine/:tontineId',
  authenticate,
  adhesionTontineController.findByTontine.bind(adhesionTontineController)
);

/**
 * @swagger
 * /tontines/adhesions/user/{utilisateurId}:
 *   get:
 *     summary: Lister les adhesions d'un utilisateur
 *     tags: [Adhesions Tontine]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: utilisateurId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Liste des adhesions
 */
router.get(
  '/user/:utilisateurId',
  authenticate,
  adhesionTontineController.findByUser.bind(adhesionTontineController)
);

/**
 * @swagger
 * /tontines/adhesions/{id}:
 *   get:
 *     summary: Trouver une adhesion par ID
 *     tags: [Adhesions Tontine]
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
 *         description: Adhesion trouvee
 */
router.get(
  '/:id',
  authenticate,
  adhesionTontineController.findById.bind(adhesionTontineController)
);

/**
 * @swagger
 * /tontines/adhesions/{id}:
 *   put:
 *     summary: Mettre a jour une adhesion
 *     tags: [Adhesions Tontine]
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
 *         description: Adhesion mise a jour
 */
router.put('/:id', authenticate, adhesionTontineController.update.bind(adhesionTontineController));

/**
 * @swagger
 * /tontines/adhesions/{id}/role:
 *   put:
 *     summary: Changer le role d'un membre
 *     tags: [Adhesions Tontine]
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
 *         description: Role mis a jour
 */
router.put(
  '/:id/role',
  authenticate,
  adhesionTontineController.changeRole.bind(adhesionTontineController)
);

/**
 * @swagger
 * /tontines/adhesions/{id}/deactivate:
 *   post:
 *     summary: Desactiver une adhesion
 *     tags: [Adhesions Tontine]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/:id/deactivate',
  authenticate,
  adhesionTontineController.deactivate.bind(adhesionTontineController)
);

/**
 * @swagger
 * /tontines/adhesions/{id}/reactivate:
 *   post:
 *     summary: Reactiver une adhesion
 *     tags: [Adhesions Tontine]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/:id/reactivate',
  authenticate,
  adhesionTontineController.reactivate.bind(adhesionTontineController)
);

/**
 * @swagger
 * /tontines/adhesions/{id}:
 *   delete:
 *     summary: Supprimer une adhesion
 *     tags: [Adhesions Tontine]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/:id',
  authenticate,
  adhesionTontineController.delete.bind(adhesionTontineController)
);

export default router;
