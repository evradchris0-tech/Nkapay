/**
 * Middleware de validation des requetes avec express-validator
 * Centralise la logique de validation et le formatage des erreurs
 */

import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { ApiResponse } from '../utils';

/**
 * Middleware simple qui verifie les erreurs de validation
 * A utiliser apres les validateurs express-validator dans la chaine de middleware
 * Usage: router.post('/login', loginValidator, validate, login);
 */
export function validate(req: Request, res: Response, next: NextFunction): void {
  const errors = validationResult(req);

  if (errors.isEmpty()) {
    next();
    return;
  }

  // Formatage des erreurs pour la reponse
  const formattedErrors = errors.array().map((error) => {
    if (error.type === 'field') {
      return {
        field: error.path,
        message: error.msg,
        value: error.value,
      };
    }
    return {
      field: 'unknown',
      message: error.msg,
    };
  });

  res.status(422).json(ApiResponse.validationError(formattedErrors));
}
