/**
 * Middleware d'authentification JWT
 * Verifie et decode le token d'acces dans les requetes protegees
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config';
import { UnauthorizedError } from '../errors';
import { logger } from '../utils/logger.util';

/**
 * Payload brut du JWT tel que genere par jwt.util.ts
 */
interface JwtTokenPayload {
  sub: string; // utilisateurId
  type: 'access' | 'refresh';
  iat: number;
  exp: number;
}

/**
 * Interface exposee sur req.user pour faciliter l'acces
 */
export interface AuthUser {
  id: string;       // alias pour sub (utilisateurId)
  sub: string;      // utilisateurId original
  type: 'access' | 'refresh';
  estSuperAdmin: boolean;
  organisationId?: string;
  orgRole?: string;
  iat: number;
  exp: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
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

    const decoded = jwt.verify(token, env.jwt.secret) as JwtTokenPayload;

    // S'assurer que seuls les access tokens sont acceptes (pas les refresh tokens)
    if (decoded.type !== 'access') {
      throw new UnauthorizedError('Type de token invalide');
    }

    // Mapper le payload JWT vers AuthUser avec id comme alias de sub
    req.user = {
      id: decoded.sub,
      sub: decoded.sub,
      type: decoded.type,
      estSuperAdmin: (decoded as any).estSuperAdmin ?? false,
      iat: decoded.iat,
      exp: decoded.exp,
    };

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
      const decoded = jwt.verify(token, env.jwt.secret) as JwtTokenPayload;

      req.user = {
        id: decoded.sub,
        sub: decoded.sub,
        type: decoded.type,
        estSuperAdmin: (decoded as any).estSuperAdmin ?? false,
        iat: decoded.iat,
        exp: decoded.exp,
      };
    }

    next();
  } catch {
    // Token invalide ignore, la requete continue sans utilisateur
    next();
  }
}
