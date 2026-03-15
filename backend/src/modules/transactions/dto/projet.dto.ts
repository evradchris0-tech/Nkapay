/**
 * DTOs pour Projet
 */

export interface CreateProjetDto {
  exerciceId: string;
  nom: string;
  description?: string;
  budgetPrevu?: number;
  creeParExerciceMembreId: string;
}

export interface UpdateProjetDto {
  nom?: string;
  description?: string;
  budgetPrevu?: number;
  statut?: string;
}

export interface ProjetResponseDto {
  id: string;
  exerciceId: string;
  nom: string;
  description: string | null;
  budgetPrevu: number | null;
  statut: string;
  creeParExerciceMembreId: string;
  creeLe: Date;
  clotureLe: Date | null;
}

export interface ProjetFiltersDto {
  exerciceId?: string;
  statut?: string;
}
