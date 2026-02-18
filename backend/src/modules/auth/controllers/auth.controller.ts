/**
 * Controleur d'authentification
 * Gestion des endpoints de connexion/deconnexion
 */

import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { UtilisateurService } from '../../utilisateurs/services/utilisateur.service';
import { LoginDto, RefreshTokenDto, LogoutDto } from '../dtos/auth.dto';
import { ApiResponse } from '../../../shared/utils/api-response.util';

// Lazy initialization pour eviter d'appeler getRepository() avant DataSource.initialize()
let authService: AuthService;
let utilisateurService: UtilisateurService;

function getAuthService(): AuthService {
  if (!authService) authService = new AuthService();
  return authService;
}

function getUtilisateurService(): UtilisateurService {
  if (!utilisateurService) utilisateurService = new UtilisateurService();
  return utilisateurService;
}

/**
 * POST /auth/login
 * Authentification d'un utilisateur
 */
export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto: LoginDto = req.body;
    const adresseIp = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.get('user-agent');

    const result = await getAuthService().login(dto, adresseIp, userAgent);

    res.json(ApiResponse.success(result, 'Connexion reussie'));
  } catch (error) {
    next(error);
  }
}

/**
 * POST /auth/refresh
 * Rafraichissement du token d'acces
 */
export async function refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto: RefreshTokenDto = req.body;

    const result = await getAuthService().refreshToken(dto.refreshToken);

    res.json(ApiResponse.success(result));
  } catch (error) {
    next(error);
  }
}

/**
 * POST /auth/logout
 * Deconnexion de l'utilisateur
 */
export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto: LogoutDto = req.body;
    const utilisateurId = req.user?.id;

    if (!utilisateurId) {
      res.status(401).json(ApiResponse.error('Non authentifie'));
      return;
    }

    await getAuthService().logout(utilisateurId, dto.sessionId, dto.toutesLesSessions);

    res.json(ApiResponse.success(null, 'Deconnexion reussie'));
  } catch (error) {
    next(error);
  }
}

/**
 * GET /auth/sessions
 * Liste des sessions actives de l'utilisateur connecte
 */
export async function getSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const utilisateurId = req.user?.id;

    if (!utilisateurId) {
      res.status(401).json(ApiResponse.error('Non authentifie'));
      return;
    }

    const sessions = await getAuthService().getActiveSessions(utilisateurId);

    // On masque les hashs de token dans la reponse
    const sessionsResponse = sessions.map((s) => ({
      id: s.id,
      creeLe: s.creeLe,
      derniereActivite: s.derniereActivite,
      adresseIp: s.adresseIp,
      userAgent: s.userAgent,
    }));

    res.json(ApiResponse.success(sessionsResponse));
  } catch (error) {
    next(error);
  }
}

/**
 * GET /auth/me
 * Informations de l'utilisateur connecte
 */
export async function getCurrentUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json(ApiResponse.error('Non authentifie'));
      return;
    }

    // Charger l'utilisateur depuis la base de donnees (le JWT ne contient que l'ID)
    const utilisateur = await getUtilisateurService().findById(userId);
    const responseDto = getUtilisateurService().toResponseDto(utilisateur);

    res.json(ApiResponse.success(responseDto));
  } catch (error) {
    next(error);
  }
}
