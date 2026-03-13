/**
 * Service d'authentification
 * Gestion de la connexion, deconnexion et tokens
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '../../../config/database.config';
import { Utilisateur } from '../../utilisateurs/entities/utilisateur.entity';
import { SessionUtilisateur } from '../entities/session-utilisateur.entity';
import { TentativeConnexion } from '../entities/tentative-connexion.entity';
import { MembreOrganisation } from '../../organisations/entities/membre-organisation.entity';
import { LoginDto, LoginResponseDto, JwtPayload } from '../dtos/auth.dto';
import { UnauthorizedError } from '../../../shared/errors/app-error';
import { verifyPassword } from '../utils/password.util';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  hashToken,
  parseExpiresIn,
  getExpirationDate,
} from '../utils/jwt.util';
import { env } from '../../../config/env.config';
import { logger } from '../../../shared/utils/logger.util';

export class AuthService {
  private utilisateurRepository: Repository<Utilisateur>;
  private sessionRepository: Repository<SessionUtilisateur>;
  private tentativeRepository: Repository<TentativeConnexion>;
  private membreOrgRepository: Repository<MembreOrganisation>;

  constructor() {
    this.utilisateurRepository = AppDataSource.getRepository(Utilisateur);
    this.sessionRepository = AppDataSource.getRepository(SessionUtilisateur);
    this.tentativeRepository = AppDataSource.getRepository(TentativeConnexion);
    this.membreOrgRepository = AppDataSource.getRepository(MembreOrganisation);
  }

  /**
   * Authentification d'un utilisateur
   */
  async login(dto: LoginDto, adresseIp: string, userAgent?: string): Promise<LoginResponseDto> {
    // Normaliser le numéro de téléphone (supporter les formats avec et sans +237)
    const identifiant = dto.identifiant.trim();
    const identifiantAvecPrefixe = identifiant.startsWith('+') ? identifiant : `+237${identifiant}`;
    const identifiantSansPrefixe = identifiant.startsWith('+237')
      ? identifiant.substring(4)
      : identifiant;

    // Recherche de l'utilisateur par telephone (avec les deux formats)
    const utilisateur = await this.utilisateurRepository.findOne({
      where: [
        { telephone1: identifiant },
        { telephone2: identifiant },
        { telephone1: identifiantAvecPrefixe },
        { telephone2: identifiantAvecPrefixe },
        { telephone1: identifiantSansPrefixe },
        { telephone2: identifiantSansPrefixe },
      ],
    });

    // Enregistrement de la tentative
    const tentative = this.tentativeRepository.create({
      utilisateurId: utilisateur?.id || null,
      identifiantSaisi: dto.identifiant,
      adresseIp,
      userAgent: userAgent || null,
      estReussie: false,
    });

    if (!utilisateur) {
      tentative.codeErreur = 'USER_NOT_FOUND';
      await this.tentativeRepository.save(tentative);
      throw new UnauthorizedError('Identifiants incorrects');
    }

    // Verification du mot de passe
    const isPasswordValid = await verifyPassword(dto.motDePasse, utilisateur.passwordHash);
    if (!isPasswordValid) {
      tentative.codeErreur = 'INVALID_PASSWORD';
      await this.tentativeRepository.save(tentative);
      throw new UnauthorizedError('Identifiants incorrects');
    }

    // Connexion reussie
    tentative.estReussie = true;
    await this.tentativeRepository.save(tentative);

    // Récupération des organisations de l'utilisateur
    const membresOrg = await this.membreOrgRepository.find({
      where: { utilisateurId: utilisateur.id, statut: 'ACTIVE' as any },
      relations: ['organisation'],
    });
    const organisations = membresOrg
      .filter((m) => m.organisation)
      .map((m) => ({
        id: m.organisation.id,
        nom: m.organisation.nom,
        slug: m.organisation.slug,
        role: m.role,
        statut: m.organisation.statut,
      }));

    // Embed de l'organisation active dans le JWT (première org si une seule)
    const orgActive = organisations.length === 1 ? organisations[0] : undefined;

    // Generation des tokens
    const accessToken = generateAccessToken(utilisateur.id, {
      organisationId: orgActive?.id,
      orgRole: orgActive?.role,
      estSuperAdmin: utilisateur.estSuperAdmin,
    });
    const refreshToken = generateRefreshToken(utilisateur.id);

    // Creation de la session
    const expiresInSeconds = parseExpiresIn(env.jwt.accessExpiresIn);
    const session = this.sessionRepository.create({
      utilisateurId: utilisateur.id,
      tokenHash: hashToken(accessToken),
      refreshTokenHash: hashToken(refreshToken),
      expireLe: getExpirationDate(expiresInSeconds),
      adresseIp,
      userAgent: userAgent || null,
      derniereActivite: new Date(),
    });
    await this.sessionRepository.save(session);

    logger.info(`Connexion reussie pour l'utilisateur ${utilisateur.id}`);

    return {
      accessToken,
      refreshToken,
      expiresIn: expiresInSeconds,
      utilisateur: {
        id: utilisateur.id,
        prenom: utilisateur.prenom,
        nom: utilisateur.nom,
        telephone1: utilisateur.telephone1,
        email: (utilisateur as any).email ?? null,
        estSuperAdmin: utilisateur.estSuperAdmin,
        doitChangerMotDePasse: utilisateur.doitChangerMotDePasse,
      },
      organisations,
    };
  }

  /**
   * Rafraichissement du token d'acces
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string; expiresIn: number }> {
    // Verification du refresh token
    let payload: JwtPayload;
    try {
      payload = verifyToken(refreshToken);
    } catch {
      throw new UnauthorizedError('Token de rafraichissement invalide');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedError('Type de token invalide');
    }

    // Verification que la session existe
    const refreshTokenHash = hashToken(refreshToken);
    const session = await this.sessionRepository.findOne({
      where: {
        utilisateurId: payload.sub,
        refreshTokenHash,
        estRevoquee: false,
      },
    });

    if (!session) {
      throw new UnauthorizedError('Session invalide ou expiree');
    }

    // Generation d'un nouveau access token
    const newAccessToken = generateAccessToken(payload.sub);
    const expiresInSeconds = parseExpiresIn(env.jwt.accessExpiresIn);

    // Mise a jour de la session
    session.tokenHash = hashToken(newAccessToken);
    session.expireLe = getExpirationDate(expiresInSeconds);
    session.derniereActivite = new Date();
    await this.sessionRepository.save(session);

    return {
      accessToken: newAccessToken,
      expiresIn: expiresInSeconds,
    };
  }

  /**
   * Deconnexion d'une session
   */
  async logout(
    utilisateurId: string,
    sessionId?: string,
    toutesLesSessions = false
  ): Promise<void> {
    if (toutesLesSessions) {
      // Revocation de toutes les sessions
      await this.sessionRepository.update(
        { utilisateurId, estRevoquee: false },
        { estRevoquee: true, revoqueeLe: new Date(), motifRevocation: 'LOGOUT_ALL' }
      );
      logger.info(`Toutes les sessions revoquees pour l'utilisateur ${utilisateurId}`);
    } else if (sessionId) {
      // Revocation d'une session specifique
      await this.sessionRepository.update(
        { id: sessionId, utilisateurId },
        { estRevoquee: true, revoqueeLe: new Date(), motifRevocation: 'LOGOUT' }
      );
    } else {
      // Aucun parametre fourni : revoquer toutes les sessions par defaut
      await this.sessionRepository.update(
        { utilisateurId, estRevoquee: false },
        { estRevoquee: true, revoqueeLe: new Date(), motifRevocation: 'LOGOUT' }
      );
      logger.info(
        `Sessions revoquees pour l'utilisateur ${utilisateurId} (aucun sessionId fourni)`
      );
    }
  }

  /**
   * Validation d'un access token
   */
  async validateAccessToken(accessToken: string): Promise<Utilisateur> {
    let payload: JwtPayload;
    try {
      payload = verifyToken(accessToken);
    } catch {
      throw new UnauthorizedError('Token invalide ou expire');
    }

    if (payload.type !== 'access') {
      throw new UnauthorizedError('Type de token invalide');
    }

    // Verification que la session n'est pas revoquee
    const tokenHash = hashToken(accessToken);
    const session = await this.sessionRepository.findOne({
      where: {
        tokenHash,
        estRevoquee: false,
      },
    });

    if (!session) {
      throw new UnauthorizedError('Session invalide ou revoquee');
    }

    // Recuperation de l'utilisateur
    const utilisateur = await this.utilisateurRepository.findOne({
      where: { id: payload.sub },
    });

    if (!utilisateur) {
      throw new UnauthorizedError('Utilisateur non trouve');
    }

    // Mise a jour de la derniere activite
    session.derniereActivite = new Date();
    await this.sessionRepository.save(session);

    return utilisateur;
  }

  /**
   * Liste des sessions actives d'un utilisateur
   */
  async getActiveSessions(utilisateurId: string): Promise<SessionUtilisateur[]> {
    return this.sessionRepository.find({
      where: {
        utilisateurId,
        estRevoquee: false,
      },
      order: { derniereActivite: 'DESC' },
    });
  }
}
