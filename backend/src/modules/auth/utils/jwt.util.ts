/**
 * Utilitaires de gestion des tokens JWT
 */

import jwt, { SignOptions, JwtPayload as JwtBasePayload } from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../../../config/env.config';
import { JwtPayload } from '../dtos/auth.dto';

export interface AccessTokenOptions {
  organisationId?: string;
  orgRole?: string;
  estSuperAdmin?: boolean;
}

/**
 * Genere un access token (avec contexte organisation optionnel)
 */
export function generateAccessToken(utilisateurId: string, opts?: AccessTokenOptions): string {
  const payload: Record<string, unknown> = {
    sub: utilisateurId,
    type: 'access',
  };

  if (opts?.organisationId) payload.org = opts.organisationId;
  if (opts?.orgRole) payload.orgRole = opts.orgRole;
  if (opts?.estSuperAdmin) payload.estSuperAdmin = true;

  const options: SignOptions = {
    expiresIn: env.jwt.accessExpiresIn as jwt.SignOptions['expiresIn'],
    algorithm: 'HS256',
  };

  return jwt.sign(payload, env.jwt.secret, options);
}

/**
 * Genere un refresh token
 */
export function generateRefreshToken(utilisateurId: string): string {
  const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
    sub: utilisateurId,
    type: 'refresh',
  };

  const options: SignOptions = {
    expiresIn: env.jwt.refreshExpiresIn as jwt.SignOptions['expiresIn'],
    algorithm: 'HS256',
  };

  return jwt.sign(payload, env.jwt.secret, options);
}

/**
 * Verifie et decode un token JWT
 */
export function verifyToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, env.jwt.secret) as JwtBasePayload & JwtPayload;
  return {
    sub: decoded.sub,
    type: decoded.type,
    iat: decoded.iat!,
    exp: decoded.exp!,
  };
}

/**
 * Hash un token pour stockage en base
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Calcule la date d'expiration a partir d'une duree en secondes
 */
export function getExpirationDate(expiresInSeconds: number): Date {
  return new Date(Date.now() + expiresInSeconds * 1000);
}

/**
 * Parse une duree au format JWT (ex: '1h', '7d') en secondes
 */
export function parseExpiresIn(expiresIn: string): number {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error(`Format de duree invalide: ${expiresIn}`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 3600;
    case 'd':
      return value * 86400;
    default:
      throw new Error(`Unite de temps inconnue: ${unit}`);
  }
}
