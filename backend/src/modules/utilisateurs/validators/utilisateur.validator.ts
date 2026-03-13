/**
 * Validateurs pour les requetes utilisateur
 */

import { body, param, query } from 'express-validator';

export const createUtilisateurValidator = [
  body('prenom')
    .notEmpty()
    .withMessage('Le prenom est requis')
    .isLength({ max: 100 })
    .withMessage('Le prenom ne doit pas depasser 100 caracteres'),

  body('nom')
    .notEmpty()
    .withMessage('Le nom est requis')
    .isLength({ max: 100 })
    .withMessage('Le nom ne doit pas depasser 100 caracteres'),

  body('telephone1')
    .notEmpty()
    .withMessage('Le numero de telephone est requis')
    .matches(/^[+]?[0-9]{8,20}$/)
    .withMessage('Format de telephone invalide'),

  body('telephone2')
    .optional()
    .matches(/^[+]?[0-9]{8,20}$/)
    .withMessage('Format de telephone secondaire invalide'),

  body('password')
    .notEmpty()
    .withMessage('Le mot de passe est requis')
    .isLength({ min: 6 })
    .withMessage('Le mot de passe doit contenir au moins 6 caracteres'),

  body('adresseResidence')
    .optional()
    .isLength({ max: 255 })
    .withMessage("L'adresse ne doit pas depasser 255 caracteres"),

  body('languePrefereeId').optional().isUUID().withMessage('Format de langue invalide'),
];

export const updateUtilisateurValidator = [
  param('id').isUUID().withMessage("Format d'identifiant invalide"),

  body('prenom')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Le prenom ne doit pas depasser 100 caracteres'),

  body('nom')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Le nom ne doit pas depasser 100 caracteres'),

  body('telephone2')
    .optional()
    .matches(/^[+]?[0-9]{8,20}$/)
    .withMessage('Format de telephone secondaire invalide'),
];

export const changePasswordValidator = [
  body('ancienMotDePasse').notEmpty().withMessage("L'ancien mot de passe est requis"),

  body('nouveauMotDePasse')
    .notEmpty()
    .withMessage('Le nouveau mot de passe est requis')
    .isLength({ min: 6 })
    .withMessage('Le nouveau mot de passe doit contenir au moins 6 caracteres'),

  body('confirmationMotDePasse')
    .notEmpty()
    .withMessage('La confirmation du mot de passe est requise')
    .custom((value, { req }) => {
      if (value !== req.body.nouveauMotDePasse) {
        throw new Error('Les mots de passe ne correspondent pas');
      }
      return true;
    }),
];

export const getUtilisateurByIdValidator = [
  param('id').isUUID().withMessage("Format d'identifiant invalide"),
];

export const paginationValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Le numero de page doit etre un entier positif'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('La limite doit etre un entier entre 1 et 100'),
];
