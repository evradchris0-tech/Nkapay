/**
 * Routes pour la gestion des types de penalite
 */

import { Router } from 'express';
import { authenticate } from '../../../shared';
import { typePenaliteController } from '../controllers/type-penalite.controller';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateTypePenalite:
 *       type: object
 *       required:
 *         - code
 *         - libelle
 *         - modeCalcul
 *       properties:
 *         code:
 *           type: string
 *         libelle:
 *           type: string
 *         description:
 *           type: string
 *         modeCalcul:
 *           type: string
 *           enum: [MONTANT_FIXE, POURCENTAGE, MONTANT_PAR_JOUR]
 *         valeurDefaut:
 *           type: number
 *         estActif:
 *           type: boolean
 *     TypePenaliteResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         code:
 *           type: string
 *         libelle:
 *           type: string
 *         modeCalcul:
 *           type: string
 *         valeurDefaut:
 *           type: number
 *         estActif:
 *           type: boolean
 */

/**
 * @swagger
 * /types-penalites:
 *   post:
 *     summary: Creer un nouveau type de penalite
 *     tags: [TypesPenalites]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTypePenalite'
 *     responses:
 *       201:
 *         description: Type de penalite cree
 */
router.post('/', authenticate, typePenaliteController.create.bind(typePenaliteController));

/**
 * @swagger
 * /types-penalites:
 *   get:
 *     summary: Lister tous les types de penalite
 *     tags: [TypesPenalites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Liste des types de penalite
 */
router.get('/', authenticate, typePenaliteController.findAll.bind(typePenaliteController));

/**
 * @swagger
 * /types-penalites/{id}:
 *   get:
 *     summary: Obtenir un type de penalite par ID
 *     tags: [TypesPenalites]
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
 *         description: Type de penalite trouve
 *       404:
 *         description: Type de penalite non trouve
 */
router.get('/:id', authenticate, typePenaliteController.findById.bind(typePenaliteController));

/**
 * @swagger
 * /types-penalites/{id}:
 *   patch:
 *     summary: Mettre a jour un type de penalite
 *     tags: [TypesPenalites]
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
 *         description: Type de penalite mis a jour
 */
router.patch('/:id', authenticate, typePenaliteController.update.bind(typePenaliteController));

/**
 * @swagger
 * /types-penalites/{id}:
 *   delete:
 *     summary: Supprimer un type de penalite
 *     tags: [TypesPenalites]
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
 *         description: Type de penalite supprime
 */
router.delete('/:id', authenticate, typePenaliteController.delete.bind(typePenaliteController));

export const typePenaliteRoutes = router;
