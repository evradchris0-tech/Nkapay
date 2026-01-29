/**
 * DTOs pour Exercice
 */

import { StatutExercice } from '../entities/exercice.entity';

export interface CreateExerciceDto {
  tontineId: string;
  libelle: string;
  anneeDebut: number;
  moisDebut: number;
  anneeFin: number;
  moisFin: number;
  dureeMois: number;
}

export interface UpdateExerciceDto {
  libelle?: string;
  anneeDebut?: number;
  moisDebut?: number;
  anneeFin?: number;
  moisFin?: number;
  dureeMois?: number;
}

export interface OuvrirExerciceDto {
  adhesionIds?: string[]; // IDs des adhesions tontine a inclure automatiquement
}

export interface FermerExerciceDto {
  // Rien de special, juste ferme l'exercice
}

export interface ExerciceResponseDto {
  id: string;
  tontine: {
    id: string;
    nom: string;
    nomCourt: string;
  };
  libelle: string;
  anneeDebut: number;
  moisDebut: number;
  anneeFin: number;
  moisFin: number;
  dureeMois: number;
  statut: StatutExercice;
  ouvertLe: Date | null;
  fermeLe: Date | null;
  nombreMembres: number;
  nombreReunions: number;
  creeLe: Date;
  modifieLe: Date | null;
}

export interface ExerciceListItemDto {
  id: string;
  libelle: string;
  anneeDebut: number;
  moisDebut: number;
  anneeFin: number;
  moisFin: number;
  statut: StatutExercice;
  nombreMembres: number;
}

export interface ExerciceFiltersDto {
  tontineId?: string;
  statut?: StatutExercice;
  annee?: number;
}
