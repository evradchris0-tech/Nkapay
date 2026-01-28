/**
 * Middleware d'authentification JWT
 * Verifie et decode le token d'acces dans les requetes protegees
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config';
import { UnauthorizedError } from '../errors';
import { logger } from '../utils/logger.util';

export interface JwtPayload {
  userId: string;
  telephone: string;
  iat: number;
  exp: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Verifie la presence et la validite du token JWT
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Token d\'authentification manquant');
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(token, env.jwt.secret) as JwtPayload;
    req.user = decoded;

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError('Token expire'));
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError('Token invalide'));
      return;
    }

    if (error instanceof UnauthorizedError) {
      next(error);
      return;
    }

    logger.error('Erreur d\'authentification:', error);
    next(new UnauthorizedError('Erreur d\'authentification'));
  }
}

/**
 * Middleware optionnel - extrait le token s'il existe sans bloquer
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, env.jwt.secret) as JwtPayload;
      req.user = decoded;
    }

    next();
  } catch {
    // Token invalide ignore, la requete continue sans utilisateur
    next();
  }
}
