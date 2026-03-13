/**
 * Service d'onboarding self-service
 * Crée atomiquement un utilisateur + une organisation + un MembreOrganisation
 */

import { AppDataSource } from '../../../config';
import { BadRequestError, ConflictError } from '../../../shared';
import { Utilisateur } from '../../utilisateurs/entities/utilisateur.entity';
import { Organisation } from '../entities/organisation.entity';
import { PlanAbonnement } from '../entities/plan-abonnement.entity';
import { MembreOrganisation, RoleOrganisation } from '../entities/membre-organisation.entity';
import { RegleOrganisation } from '../entities/regle-organisation.entity';
import { RuleDefinition } from '../../tontines/entities/rule-definition.entity';
import { RegisterOrganisationDto } from '../dto/organisation.dto';
import { hashPassword } from '../../auth/utils/password.util';
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  parseExpiresIn,
  getExpirationDate,
} from '../../auth/utils/jwt.util';
import { SessionUtilisateur } from '../../auth/entities/session-utilisateur.entity';
import { env } from '../../../config/env.config';
import { logger } from '../../../shared/utils/logger.util';

export class OnboardingService {
  /**
   * Enregistrement self-service : crée utilisateur + organisation + membre + règles par défaut
   * Tout est atomique dans une transaction DB
   */
  async registerOrganisation(
    dto: RegisterOrganisationDto,
    adresseIp: string,
    userAgent?: string
  ): Promise<{ accessToken: string; refreshToken: string; expiresIn: number; organisationId: string }> {
    return AppDataSource.transaction(async (manager) => {
      // ─── 1. Vérifications unicité ────────────────────────────────────────────
      const existingPhone = await manager.findOne(Utilisateur, {
        where: { telephone1: dto.telephone },
      });
      if (existingPhone) throw new ConflictError(`Le numéro "${dto.telephone}" est déjà utilisé`);

      const existingEmail = await manager.findOne(Utilisateur, {
        where: { email: dto.email } as any,
      });
      if (existingEmail) throw new ConflictError(`L'email "${dto.email}" est déjà utilisé`);

      const existingSlug = await manager.findOne(Organisation, {
        where: { slug: dto.slug },
      });
      if (existingSlug) throw new ConflictError(`Le slug "${dto.slug}" est déjà utilisé`);

      // ─── 2. Création de l'utilisateur ────────────────────────────────────────
      if (!dto.motDePasse || dto.motDePasse.length < 6) {
        throw new BadRequestError('Le mot de passe doit comporter au moins 6 caractères');
      }
      const passwordHash = await hashPassword(dto.motDePasse);

      const utilisateur = manager.create(Utilisateur, {
        prenom: dto.prenom,
        nom: dto.nom,
        telephone1: dto.telephone,
        email: dto.email,
        passwordHash,
        doitChangerMotDePasse: false,
        estSuperAdmin: false,
      } as any);
      await manager.save(utilisateur);

      // ─── 3. Résolution du plan ────────────────────────────────────────────────
      const planCode = dto.planCode ?? 'FREE';
      const plan = await manager.findOne(PlanAbonnement, { where: { code: planCode } });
      if (!plan) throw new BadRequestError(`Plan "${planCode}" introuvable`);

      // ─── 4. Création de l'organisation ───────────────────────────────────────
      const organisation = manager.create(Organisation, {
        nom: dto.nomOrganisation,
        slug: dto.slug,
        emailContact: dto.emailContact,
        planAbonnementId: plan.id,
        abonnementDebutLe: new Date(),
      });
      await manager.save(organisation);

      // ─── 5. Création du lien membre ORG_ADMIN ─────────────────────────────────
      const membre = manager.create(MembreOrganisation, {
        organisationId: organisation.id,
        utilisateurId: utilisateur.id,
        role: RoleOrganisation.ORG_ADMIN,
      });
      await manager.save(membre);

      // ─── 6. Seed des règles org par défaut ────────────────────────────────────
      const ruleDefs = await manager.find(RuleDefinition, {
        where: { estModifiableParOrganisation: true } as any,
      });
      for (const def of ruleDefs) {
        if (def.valeurDefaut) {
          await manager.save(
            manager.create(RegleOrganisation, {
              organisationId: organisation.id,
              ruleDefinitionId: def.id,
              valeur: def.valeurDefaut,
              estActive: true,
            })
          );
        }
      }

      // ─── 7. Génération des tokens et session ──────────────────────────────────
      const accessToken = generateAccessToken(utilisateur.id, {
        organisationId: organisation.id,
        orgRole: RoleOrganisation.ORG_ADMIN,
        estSuperAdmin: false,
      });
      const refreshToken = generateRefreshToken(utilisateur.id);
      const expiresInSeconds = parseExpiresIn(env.jwt.accessExpiresIn);

      const session = manager.create(SessionUtilisateur, {
        utilisateurId: utilisateur.id,
        tokenHash: hashToken(accessToken),
        refreshTokenHash: hashToken(refreshToken),
        expireLe: getExpirationDate(expiresInSeconds),
        adresseIp,
        userAgent: userAgent ?? null,
        derniereActivite: new Date(),
      });
      await manager.save(session);

      logger.info(`Onboarding réussi : org=${organisation.id} user=${utilisateur.id}`);

      return {
        accessToken,
        refreshToken,
        expiresIn: expiresInSeconds,
        organisationId: organisation.id,
      };
    });
  }
}

export const onboardingService = new OnboardingService();
