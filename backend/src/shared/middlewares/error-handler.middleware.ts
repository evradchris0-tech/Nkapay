/**
 * Middleware de gestion globale des erreurs
 * Intercepte toutes les erreurs et les formate de maniere coherente
 */

import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../errors';
import { ApiResponse } from '../utils';
import { logger } from '../utils/logger.util';
import { isDevelopment } from '../../config';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log de l'erreur
  if (err instanceof AppError && err.isOperational) {
    logger.warn(`Erreur operationnelle: ${err.message}`, {
      code: err.code,
      statusCode: err.statusCode,
    });
  } else {
    logger.error('Erreur non geree:', err);
  }

  // Erreur de validation personnalisee
  if (err instanceof ValidationError) {
    res.status(err.statusCode).json(ApiResponse.validationError(err.errors));
    return;
  }

  // Erreurs applicatives connues
  if (err instanceof AppError) {
    res.status(err.statusCode).json(ApiResponse.error(err.message));
    return;
  }

  // Erreurs TypeORM specifiques
  if (err.name === 'QueryFailedError') {
    const message = isDevelopment ? err.message : 'Erreur de base de donnees';
    res.status(500).json(ApiResponse.error(message));
    return;
  }

  // Erreurs de syntaxe JSON
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json(ApiResponse.error('JSON invalide dans le corps de la requete'));
    return;
  }

  // Erreur generique pour toutes les autres erreurs
  const message = isDevelopment ? err.message : 'Une erreur interne est survenue';
  res.status(500).json(ApiResponse.error(message));
}
