/**
 * Reunion Models
 */

export interface Reunion {
  id: string;
  exerciceId: string;
  exercice?: {
    id: string;
    libelle: string;
    tontine?: {
      id: string;
      nom: string;
    };
  };
  numeroReunion: number;
  dateReunion: Date;
  heureDebut?: string;
  heureFin?: string;
  lieu?: string;
  ordreJour?: string;
  compteRendu?: string;
  statut: StatutReunion;
  hoteExerciceMembreId?: string;
  hote?: ExerciceMembreResume;
  clotureeLe?: Date;
  clotureeParExerciceMembreId?: string;
  creeLe: Date;
  modifieLe?: Date;
  nombrePresents?: number;
  nombreAbsents?: number;
}

export interface ExerciceMembreResume {
  id: string;
  adhesionTontine?: {
    matricule?: string;
    utilisateur?: {
      id: string;
      prenom: string;
      nom: string;
    };
  };
}

export enum StatutReunion {
  PLANIFIEE = 'PLANIFIEE',
  EN_COURS = 'EN_COURS',
  CLOTUREE = 'CLOTUREE',
  ANNULEE = 'ANNULEE',
}

export interface CreateReunionDto {
  exerciceId: string;
  dateReunion: Date;
  heureDebut?: string;
  lieu?: string;
  ordreJour?: string;
  hoteExerciceMembreId?: string;
}

export interface UpdateReunionDto {
  dateReunion?: Date;
  heureDebut?: string;
  heureFin?: string;
  lieu?: string;
  ordreJour?: string;
  compteRendu?: string;
  hoteExerciceMembreId?: string;
}

export interface PresenceReunion {
  id: string;
  reunionId: string;
  exerciceMembreId: string;
  exerciceMembre?: ExerciceMembreResume;
  estPresent: boolean;
  heureArrivee?: string;
  motifAbsence?: string;
  estExcuse: boolean;
  creeLe: Date;
  modifieLe?: Date;
}

export interface CreatePresenceDto {
  reunionId: string;
  exerciceMembreId: string;
  estPresent: boolean;
  heureArrivee?: string;
  motifAbsence?: string;
  estExcuse?: boolean;
}
