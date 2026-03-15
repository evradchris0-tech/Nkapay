/**
 * DTOs pour les Dues (CotisationDue, PotDu, InscriptionDue)
 */

import { StatutDu } from '../entities/inscription-due-exercice.entity';

// --- CotisationDueMensuelle ---
export interface CotisationDueResponseDto {
  id: string;
  reunionId: string;
  exerciceMembreId: string;
  montantDu: number;
  montantPaye: number;
  soldeRestant: number;
  statut: StatutDu;
  creeLe: Date;
}

// --- PotDuMensuel ---
export interface PotDuMensuelResponseDto {
  id: string;
  reunionId: string;
  exerciceMembreId: string;
  montantDu: number;
  montantPaye: number;
  soldeRestant: number;
  statut: StatutDu;
  creeLe: Date;
}

// --- InscriptionDueExercice ---
export interface InscriptionDueResponseDto {
  id: string;
  exerciceMembreId: string;
  montantDu: number;
  montantPaye: number;
  soldeRestant: number;
  statut: StatutDu;
  creeLe: Date;
}

// --- Filtres communs ---
export interface DueFiltersDto {
  exerciceMembreId?: string;
  reunionId?: string;
  statut?: StatutDu;
}

// --- DTO de mise à jour du paiement ---
export interface UpdateDuePaymentDto {
  montantPaye: number;
}
