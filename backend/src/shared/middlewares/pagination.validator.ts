/**
 * Validateurs de pagination réutilisables
 */

import { query } from 'express-validator';

export const paginationValidator = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('La page doit être un entier positif supérieur ou égal à 1')
        .toInt(), // Conversion automatique en entier

    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('La limite doit être un entier entre 1 et 100')
        .toInt(), // Conversion automatique en entier

    query('sortBy')
        .optional()
        .isString()
        .trim()
        .escape()
        .withMessage('Le champ de tri doit être une chaîne de caractères'),

    query('sortOrder')
        .optional()
        .isIn(['ASC', 'DESC', 'asc', 'desc'])
        .withMessage('L\'ordre de tri doit être ASC ou DESC')
        .customSanitizer((value) => value ? value.toUpperCase() : undefined),
];
