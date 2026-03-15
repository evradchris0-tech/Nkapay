/**
 * Routes d'exportation PDF / Excel
 *
 * Endpoints:
 * GET /exports/releve/:exerciceMembreId?format=pdf|excel
 * GET /exports/rapport-exercice/:exerciceId?format=pdf|excel
 * GET /exports/rapport-mensuel/:reunionId?format=pdf|excel
 */

import { Router } from 'express';
import { param, query } from 'express-validator';
import { authenticate, validate } from '../../../shared';
import { exportController } from '../controllers/export.controller';

const router = Router();

// Validators communs
const formatValidator = [
    query('format')
        .optional()
        .isIn(['pdf', 'excel'])
        .withMessage('Format invalide. Valeurs acceptées: pdf, excel'),
];

const uuidParamValidator = (name: string) => [
    param(name)
        .isUUID()
        .withMessage(`Format d'identifiant ${name} invalide`),
];

// ============================================================================
// SWAGGER SCHEMAS
// ============================================================================

/**
 * @swagger
 * tags:
 *   name: Exports
 *   description: Génération et téléchargement de rapports PDF / Excel
 */

/**
 * @swagger
 * /exports/releve/{exerciceMembreId}:
 *   get:
 *     summary: Télécharger le relevé de compte individuel
 *     description: |
 *       Génère un relevé de compte PDF ou Excel pour un membre d'exercice.
 *       Contient le résumé financier, le détail des transactions, et les infos de prêt.
 *     tags: [Exports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: exerciceMembreId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID du membre d'exercice
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [pdf, excel]
 *           default: pdf
 *         description: Format du fichier (pdf ou excel)
 *     responses:
 *       200:
 *         description: Fichier téléchargé
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Membre non trouvé
 */
router.get(
    '/releve/:exerciceMembreId',
    authenticate,
    ...uuidParamValidator('exerciceMembreId'),
    ...formatValidator,
    validate,
    exportController.exportReleveCompte.bind(exportController),
);

/**
 * @swagger
 * /exports/rapport-exercice/{exerciceId}:
 *   get:
 *     summary: Télécharger le rapport de fin d'exercice
 *     description: |
 *       Génère un rapport complet PDF ou Excel pour un exercice.
 *       Contient le résumé financier global, le détail par membre, et l'historique des réunions.
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
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [pdf, excel]
 *           default: pdf
 *     responses:
 *       200:
 *         description: Fichier téléchargé
 *       404:
 *         description: Exercice non trouvé
 */
router.get(
    '/rapport-exercice/:exerciceId',
    authenticate,
    ...uuidParamValidator('exerciceId'),
    ...formatValidator,
    validate,
    exportController.exportRapportExercice.bind(exportController),
);

/**
 * @swagger
 * /exports/rapport-mensuel/{reunionId}:
 *   get:
 *     summary: Télécharger le rapport mensuel (par réunion)
 *     description: |
 *       Génère un rapport mensuel PDF ou Excel pour une réunion spécifique.
 *       Contient les cotisations, remboursements de prêts, pénalités, et le bénéficiaire.
 *     tags: [Exports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reunionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [pdf, excel]
 *           default: pdf
 *     responses:
 *       200:
 *         description: Fichier téléchargé
 *       404:
 *         description: Réunion non trouvée
 */
router.get(
    '/rapport-mensuel/:reunionId',
    authenticate,
    ...uuidParamValidator('reunionId'),
    ...formatValidator,
    validate,
    exportController.exportRapportMensuel.bind(exportController),
);

export const exportRoutes = router;
