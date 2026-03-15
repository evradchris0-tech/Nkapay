/**
 * Routes pour la gestion des événements de secours
 * 
 * Endpoints:
 * POST   /                              — Déclarer un événement
 * GET    /                              — Lister les événements (avec filtres)
 * GET    /summary                       — Résumé statistique
 * GET    /fonds/:exerciceId             — Solde du fonds de secours
 * GET    /renflouement/:exerciceId      — Calcul de renflouement
 * GET    /:id                           — Détail d'un événement
 * POST   /:id/soumettre                 — Soumettre pour validation
 * POST   /:id/valider                   — Valider (approuver)
 * POST   /:id/refuser                   — Refuser
 * POST   /:id/payer                     — Payer (lien transaction manuelle)
 * POST   /:id/decaisser                 — Décaisser (workflow automatique CAYA)
 * POST   /:id/pieces                    — Ajouter pièce justificative
 * GET    /:id/pieces                    — Lister pièces justificatives
 * DELETE /:id/pieces/:pieceId           — Supprimer pièce justificative
 */

import { Router } from 'express';
import { authenticate, validate } from '../../../shared';
import { evenementSecoursController } from '../controllers/evenement-secours.controller';
import {
    createEvenementSecoursValidator,
    validerEvenementSecoursValidator,
    refuserEvenementSecoursValidator,
    payerEvenementSecoursValidator,
    decaisserEvenementSecoursValidator,
    ajouterPieceValidator,
    pieceIdParamValidator,
    idParamValidator,
    exerciceIdParamValidator,
    filterEvenementSecoursValidator,
} from '../validators/evenement-secours.validator';

const router = Router();

// ============================================================================
// SWAGGER SCHEMAS
// ============================================================================

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateEvenementSecours:
 *       type: object
 *       required:
 *         - exerciceMembreId
 *         - typeEvenementSecoursId
 *         - dateEvenement
 *       properties:
 *         exerciceMembreId:
 *           type: string
 *           format: uuid
 *         typeEvenementSecoursId:
 *           type: string
 *           format: uuid
 *         dateEvenement:
 *           type: string
 *           format: date
 *         description:
 *           type: string
 *         montantDemande:
 *           type: number
 *         reunionId:
 *           type: string
 *           format: uuid
 *     ValiderEvenementSecours:
 *       type: object
 *       required:
 *         - valideParExerciceMembreId
 *         - montantApprouve
 *       properties:
 *         valideParExerciceMembreId:
 *           type: string
 *           format: uuid
 *         montantApprouve:
 *           type: number
 *     RefuserEvenementSecours:
 *       type: object
 *       required:
 *         - refuseParExerciceMembreId
 *         - motifRefus
 *       properties:
 *         refuseParExerciceMembreId:
 *           type: string
 *           format: uuid
 *         motifRefus:
 *           type: string
 *     DecaisserEvenementSecours:
 *       type: object
 *       required:
 *         - decaisseParExerciceMembreId
 *       properties:
 *         decaisseParExerciceMembreId:
 *           type: string
 *           format: uuid
 *           description: Trésorier effectuant le décaissement
 *         reunionId:
 *           type: string
 *           format: uuid
 *         seuilAlerteFonds:
 *           type: number
 *           description: Seuil en dessous duquel un renflouement est suggéré
 *     EvenementSecoursResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         exerciceMembreId:
 *           type: string
 *         typeEvenementSecours:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             code:
 *               type: string
 *             libelle:
 *               type: string
 *         dateEvenement:
 *           type: string
 *           format: date
 *         montantDemande:
 *           type: number
 *         montantApprouve:
 *           type: number
 *         montantDecaisse:
 *           type: number
 *         statut:
 *           type: string
 *           enum: [DECLARE, EN_COURS_VALIDATION, VALIDE, REFUSE, PAYE]
 *         piecesJustificatives:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               typePiece:
 *                 type: string
 *               nomFichier:
 *                 type: string
 *     RenflouementInfo:
 *       type: object
 *       properties:
 *         exerciceId:
 *           type: string
 *         soldeFondsActuel:
 *           type: number
 *         montantCible:
 *           type: number
 *         deficit:
 *           type: number
 *         membresActifs:
 *           type: integer
 *         montantParMembre:
 *           type: number
 *         estNecessaire:
 *           type: boolean
 */

// ============================================================================
// ROUTES CRUD
// ============================================================================

/**
 * @swagger
 * /evenements-secours:
 *   post:
 *     summary: Déclarer un événement de secours
 *     tags: [EvenementsSecours]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateEvenementSecours'
 *     responses:
 *       201:
 *         description: Événement de secours déclaré
 */
router.post('/', authenticate, createEvenementSecoursValidator, validate, evenementSecoursController.create.bind(evenementSecoursController));

/**
 * @swagger
 * /evenements-secours:
 *   get:
 *     summary: Lister les événements de secours
 *     tags: [EvenementsSecours]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: exerciceId
 *         schema:
 *           type: string
 *       - in: query
 *         name: exerciceMembreId
 *         schema:
 *           type: string
 *       - in: query
 *         name: typeEvenementSecoursId
 *         schema:
 *           type: string
 *       - in: query
 *         name: statut
 *         schema:
 *           type: string
 *           enum: [DECLARE, EN_COURS_VALIDATION, VALIDE, REFUSE, PAYE]
 *       - in: query
 *         name: dateDebut
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dateFin
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Liste des événements de secours
 */
router.get('/', authenticate, filterEvenementSecoursValidator, validate, evenementSecoursController.findAll.bind(evenementSecoursController));

/**
 * @swagger
 * /evenements-secours/summary:
 *   get:
 *     summary: Obtenir le résumé des secours
 *     tags: [EvenementsSecours]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: exerciceId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Résumé des secours avec statistiques
 */
router.get('/summary', authenticate, evenementSecoursController.getSummary.bind(evenementSecoursController));

// ============================================================================
// FONDS DE SECOURS
// ============================================================================

/**
 * @swagger
 * /evenements-secours/fonds/{exerciceId}:
 *   get:
 *     summary: Obtenir le solde du fonds de secours
 *     tags: [EvenementsSecours]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: exerciceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Solde et détails du fonds de secours
 */
router.get('/fonds/:exerciceId', authenticate, exerciceIdParamValidator, validate, evenementSecoursController.getSoldeFonds.bind(evenementSecoursController));

/**
 * @swagger
 * /evenements-secours/renflouement/{exerciceId}:
 *   get:
 *     summary: Calculer le renflouement nécessaire
 *     tags: [EvenementsSecours]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: exerciceId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: montantCible
 *         schema:
 *           type: number
 *         description: Montant cible du fonds (calcul du déficit)
 *     responses:
 *       200:
 *         description: Détails du renflouement nécessaire
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RenflouementInfo'
 */
router.get('/renflouement/:exerciceId', authenticate, exerciceIdParamValidator, validate, evenementSecoursController.calculerRenflouement.bind(evenementSecoursController));

// ============================================================================
// ÉVÉNEMENT INDIVIDUEL
// ============================================================================

/**
 * @swagger
 * /evenements-secours/{id}:
 *   get:
 *     summary: Obtenir un événement de secours par ID
 *     tags: [EvenementsSecours]
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
 *         description: Événement de secours trouvé
 *       404:
 *         description: Événement de secours non trouvé
 */
router.get('/:id', authenticate, idParamValidator, validate, evenementSecoursController.findById.bind(evenementSecoursController));

// ============================================================================
// WORKFLOW D'ÉTAT
// ============================================================================

/**
 * @swagger
 * /evenements-secours/{id}/soumettre:
 *   post:
 *     summary: Soumettre un événement pour validation
 *     tags: [EvenementsSecours]
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
 *         description: Événement soumis pour validation
 */
router.post('/:id/soumettre', authenticate, evenementSecoursController.soumettre.bind(evenementSecoursController));

/**
 * @swagger
 * /evenements-secours/{id}/valider:
 *   post:
 *     summary: Valider un événement de secours
 *     tags: [EvenementsSecours]
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
 *             $ref: '#/components/schemas/ValiderEvenementSecours'
 *     responses:
 *       200:
 *         description: Événement validé
 */
router.post('/:id/valider', authenticate, validerEvenementSecoursValidator, validate, evenementSecoursController.valider.bind(evenementSecoursController));

/**
 * @swagger
 * /evenements-secours/{id}/refuser:
 *   post:
 *     summary: Refuser un événement de secours
 *     tags: [EvenementsSecours]
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
 *             $ref: '#/components/schemas/RefuserEvenementSecours'
 *     responses:
 *       200:
 *         description: Événement refusé
 */
router.post('/:id/refuser', authenticate, refuserEvenementSecoursValidator, validate, evenementSecoursController.refuser.bind(evenementSecoursController));

/**
 * @swagger
 * /evenements-secours/{id}/payer:
 *   post:
 *     summary: Payer un événement (lien vers transaction existante)
 *     tags: [EvenementsSecours]
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
 *             type: object
 *             required:
 *               - transactionId
 *             properties:
 *               transactionId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Événement payé
 */
router.post('/:id/payer', authenticate, payerEvenementSecoursValidator, validate, evenementSecoursController.payer.bind(evenementSecoursController));

/**
 * @swagger
 * /evenements-secours/{id}/decaisser:
 *   post:
 *     summary: Décaisser un événement (workflow automatique CAYA)
 *     description: |
 *       Crée automatiquement la transaction DEPENSE_SECOURS, met à jour le bilan
 *       du fonds de secours, et calcule si un renflouement est nécessaire.
 *     tags: [EvenementsSecours]
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
 *             $ref: '#/components/schemas/DecaisserEvenementSecours'
 *     responses:
 *       200:
 *         description: Événement décaissé avec détails de transaction et bilan
 */
router.post('/:id/decaisser', authenticate, decaisserEvenementSecoursValidator, validate, evenementSecoursController.decaisser.bind(evenementSecoursController));

// ============================================================================
// PIÈCES JUSTIFICATIVES
// ============================================================================

/**
 * @swagger
 * /evenements-secours/{id}/pieces:
 *   post:
 *     summary: Ajouter une pièce justificative
 *     tags: [EvenementsSecours]
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
 *             type: object
 *             required:
 *               - typePiece
 *               - nomFichier
 *               - cheminFichier
 *             properties:
 *               typePiece:
 *                 type: string
 *                 enum: [CERTIFICAT_MARIAGE, ACTE_DECES, CERTIFICAT_NAISSANCE, CERTIFICAT_MEDICAL, FACTURE, PHOTO, AUTRE]
 *               nomFichier:
 *                 type: string
 *               cheminFichier:
 *                 type: string
 *               typeMime:
 *                 type: string
 *               tailleOctets:
 *                 type: integer
 *               commentaire:
 *                 type: string
 *     responses:
 *       201:
 *         description: Pièce justificative ajoutée
 */
router.post('/:id/pieces', authenticate, ajouterPieceValidator, validate, evenementSecoursController.ajouterPiece.bind(evenementSecoursController));

/**
 * @swagger
 * /evenements-secours/{id}/pieces:
 *   get:
 *     summary: Lister les pièces justificatives d'un événement
 *     tags: [EvenementsSecours]
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
 *         description: Liste des pièces justificatives
 */
router.get('/:id/pieces', authenticate, idParamValidator, validate, evenementSecoursController.getPieces.bind(evenementSecoursController));

/**
 * @swagger
 * /evenements-secours/{id}/pieces/{pieceId}:
 *   delete:
 *     summary: Supprimer une pièce justificative
 *     tags: [EvenementsSecours]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: pieceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Pièce justificative supprimée
 */
router.delete('/:id/pieces/:pieceId', authenticate, pieceIdParamValidator, validate, evenementSecoursController.supprimerPiece.bind(evenementSecoursController));

export const evenementSecoursRoutes = router;
