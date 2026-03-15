/**
 * Distribution Models
 */

export interface Distribution {
  id: string;
  exerciceId: string;
  reunionId?: string;
  reunion?: {
    id: string;
    numeroReunion: number;
    dateReunion: Date;
  };
  exerciceMembreBeneficiaireId: string;
  beneficiaire?: {
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
  typeDistribution: TypeDistribution;
  montantBrut: number;
  montantDeductions: number;
  montantNet: number;
  transactionId?: string;
  statut: StatutDistribution;
  distribueLe?: Date;
  creeLe: Date;
  modifieLe?: Date;
}

export enum TypeDistribution {
  POT = 'POT',
  EPARGNE = 'EPARGNE',
  CASSATION = 'CASSATION',
}

export enum StatutDistribution {
  PLANIFIEE = 'PLANIFIEE',
  DISTRIBUEE = 'DISTRIBUEE',
  ANNULEE = 'ANNULEE',
}

export interface CreateDistributionDto {
  exerciceId: string;
  reunionId?: string;
  exerciceMembreBeneficiaireId: string;
  typeDistribution: TypeDistribution;
  montantBrut: number;
  montantDeductions?: number;
}

export interface Cassation {
  id: string;
  exerciceMembreId: string;
  exerciceMembre?: {
    id: string;
    adhesionTontine?: {
      matricule?: string;
      utilisateur?: {
        prenom: string;
        nom: string;
      };
    };
  };
  montantEpargne: number;
  montantDeductions: number;
  montantNet: number;
  detailDeductions?: Record<string, number>;
  transactionId?: string;
  distribuéeLe?: Date;
  commentaire?: string;
  creeLe: Date;
}

export interface CreateCassationDto {
  exerciceMembreId: string;
  montantDeductions?: number;
  detailDeductions?: Record<string, number>;
  commentaire?: string;
}
