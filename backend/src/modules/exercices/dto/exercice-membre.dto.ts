/**
 * DTOs pour ExerciceMembre
 */

import { TypeMembre, StatutExerciceMembre } from '../entities/exercice-membre.entity';

export interface CreateExerciceMembreDto {
  exerciceId: string;
  adhesionTontineId: string;
  typeMembre: TypeMembre;
  moisEntree?: number;
  dateEntreeExercice: Date;
  nombreParts?: number;
  parrainExerciceMembreId?: string;
}

export interface UpdateExerciceMembreDto {
  typeMembre?: TypeMembre;
  moisEntree?: number;
  nombreParts?: number;
  statut?: StatutExerciceMembre;
  parrainExerciceMembreId?: string;
}

export interface ExerciceMembreResponseDto {
  id: string;
  exercice: {
    id: string;
    libelle: string;
  };
  adhesionTontine: {
    id: string;
    matricule: string;
    utilisateur: {
      id: string;
      nom: string;
      prenom: string;
    };
  };
  typeMembre: TypeMembre;
  moisEntree: number;
  dateEntreeExercice: Date;
  nombreParts: number;
  statut: StatutExerciceMembre;
  parrain: {
    id: string;
    matricule: string;
  } | null;
  creeLe: Date;
  modifieLe: Date | null;
}

export interface ExerciceMembreListItemDto {
  id: string;
  matricule: string;
  nomComplet: string;
  typeMembre: TypeMembre;
  nombreParts: number;
  statut: StatutExerciceMembre;
}

export interface ExerciceMembreFiltersDto {
  exerciceId?: string;
  adhesionTontineId?: string;
  typeMembre?: TypeMembre;
  statut?: StatutExerciceMembre;
  estActif?: boolean | string;
}
