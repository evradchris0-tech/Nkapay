/**
 * DTOs pour BilanSecoursExercice et SecoursDuAnnuel
 */

import { StatutDu } from '../../transactions/entities/inscription-due-exercice.entity';

// --- BilanSecoursExercice ---
export interface BilanSecoursExerciceResponseDto {
  id: string;
  exerciceId: string;
  soldeInitial: number;
  totalCotisations: number;
  totalDepenses: number;
  soldeFinal: number;
  nombreEvenements: number;
  creeLe: Date;
}

export interface UpdateBilanSecoursDto {
  soldeInitial?: number;
  totalCotisations?: number;
  totalDepenses?: number;
}

// --- SecoursDuAnnuel ---
export interface SecoursDuAnnuelResponseDto {
  id: string;
  exerciceMembreId: string;
  montantDu: number;
  montantPaye: number;
  soldeRestant: number;
  statut: StatutDu;
  creeLe: Date;
}

export interface SecoursDuFiltersDto {
  exerciceMembreId?: string;
  statut?: StatutDu;
}
