/**
 * Routes d'authentification
 */

import { Router } from 'express';
import { login, refreshToken, logout, getSessions, getCurrentUser } from '../controllers/auth.controller';
import { loginValidator, refreshTokenValidator, logoutValidator } from '../validators/auth.validator';
import { validate, authenticate } from '../../../shared/middlewares';

const router = Router();

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Connexion utilisateur
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - identifiant
 *               - motDePasse
 *             properties:
 *               identifiant:
 *                 type: string
 *                 description: Numero de telephone
 *               motDePasse:
 *                 type: string
 *     responses:
 *       200:
 *         description: Connexion reussie
 *       401:
 *         description: Identifiants incorrects
 */
router.post('/login', loginValidator, validate, login);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Rafraichissement du token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token rafraichi
 *       401:
 *         description: Token invalide
 */
router.post('/refresh', refreshTokenValidator, validate, refreshToken);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Deconnexion
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sessionId:
 *                 type: string
 *                 format: uuid
 *               toutesLesSessions:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Deconnexion reussie
 */
router.post('/logout', authenticate, logoutValidator, validate, logout);

/**
 * @swagger
 * /auth/sessions:
 *   get:
 *     summary: Liste des sessions actives
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des sessions
 */
router.get('/sessions', authenticate, getSessions);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Utilisateur connecte
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Informations utilisateur
 */
router.get('/me', authenticate, getCurrentUser);

export default router;
