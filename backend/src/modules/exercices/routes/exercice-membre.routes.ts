/**
 * Routes pour la gestion des membres d'exercice
 */

import { Router } from 'express';
import { authenticate } from '../../../shared';
import { exerciceMembreController } from '../controllers/exercice-membre.controller';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateExerciceMembre:
 *       type: object
 *       required:
 *         - exerciceId
 *         - adhesionTontineId
 *         - typeMembre
 *       properties:
 *         exerciceId:
 *           type: string
 *           format: uuid
 *         adhesionTontineId:
 *           type: string
 *           format: uuid
 *         typeMembre:
 *           type: string
 *           enum: [ANCIEN, NOUVEAU]
 *         moisEntree:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         dateEntreeExercice:
 *           type: string
 *           format: date
 *         nombreParts:
 *           type: integer
 *           minimum: 1
 *         parrainExerciceMembreId:
 *           type: string
 *           format: uuid
 *     UpdateExerciceMembre:
 *       type: object
 *       properties:
 *         typeMembre:
 *           type: string
 *           enum: [ANCIEN, NOUVEAU]
 *         moisEntree:
 *           type: integer
 *         nombreParts:
 *           type: integer
 *         statut:
 *           type: string
 *           enum: [ACTIF, INACTIF]
 *     ExerciceMembreResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         exercice:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             libelle:
 *               type: string
 *         adhesionTontine:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             matricule:
 *               type: string
 *             utilisateur:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 nom:
 *                   type: string
 *                 prenom:
 *                   type: string
 *         typeMembre:
 *           type: string
 *           enum: [ANCIEN, NOUVEAU]
 *         moisEntree:
 *           type: integer
 *         nombreParts:
 *           type: integer
 *         statut:
 *           type: string
 *           enum: [ACTIF, INACTIF]
 */

/**
 * @swagger
 * /exercices-membres:
 *   post:
 *     summary: Ajouter un membre a un exercice
 *     tags: [ExercicesMembres]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateExerciceMembre'
 *     responses:
 *       201:
 *         description: Membre ajoute
 */
router.post('/', authenticate, exerciceMembreController.create.bind(exerciceMembreController));

/**
 * @swagger
 * /exercices-membres/exercice/{exerciceId}:
 *   get:
 *     summary: Lister les membres d'un exercice
 *     tags: [ExercicesMembres]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: exerciceId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: typeMembre
 *         schema:
 *           type: string
 *           enum: [ANCIEN, NOUVEAU]
 *       - in: query
 *         name: statut
 *         schema:
 *           type: string
 *           enum: [ACTIF, INACTIF]
 *     responses:
 *       200:
 *         description: Liste des membres
 */
router.get(
  '/exercice/:exerciceId',
  authenticate,
  exerciceMembreController.findByExercice.bind(exerciceMembreController)
);

/**
 * @swagger
 * /exercices-membres/{id}:
 *   get:
 *     summary: Obtenir un membre d'exercice par ID
 *     tags: [ExercicesMembres]
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
 *         description: Membre trouve
 *       404:
 *         description: Membre non trouve
 */
router.get('/:id', authenticate, exerciceMembreController.findById.bind(exerciceMembreController));

/**
 * @swagger
 * /exercices-membres/{id}:
 *   patch:
 *     summary: Mettre a jour un membre d'exercice
 *     tags: [ExercicesMembres]
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
 *             $ref: '#/components/schemas/UpdateExerciceMembre'
 *     responses:
 *       200:
 *         description: Membre mis a jour
 */
router.patch('/:id', authenticate, exerciceMembreController.update.bind(exerciceMembreController));

/**
 * @swagger
 * /exercices-membres/{id}:
 *   delete:
 *     summary: Supprimer un membre d'exercice
 *     tags: [ExercicesMembres]
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
 *         description: Membre supprime
 */
router.delete('/:id', authenticate, exerciceMembreController.delete.bind(exerciceMembreController));

/**
 * @swagger
 * /exercices-membres/{id}/deactivate:
 *   post:
 *     summary: Desactiver un membre d'exercice
 *     tags: [ExercicesMembres]
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
 *         description: Membre desactive
 */
router.post(
  '/:id/deactivate',
  authenticate,
  exerciceMembreController.deactivate.bind(exerciceMembreController)
);

/**
 * @swagger
 * /exercices-membres/{id}/reactivate:
 *   post:
 *     summary: Reactiver un membre d'exercice
 *     tags: [ExercicesMembres]
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
 *         description: Membre reactive
 */
router.post(
  '/:id/reactivate',
  authenticate,
  exerciceMembreController.reactivate.bind(exerciceMembreController)
);

export const exerciceMembreRoutes = router;
