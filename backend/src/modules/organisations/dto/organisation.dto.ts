import { StatutOrganisation } from '../entities/organisation.entity';
import { RoleOrganisation } from '../entities/membre-organisation.entity';

// ─── Création organisation ───────────────────────────────────────────────────

export interface CreateOrganisationDto {
  nom: string;
  slug: string;
  emailContact: string;
  telephoneContact?: string;
  pays?: string;
  devise?: string;
  fuseauHoraire?: string;
  planAbonnementId?: string;
}

// ─── Mise à jour organisation ────────────────────────────────────────────────

export interface UpdateOrganisationDto {
  nom?: string;
  emailContact?: string;
  telephoneContact?: string;
  pays?: string;
  devise?: string;
  fuseauHoraire?: string;
  logo?: string;
}

// ─── Réponse organisation ────────────────────────────────────────────────────

export interface OrganisationResponseDto {
  id: string;
  nom: string;
  slug: string;
  emailContact: string;
  telephoneContact: string | null;
  pays: string;
  devise: string;
  fuseauHoraire: string;
  logo: string | null;
  statut: StatutOrganisation;
  planAbonnementId: string | null;
  planCode?: string;
  planLibelle?: string;
  abonnementDebutLe: Date | null;
  abonnementFinLe: Date | null;
  creeLe: Date;
  modifieLe: Date | null;
}

// ─── Invitations ─────────────────────────────────────────────────────────────

export interface CreateInvitationDto {
  email: string;
  telephone?: string;
  rolePropose?: RoleOrganisation.ORG_ADMIN | RoleOrganisation.ORG_MEMBRE;
}

// ─── Membres organisation ────────────────────────────────────────────────────

export interface MembreOrganisationResponseDto {
  id: string;
  utilisateurId: string;
  prenom: string;
  nom: string;
  telephone1: string;
  email: string | null;
  role: RoleOrganisation;
  statut: string;
  creeLe: Date;
}

export interface UpdateMembreRoleDto {
  role: RoleOrganisation;
}

// ─── Règles organisation ──────────────────────────────────────────────────────

export interface SetRegleOrganisationDto {
  ruleDefinitionId: string;
  valeur: string;
}

export interface RegleOrganisationResponseDto {
  id: string;
  ruleDefinitionId: string;
  cle: string;
  libelle: string;
  typeValeur: string;
  valeur: string;
  estActive: boolean;
  modifieLe: Date | null;
}

// ─── Onboarding self-service ──────────────────────────────────────────────────

export interface RegisterOrganisationDto {
  // Données org
  nomOrganisation: string;
  slug: string;
  emailContact: string;
  planCode?: string;
  // Données admin (créateur)
  prenom: string;
  nom: string;
  telephone: string;
  email: string;
  motDePasse: string;
}
