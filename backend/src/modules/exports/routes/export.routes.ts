/**
 * Routes pour les exports PDF
 */

import { Router } from 'express';
import { exportController } from '../controllers/export.controller';
import { authenticate } from '../../../shared/middlewares';

const router = Router();

// Toutes les routes d'export nécessitent une authentification
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Exports
 *   description: Export de documents PDF
 */

/**
 * @swagger
 * /exports/tontines/{id}/fiche:
 *   get:
 *     summary: Exporter la fiche d'une tontine en PDF
 *     tags: [Exports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la tontine
 *     responses:
 *       200:
 *         description: Document PDF
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Tontine non trouvée
 */
router.get('/tontines/:id/fiche', exportController.exportTontineFiche.bind(exportController));

/**
 * @swagger
 * /exports/tontines/{id}/membres:
 *   get:
 *     summary: Exporter la liste des membres d'une tontine en PDF
 *     tags: [Exports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la tontine
 *     responses:
 *       200:
 *         description: Document PDF
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Tontine non trouvée
 */
router.get('/tontines/:id/membres', exportController.exportMembresListe.bind(exportController));

/**
 * @swagger
 * /exports/exercices/{id}/bilan:
 *   get:
 *     summary: Exporter le bilan d'un exercice en PDF
 *     tags: [Exports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de l'exercice
 *     responses:
 *       200:
 *         description: Document PDF
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Exercice non trouvé
 */
router.get('/exercices/:id/bilan', exportController.exportExerciceBilan.bind(exportController));

/**
 * @swagger
 * /exports/reunions/{id}/rapport:
 *   get:
 *     summary: Exporter le rapport d'une réunion en PDF
 *     tags: [Exports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la réunion
 *     responses:
 *       200:
 *         description: Document PDF
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Réunion non trouvée
 */
router.get('/reunions/:id/rapport', exportController.exportReunionRapport.bind(exportController));

/**
 * @swagger
 * /exports/exercices/{id}/financier:
 *   get:
 *     summary: Exporter le rapport financier d'un exercice en PDF
 *     tags: [Exports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de l'exercice
 *     responses:
 *       200:
 *         description: Document PDF
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Exercice non trouvé
 */
router.get('/exercices/:id/financier', exportController.exportRapportFinancier.bind(exportController));

/**
 * @swagger
 * /exports/exercices/{exerciceId}/membres/{membreId}/releve:
 *   get:
 *     summary: Exporter le relevé de compte d'un membre en PDF
 *     tags: [Exports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: exerciceId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de l'exercice
 *       - in: path
 *         name: membreId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID du membre
 *     responses:
 *       200:
 *         description: Document PDF
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Exercice ou membre non trouvé
 */
router.get('/exercices/:exerciceId/membres/:membreId/releve', exportController.exportReleveMembre.bind(exportController));

/**
 * @swagger
 * /exports/exercices/{id}/prets:
 *   get:
 *     summary: Exporter le rapport des prêts d'un exercice en PDF
 *     tags: [Exports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de l'exercice
 *     responses:
 *       200:
 *         description: Document PDF
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Exercice non trouvé
 */
router.get('/exercices/:id/prets', exportController.exportRapportPrets.bind(exportController));

/**
 * @swagger
 * /exports/exercices/{id}/penalites:
 *   get:
 *     summary: Exporter le rapport des pénalités d'un exercice en PDF
 *     tags: [Exports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de l'exercice
 *     responses:
 *       200:
 *         description: Document PDF
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Exercice non trouvé
 */
router.get('/exercices/:id/penalites', exportController.exportRapportPenalites.bind(exportController));

export default router;
