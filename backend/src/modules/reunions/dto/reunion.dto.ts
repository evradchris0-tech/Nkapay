/**
 * DTOs pour le module Reunion
 */

import { StatutReunion } from '../entities/reunion.entity';

/**
 * DTO pour la planification d'une réunion
 */
export interface PlanifierReunionDto {
  exerciceId: string;
  numeroReunion: number;
  dateReunion: string; // Format YYYY-MM-DD
  heureDebut?: string; // Format HH:mm
  lieu?: string;
  hoteExerciceMembreId?: string;
}

/**
 * DTO pour la mise à jour d'une réunion
 */
export interface UpdateReunionDto {
  dateReunion?: string;
  heureDebut?: string;
  lieu?: string;
  hoteExerciceMembreId?: string;
}

/**
 * DTO pour l'ouverture d'une réunion
 */
export interface OuvrirReunionDto {
  heureDebut?: string;
}

/**
 * DTO pour la clôture d'une réunion
 */
export interface CloturerReunionDto {
  clotureeParExerciceMembreId: string;
}

/**
 * DTO de réponse pour une réunion
 */
export interface ReunionResponseDto {
  id: string;
  exerciceId: string;
  numeroReunion: number;
  dateReunion: string;
  heureDebut: string | null;
  lieu: string | null;
  hoteExerciceMembreId: string | null;
  hote?: {
    id: string;
    utilisateurId: string;
    utilisateurNom?: string;
  } | null;
  statut: StatutReunion;
  ouverteLe: Date | null;
  clotureeLe: Date | null;
  clotureeParExerciceMembreId: string | null;
  creeLe: Date;
  modifieLe: Date | null;
  nombrePresents?: number;
  nombreAbsents?: number;
}

/**
 * DTO de réponse pour la liste des réunions
 */
export interface ReunionsListResponseDto {
  reunions: ReunionResponseDto[];
  total: number;
}

/**
 * DTO pour les filtres de recherche de réunions
 */
export interface ReunionFiltersDto {
  exerciceId?: string;
  statut?: StatutReunion;
  dateDebut?: string;
  dateFin?: string;
}
