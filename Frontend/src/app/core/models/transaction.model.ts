/**
 * Transaction Models
 */

export interface Transaction {
  id: string;
  exerciceId?: string;
  reunionId?: string;
  exerciceMembreId?: string;
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
  reference?: string;
  typeTransaction: TypeTransaction;
  montant: number;
  description?: string;
  statut: StatutTransaction;
  creeParUtilisateurId?: string;
  creeParExerciceMembreId?: string;
  valideLe?: Date;
  valideParExerciceMembreId?: string;
  rejeteLe?: Date;
  rejeteParExerciceMembreId?: string;
  motifRejet?: string;
  creeLe: Date;
  modifieLe?: Date;
}

export enum TypeTransaction {
  COTISATION = 'COTISATION',
  EPARGNE = 'EPARGNE',
  INSCRIPTION = 'INSCRIPTION',
  PENALITE = 'PENALITE',
  PRET_DEBOURSE = 'PRET_DEBOURSE',
  PRET_REMBOURSEMENT = 'PRET_REMBOURSEMENT',
  SECOURS = 'SECOURS',
  DISTRIBUTION_POT = 'DISTRIBUTION_POT',
  DISTRIBUTION_EPARGNE = 'DISTRIBUTION_EPARGNE',
  PROJET_CONTRIBUTION = 'PROJET_CONTRIBUTION',
  AUTRE = 'AUTRE',
}

export enum StatutTransaction {
  EN_ATTENTE = 'EN_ATTENTE',
  VALIDE = 'VALIDE',
  REJETE = 'REJETE',
  ANNULE = 'ANNULE',
}

export interface CreateTransactionDto {
  reunionId?: string;
  exerciceMembreId: string;
  typeTransaction: TypeTransaction;
  montant: number;
  description?: string;
}

export interface CotisationDue {
  id: string;
  exerciceMembreId: string;
  exerciceMembre?: {
    adhesionTontine?: {
      matricule?: string;
      utilisateur?: {
        prenom: string;
        nom: string;
      };
    };
  };
  mois: number;
  annee: number;
  montantDu: number;
  montantPaye: number;
  montantRestant: number;
  estSolde: boolean;
}

export interface PotDuMensuel {
  id: string;
  exerciceId: string;
  mois: number;
  annee: number;
  montantTotal: number;
  nombreCotisations: number;
  estDistribue: boolean;
  distribueLe?: Date;
}
