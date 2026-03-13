/**
 * Validateurs pour les requêtes du module Secours
 * Utilise express-validator pour valider les entrées avant traitement
 */

import { body, param, query } from 'express-validator';

// =============================================================================
// PARAMÈTRES COMMUNS
// =============================================================================

export const idParamValidator = [
  param('id').isUUID().withMessage("Format d'identifiant invalide (UUID attendu)"),
];

export const pieceIdParamValidator = [
  param('id').isUUID().withMessage("Format d'identifiant événement invalide"),
  param('pieceId').isUUID().withMessage("Format d'identifiant pièce invalide"),
];

export const exerciceIdParamValidator = [
  param('exerciceId').isUUID().withMessage("Format d'identifiant exercice invalide"),
];

// =============================================================================
// CRÉATION D'ÉVÉNEMENT
// =============================================================================

export const createEvenementSecoursValidator = [
  body('exerciceMembreId')
    .notEmpty()
    .withMessage("L'identifiant du membre est requis")
    .isUUID()
    .withMessage('Format exerciceMembreId invalide'),

  body('typeEvenementSecoursId')
    .notEmpty()
    .withMessage("Le type d'événement est requis")
    .isUUID()
    .withMessage('Format typeEvenementSecoursId invalide'),

  body('dateEvenement')
    .notEmpty()
    .withMessage("La date de l'événement est requise")
    .isISO8601()
    .withMessage('Format de date invalide (ISO 8601 attendu)'),

  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('La description ne doit pas dépasser 1000 caractères'),

  body('montantDemande')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Le montant demandé doit être un nombre positif'),

  body('reunionId').optional().isUUID().withMessage('Format reunionId invalide'),
];

// =============================================================================
// VALIDATION / REFUS
// =============================================================================

export const validerEvenementSecoursValidator = [
  ...idParamValidator,

  body('montantApprouve')
    .notEmpty()
    .withMessage('Le montant approuvé est requis')
    .isFloat({ min: 0.01 })
    .withMessage('Le montant approuvé doit être strictement positif'),

  body('valideParExerciceMembreId')
    .notEmpty()
    .withMessage("L'identifiant du valideur est requis")
    .isUUID()
    .withMessage('Format valideParExerciceMembreId invalide'),
];

export const refuserEvenementSecoursValidator = [
  ...idParamValidator,

  body('refuseParExerciceMembreId')
    .notEmpty()
    .withMessage("L'identifiant du refuseur est requis")
    .isUUID()
    .withMessage('Format refuseParExerciceMembreId invalide'),

  body('motifRefus')
    .notEmpty()
    .withMessage('Le motif de refus est requis')
    .isLength({ min: 5, max: 500 })
    .withMessage('Le motif doit contenir entre 5 et 500 caractères'),
];

// =============================================================================
// PAIEMENT / DÉCAISSEMENT
// =============================================================================

export const payerEvenementSecoursValidator = [
  ...idParamValidator,

  body('transactionId')
    .notEmpty()
    .withMessage("L'identifiant de la transaction est requis")
    .isUUID()
    .withMessage('Format transactionId invalide'),
];

export const decaisserEvenementSecoursValidator = [
  ...idParamValidator,

  body('decaisseParExerciceMembreId')
    .optional()
    .isUUID()
    .withMessage('Format decaisseParExerciceMembreId invalide'),

  body('reunionId').optional().isUUID().withMessage('Format reunionId invalide'),

  body('seuilAlerteFonds')
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Le seuil d'alerte doit être un nombre positif"),
];

// =============================================================================
// PIÈCES JUSTIFICATIVES
// =============================================================================

export const ajouterPieceValidator = [
  ...idParamValidator,

  body('typePiece')
    .notEmpty()
    .withMessage('Le type de pièce est requis')
    .isIn([
      'CERTIFICAT_MARIAGE',
      'ACTE_DECES',
      'CERTIFICAT_NAISSANCE',
      'CERTIFICAT_MEDICAL',
      'FACTURE',
      'PHOTO',
      'AUTRE',
    ])
    .withMessage('Type de pièce invalide'),

  body('nomFichier')
    .notEmpty()
    .withMessage('Le nom du fichier est requis')
    .isLength({ max: 255 })
    .withMessage('Le nom du fichier ne doit pas dépasser 255 caractères'),

  body('cheminFichier').notEmpty().withMessage('Le chemin du fichier est requis'),

  body('typeMime')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Le type MIME ne doit pas dépasser 100 caractères'),

  body('tailleOctets')
    .optional()
    .isInt({ min: 0 })
    .withMessage('La taille en octets doit être un entier positif'),

  body('commentaire')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Le commentaire ne doit pas dépasser 500 caractères'),
];

// =============================================================================
// FILTRES DE RECHERCHE
// =============================================================================

export const filterEvenementSecoursValidator = [
  query('exerciceId').optional().isUUID().withMessage('Format exerciceId invalide'),

  query('exerciceMembreId').optional().isUUID().withMessage('Format exerciceMembreId invalide'),

  query('typeEvenementSecoursId')
    .optional()
    .isUUID()
    .withMessage('Format typeEvenementSecoursId invalide'),

  query('statut')
    .optional()
    .isIn(['DECLARE', 'EN_COURS_VALIDATION', 'VALIDE', 'REFUSE', 'PAYE', 'ANNULE'])
    .withMessage('Statut invalide'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Le numéro de page doit être un entier positif'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('La limite doit être entre 1 et 100'),
];
