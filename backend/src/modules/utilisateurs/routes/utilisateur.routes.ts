/**
 * Routes Utilisateur
 */

import { Router } from 'express';
import {
  getAllUtilisateurs,
  getUtilisateurById,
  createUtilisateur,
  updateUtilisateur,
  changePassword,
  deleteUtilisateur,
} from '../controllers/utilisateur.controller';
import {
  createUtilisateurValidator,
  updateUtilisateurValidator,
  changePasswordValidator,
  getUtilisateurByIdValidator,
  paginationValidator,
} from '../validators/utilisateur.validator';
import { validate, authenticate } from '../../../shared/middlewares';

const router = Router();

/**
 * @swagger
 * /utilisateurs:
 *   get:
 *     summary: Liste des utilisateurs
 *     tags: [Utilisateurs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Liste paginee
 */
router.get('/', authenticate, paginationValidator, validate, getAllUtilisateurs);

/**
 * @swagger
 * /utilisateurs/{id}:
 *   get:
 *     summary: Detail d'un utilisateur
 *     tags: [Utilisateurs]
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
 *         description: Detail utilisateur
 *       404:
 *         description: Utilisateur non trouve
 */
router.get('/:id', authenticate, getUtilisateurByIdValidator, validate, getUtilisateurById);

/**
 * @swagger
 * /utilisateurs:
 *   post:
 *     summary: Creation d'un utilisateur
 *     tags: [Utilisateurs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prenom
 *               - nom
 *               - telephone1
 *               - password
 *             properties:
 *               prenom:
 *                 type: string
 *               nom:
 *                 type: string
 *               telephone1:
 *                 type: string
 *               telephone2:
 *                 type: string
 *               password:
 *                 type: string
 *               adresseResidence:
 *                 type: string
 *     responses:
 *       201:
 *         description: Utilisateur cree
 *       409:
 *         description: Telephone deja utilise
 */
router.post('/', authenticate, createUtilisateurValidator, validate, createUtilisateur);

/**
 * @swagger
 * /utilisateurs/{id}:
 *   put:
 *     summary: Mise a jour d'un utilisateur
 *     tags: [Utilisateurs]
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
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               prenom:
 *                 type: string
 *               nom:
 *                 type: string
 *     responses:
 *       200:
 *         description: Utilisateur mis a jour
 */
router.put('/:id', authenticate, updateUtilisateurValidator, validate, updateUtilisateur);

/**
 * @swagger
 * /utilisateurs/{id}/password:
 *   patch:
 *     summary: Changement de mot de passe
 *     tags: [Utilisateurs]
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
 *             required:
 *               - ancienMotDePasse
 *               - nouveauMotDePasse
 *               - confirmationMotDePasse
 *             properties:
 *               ancienMotDePasse:
 *                 type: string
 *               nouveauMotDePasse:
 *                 type: string
 *               confirmationMotDePasse:
 *                 type: string
 *     responses:
 *       200:
 *         description: Mot de passe modifie
 */
router.patch('/:id/password', authenticate, changePasswordValidator, validate, changePassword);

/**
 * @swagger
 * /utilisateurs/{id}:
 *   delete:
 *     summary: Suppression d'un utilisateur
 *     tags: [Utilisateurs]
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
 *         description: Utilisateur supprime
 */
router.delete('/:id', authenticate, getUtilisateurByIdValidator, validate, deleteUtilisateur);

export default router;
