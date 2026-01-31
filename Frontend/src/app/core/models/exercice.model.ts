/**
 * Exercice Models
 */

export interface Exercice {
  id: string;
  tontineId: string;
  tontine?: {
    id: string;
    nom: string;
    nomCourt: string;
  };
  libelle: string;
  anneeDebut: number;
  anneeFin: number;
  moisDebut: number;
  moisFin: number;
  dureeMois: number;
  statut: StatutExercice;
  ouvertLe?: Date;
  fermeLe?: Date;
  creeLe: Date;
  modifieLe?: Date;
  nombreMembres?: number;
  nombreReunions?: number;
}

export enum StatutExercice {
  PLANIFIE = 'PLANIFIE',
  EN_COURS = 'EN_COURS',
  CLOTURE = 'CLOTURE',
  ANNULE = 'ANNULE',
}

export interface CreateExerciceDto {
  tontineId: string;
  libelle: string;
  anneeDebut: number;
  anneeFin: number;
  moisDebut: number;
  moisFin: number;
}

export interface UpdateExerciceDto {
  libelle?: string;
  moisFin?: number;
  anneeFin?: number;
}

export interface ExerciceMembre {
  id: string;
  exerciceId: string;
  adhesionTontineId: string;
  adhesionTontine?: AdhesionTontineResume;
  typeMembre: TypeMembre;
  moisEntree: number;
  dateEntreeExercice: Date;
  nombreParts: number;
  statut: StatutExerciceMembre;
  parrainExerciceMembreId?: string;
  creeLe: Date;
}

export interface AdhesionTontineResume {
  id: string;
  matricule?: string;
  utilisateur?: {
    id: string;
    prenom: string;
    nom: string;
    telephone1: string;
  };
}

export enum TypeMembre {
  ANCIEN = 'ANCIEN',
  NOUVEAU = 'NOUVEAU',
}

export enum StatutExerciceMembre {
  ACTIF = 'ACTIF',
  INACTIF = 'INACTIF',
}

export interface CreateExerciceMembreDto {
  exerciceId: string;
  adhesionTontineId: string;
  typeMembre?: TypeMembre;
  nombreParts?: number;
  parrainExerciceMembreId?: string;
}
