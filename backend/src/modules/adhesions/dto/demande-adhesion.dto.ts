/**
 * DTOs pour le module DemandeAdhesion
 */

import { StatutDemandeAdhesion } from '../entities/demande-adhesion.entity';

/**
 * DTO pour la creation d'une demande d'adhesion
 */
export interface CreateDemandeAdhesionDto {
  utilisateurId: string;
  tontineId: string;
  message?: string;
}

/**
 * DTO pour l'approbation d'une demande
 */
export interface ApprouverDemandeDto {
  traiteeParExerciceMembreId: string;
}

/**
 * DTO pour le refus d'une demande
 */
export interface RefuserDemandeDto {
  traiteeParExerciceMembreId: string;
  motifRefus: string;
}

/**
 * DTO de reponse pour une demande d'adhesion
 */
export interface DemandeAdhesionResponseDto {
  id: string;
  utilisateurId: string;
  utilisateur?: {
    id: string;
    nom: string;
    prenom: string;

    telephone: string;
  };
  tontineId: string;
  tontine?: {
    id: string;
    nom: string;
  };
  message: string | null;
  statut: StatutDemandeAdhesion;
  soumiseLe: Date;
  traiteeLe: Date | null;
  traiteeParExerciceMembreId: string | null;
  motifRefus: string | null;
}

/**
 * DTO pour la liste des demandes
 */
export interface DemandesAdhesionListResponseDto {
  demandes: DemandeAdhesionResponseDto[];
  total: number;
}

/**
 * DTO pour les filtres de recherche
 */
export interface DemandeAdhesionFiltersDto {
  tontineId?: string;
  utilisateurId?: string;
  statut?: StatutDemandeAdhesion;
  dateDebut?: string;
  dateFin?: string;
}

/**
 * DTO pour le resume des demandes
 */
export interface DemandesSummaryDto {
  totalDemandes: number;
  demandesSoumises: number;
  demandesEnCours: number;
  demandesApprouvees: number;
  demandesRefusees: number;
  demandesExpirees: number;
}
