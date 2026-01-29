/**
 * Routes pour la gestion des types d'evenements de secours
 */

import { Router } from 'express';
import { authenticate } from '../../../shared';
import { typeEvenementSecoursController } from '../controllers/type-evenement-secours.controller';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateTypeEvenementSecours:
 *       type: object
 *       required:
 *         - code
 *         - libelle
 *       properties:
 *         code:
 *           type: string
 *         libelle:
 *           type: string
 *         description:
 *           type: string
 *         montantParDefaut:
 *           type: number
 *         ordreAffichage:
 *           type: integer
 *         estActif:
 *           type: boolean
 *     TypeEvenementSecoursResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         code:
 *           type: string
 *         libelle:
 *           type: string
 *         montantParDefaut:
 *           type: number
 *         ordreAffichage:
 *           type: integer
 *         estActif:
 *           type: boolean
 */

/**
 * @swagger
 * /types-evenements-secours:
 *   post:
 *     summary: Creer un nouveau type d'evenement de secours
 *     tags: [TypesEvenementsSecours]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTypeEvenementSecours'
 *     responses:
 *       201:
 *         description: Type d'evenement de secours cree
 */
router.post('/', authenticate, typeEvenementSecoursController.create.bind(typeEvenementSecoursController));

/**
 * @swagger
 * /types-evenements-secours:
 *   get:
 *     summary: Lister tous les types d'evenement de secours
 *     tags: [TypesEvenementsSecours]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Liste des types d'evenement de secours
 */
router.get('/', authenticate, typeEvenementSecoursController.findAll.bind(typeEvenementSecoursController));

/**
 * @swagger
 * /types-evenements-secours/{id}:
 *   get:
 *     summary: Obtenir un type d'evenement de secours par ID
 *     tags: [TypesEvenementsSecours]
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
 *         description: Type d'evenement de secours trouve
 *       404:
 *         description: Type d'evenement de secours non trouve
 */
router.get('/:id', authenticate, typeEvenementSecoursController.findById.bind(typeEvenementSecoursController));

/**
 * @swagger
 * /types-evenements-secours/{id}:
 *   patch:
 *     summary: Mettre a jour un type d'evenement de secours
 *     tags: [TypesEvenementsSecours]
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
 *         description: Type d'evenement de secours mis a jour
 */
router.patch('/:id', authenticate, typeEvenementSecoursController.update.bind(typeEvenementSecoursController));

/**
 * @swagger
 * /types-evenements-secours/{id}:
 *   delete:
 *     summary: Supprimer un type d'evenement de secours
 *     tags: [TypesEvenementsSecours]
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
 *         description: Type d'evenement de secours supprime
 */
router.delete('/:id', authenticate, typeEvenementSecoursController.delete.bind(typeEvenementSecoursController));

export const typeEvenementSecoursRoutes = router;
