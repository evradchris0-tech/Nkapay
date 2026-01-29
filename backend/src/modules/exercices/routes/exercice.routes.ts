/**
 * Routes pour la gestion des exercices
 */

import { Router } from 'express';
import { authenticate } from '../../../shared';
import { exerciceController } from '../controllers/exercice.controller';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateExercice:
 *       type: object
 *       required:
 *         - tontineId
 *         - libelle
 *         - anneeDebut
 *         - moisDebut
 *         - dureeMois
 *       properties:
 *         tontineId:
 *           type: string
 *           format: uuid
 *         libelle:
 *           type: string
 *         anneeDebut:
 *           type: integer
 *         moisDebut:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         dureeMois:
 *           type: integer
 *           minimum: 1
 *     UpdateExercice:
 *       type: object
 *       properties:
 *         libelle:
 *           type: string
 *         anneeDebut:
 *           type: integer
 *         moisDebut:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         dureeMois:
 *           type: integer
 *           minimum: 1
 *     OuvrirExercice:
 *       type: object
 *       properties:
 *         dateOuverture:
 *           type: string
 *           format: date
 *     ExerciceResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         tontine:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             nom:
 *               type: string
 *         libelle:
 *           type: string
 *         anneeDebut:
 *           type: integer
 *         moisDebut:
 *           type: integer
 *         anneeFin:
 *           type: integer
 *         moisFin:
 *           type: integer
 *         dureeMois:
 *           type: integer
 *         statut:
 *           type: string
 *           enum: [BROUILLON, OUVERT, SUSPENDU, FERME]
 *         ouvertLe:
 *           type: string
 *           format: date-time
 *         fermeLe:
 *           type: string
 *           format: date-time
 *         nombreMembres:
 *           type: integer
 */

/**
 * @swagger
 * /exercices:
 *   post:
 *     summary: Creer un nouvel exercice
 *     tags: [Exercices]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateExercice'
 *     responses:
 *       201:
 *         description: Exercice cree
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ExerciceResponse'
 */
router.post('/', authenticate, exerciceController.create.bind(exerciceController));

/**
 * @swagger
 * /exercices:
 *   get:
 *     summary: Lister tous les exercices
 *     tags: [Exercices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tontineId
 *         schema:
 *           type: string
 *         required: true
 *       - in: query
 *         name: statut
 *         schema:
 *           type: string
 *           enum: [BROUILLON, OUVERT, SUSPENDU, FERME]
 *     responses:
 *       200:
 *         description: Liste des exercices
 */
router.get('/', authenticate, exerciceController.findAll.bind(exerciceController));

/**
 * @swagger
 * /exercices/tontine/{tontineId}/ouvert:
 *   get:
 *     summary: Trouver l'exercice ouvert d'une tontine
 *     tags: [Exercices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tontineId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Exercice ouvert
 *       404:
 *         description: Aucun exercice ouvert
 */
router.get('/tontine/:tontineId/ouvert', authenticate, exerciceController.findExerciceOuvert.bind(exerciceController));

/**
 * @swagger
 * /exercices/{id}:
 *   get:
 *     summary: Obtenir un exercice par ID
 *     tags: [Exercices]
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
 *         description: Exercice trouve
 *       404:
 *         description: Exercice non trouve
 */
router.get('/:id', authenticate, exerciceController.findById.bind(exerciceController));

/**
 * @swagger
 * /exercices/{id}:
 *   patch:
 *     summary: Mettre a jour un exercice
 *     tags: [Exercices]
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
 *             $ref: '#/components/schemas/UpdateExercice'
 *     responses:
 *       200:
 *         description: Exercice mis a jour
 */
router.patch('/:id', authenticate, exerciceController.update.bind(exerciceController));

/**
 * @swagger
 * /exercices/{id}:
 *   delete:
 *     summary: Supprimer un exercice
 *     tags: [Exercices]
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
 *         description: Exercice supprime
 */
router.delete('/:id', authenticate, exerciceController.delete.bind(exerciceController));

/**
 * @swagger
 * /exercices/{id}/ouvrir:
 *   post:
 *     summary: Ouvrir un exercice
 *     tags: [Exercices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OuvrirExercice'
 *     responses:
 *       200:
 *         description: Exercice ouvert
 */
router.post('/:id/ouvrir', authenticate, exerciceController.ouvrir.bind(exerciceController));

/**
 * @swagger
 * /exercices/{id}/suspendre:
 *   post:
 *     summary: Suspendre un exercice
 *     tags: [Exercices]
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
 *         description: Exercice suspendu
 */
router.post('/:id/suspendre', authenticate, exerciceController.suspendre.bind(exerciceController));

/**
 * @swagger
 * /exercices/{id}/reprendre:
 *   post:
 *     summary: Reprendre un exercice suspendu
 *     tags: [Exercices]
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
 *         description: Exercice repris
 */
router.post('/:id/reprendre', authenticate, exerciceController.reprendre.bind(exerciceController));

/**
 * @swagger
 * /exercices/{id}/fermer:
 *   post:
 *     summary: Fermer un exercice
 *     tags: [Exercices]
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
 *         description: Exercice ferme
 */
router.post('/:id/fermer', authenticate, exerciceController.fermer.bind(exerciceController));

export const exerciceRoutes = router;
