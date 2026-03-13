/**
 * Middlewares de contrôle d'accès multi-tenant
 * Utilisés pour protéger les routes par rôle organisation et plateforme
 */

import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../errors';

/**
 * S'assure que la requête porte un contexte organisation valide (depuis le JWT).
 * À appliquer après `authenticate` sur toutes les routes org-scoped.
 */
export function requireOrganisation(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    next(new UnauthorizedError('Authentification requise'));
    return;
  }

  if (!req.user.organisationId) {
    next(new ForbiddenError('Contexte organisation manquant — incluez organisationId dans le token'));
    return;
  }

  next();
}

/**
 * Vérifie que l'utilisateur possède l'un des rôles org spécifiés.
 * @param roles Liste des rôles autorisés (ORG_ADMIN, ORG_MEMBRE, ORG_VIEWER)
 */
export function requireOrgRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('Authentification requise'));
      return;
    }

    if (!req.user.orgRole || !roles.includes(req.user.orgRole)) {
      next(
        new ForbiddenError(
          `Rôle insuffisant. Requis : ${roles.join(' ou ')}. Actuel : ${req.user.orgRole ?? 'aucun'}`
        )
      );
      return;
    }

    next();
  };
}

/**
 * Restreint l'accès aux super-admins de la plateforme uniquement.
 */
export function requireSuperAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    next(new UnauthorizedError('Authentification requise'));
    return;
  }

  if (!req.user.estSuperAdmin) {
    next(new ForbiddenError('Accès réservé aux administrateurs de la plateforme'));
    return;
  }

  next();
}
