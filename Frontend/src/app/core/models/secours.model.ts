/**
 * Secours Models
 */

export interface EvenementSecours {
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
  typeEvenementSecoursId: string;
  typeEvenement?: TypeEvenementSecours;
  dateEvenement: Date;
  description?: string;
  montantDemande?: number;
  montantApprouve?: number;
  dateValidation?: Date;
  valideParExerciceMembreId?: string;
  transactionId?: string;
  motifRefus?: string;
  statut: StatutEvenementSecours;
  creeLe: Date;
  modifieLe?: Date;
}

export interface TypeEvenementSecours {
  id: string;
  tontineId?: string;
  code: string;
  libelle: string;
  description?: string;
  montantDefaut?: number;
  estActif: boolean;
}

export enum StatutEvenementSecours {
  DECLARE = 'DECLARE',
  VALIDE = 'VALIDE',
  REFUSE = 'REFUSE',
  PAYE = 'PAYE',
}

export interface CreateEvenementSecoursDto {
  exerciceMembreId: string;
  typeEvenementSecoursId: string;
  dateEvenement: Date;
  description?: string;
  montantDemande?: number;
}

export interface SecoursDuAnnuel {
  id: string;
  exerciceMembreId: string;
  exercice?: {
    id: string;
    libelle: string;
  };
  montantDu: number;
  montantPaye: number;
  montantRestant: number;
  estSolde: boolean;
}

export interface BilanSecoursExercice {
  id: string;
  exerciceId: string;
  totalCotisations: number;
  totalVersements: number;
  solde: number;
  calculeLe: Date;
}
