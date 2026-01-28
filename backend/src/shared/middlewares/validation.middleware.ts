/**
 * Middleware de validation des requetes avec express-validator
 * Centralise la logique de validation et le formatage des erreurs
 */

import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { ApiResponse } from '../utils';

/**
 * Execute les validations et retourne les erreurs formatees
 * A utiliser comme dernier element d'une chaine de validation
 */
export function validate(validations: ValidationChain[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Execution de toutes les validations
    await Promise.all(validations.map((validation) => validation.run(req)));

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
  };
}
