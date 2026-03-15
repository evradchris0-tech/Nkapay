/**
 * Validateurs pour les requetes d'authentification
 */

import { body } from 'express-validator';

export const loginValidator = [
  body('identifiant')
    .notEmpty()
    .withMessage('Le numero de telephone est requis')
    .isLength({ min: 8, max: 20 })
    .withMessage('Le numero de telephone doit contenir entre 8 et 20 caracteres'),

  body('motDePasse')
    .notEmpty()
    .withMessage('Le mot de passe est requis')
    .isLength({ min: 6 })
    .withMessage('Le mot de passe doit contenir au moins 6 caracteres'),
];

export const refreshTokenValidator = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Le token de rafraichissement est requis'),
];

export const changePasswordValidator = [
  body('ancienMotDePasse')
    .notEmpty()
    .withMessage('L\'ancien mot de passe est requis'),

  body('nouveauMotDePasse')
    .notEmpty()
    .withMessage('Le nouveau mot de passe est requis')
    .isLength({ min: 8 })
    .withMessage('Le nouveau mot de passe doit contenir au moins 8 caracteres'),
];

export const logoutValidator = [
  body('sessionId')
    .optional()
    .isUUID()
    .withMessage('Format de session invalide'),

  body('toutesLesSessions')
    .optional()
    .isBoolean()
    .withMessage('toutesLesSessions doit etre un booleen'),
];
