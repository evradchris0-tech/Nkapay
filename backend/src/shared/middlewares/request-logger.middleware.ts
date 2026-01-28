/**
 * Middleware de logging des requetes HTTP
 * Enregistre les informations de chaque requete entrante
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.util';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();

  // Log de la requete entrante
  logger.info(`[REQ] ${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Interception de la fin de la reponse
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const level = res.statusCode >= 400 ? 'warn' : 'info';

    logger[level](`[RES] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });

  next();
}
