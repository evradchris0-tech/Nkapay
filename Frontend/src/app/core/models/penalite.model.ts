/**
 * Penalite Models
 */

export interface Penalite {
  id: string;
  exerciceMembreId: string;
  exerciceMembre?: {
    id: string;
    adhesionTontine?: {
      matricule?: string;
      utilisateur?: {
        id: string;
        prenom: string;
        nom: string;
      };
    };
  };
  typePenaliteId: string;
  typePenalite?: TypePenalite;
  reunionId?: string;
  reunion?: {
    id: string;
    numeroReunion: number;
    dateReunion: Date;
  };
  montant: number;
  motif?: string;
  dateApplication: Date;
  appliqueParExerciceMembreId?: string;
  transactionId?: string;
  statut: StatutPenalite;
  creeLe: Date;
  modifieLe?: Date;
}

export interface TypePenalite {
  id: string;
  tontineId?: string;
  code: string;
  libelle: string;
  description?: string;
  montantFixe?: number;
  tauxPourcentage?: number;
  estActif: boolean;
}

export enum StatutPenalite {
  APPLIQUEE = 'APPLIQUEE',
  PAYEE = 'PAYEE',
  PARDONNEE = 'PARDONNEE',
}

export interface CreatePenaliteDto {
  exerciceMembreId: string;
  typePenaliteId: string;
  reunionId?: string;
  montant: number;
  motif?: string;
}

export interface CreateTypePenaliteDto {
  tontineId?: string;
  code: string;
  libelle: string;
  description?: string;
  montantFixe?: number;
  tauxPourcentage?: number;
}
