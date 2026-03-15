/**
 * DTOs pour le module PresenceReunion
 */

/**
 * DTO pour l'enregistrement d'une présence
 */
export interface CreatePresenceReunionDto {
  reunionId: string;
  exerciceMembreId: string;
  estPresent: boolean;
  estEnRetard?: boolean;
  heureArrivee?: string; // Format HH:mm
  note?: string;
}

/**
 * DTO pour l'enregistrement de plusieurs présences en une fois
 */
export interface CreatePresencesBulkDto {
  reunionId: string;
  presences: {
    exerciceMembreId: string;
    estPresent: boolean;
    estEnRetard?: boolean;
    heureArrivee?: string;
    note?: string;
  }[];
}

/**
 * DTO pour la mise à jour d'une présence
 */
export interface UpdatePresenceReunionDto {
  estPresent?: boolean;
  estEnRetard?: boolean;
  heureArrivee?: string;
  note?: string;
}

/**
 * DTO de réponse pour une présence
 */
export interface PresenceReunionResponseDto {
  id: string;
  reunionId: string;
  exerciceMembreId: string;
  exerciceMembre?: {
    id: string;
    utilisateurId: string;
    utilisateurNom?: string;
    ordreDistribution?: number;
  };
  estPresent: boolean;
  estEnRetard: boolean;
  heureArrivee: string | null;
  note: string | null;
  creeLe: Date;
  modifieLe: Date | null;
}

/**
 * DTO pour le résumé des présences d'une réunion
 */
export interface PresenceReunionSummaryDto {
  reunionId: string;
  totalMembres: number;
  presents: number;
  absents: number;
  enRetard: number;
  tauxPresence: number; // Pourcentage
}
