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
  INSCRIPTION = 'INSCRIPTION',
  COTISATION = 'COTISATION',
  POT = 'POT',
  SECOURS = 'SECOURS',
  EPARGNE = 'EPARGNE',
  DECAISSEMENT_PRET = 'DECAISSEMENT_PRET',
  REMBOURSEMENT_PRET = 'REMBOURSEMENT_PRET',
  DEPENSE_SECOURS = 'DEPENSE_SECOURS',
  PENALITE = 'PENALITE',
  PROJET = 'PROJET',
  AUTRE = 'AUTRE',
}

export enum StatutTransaction {
  BROUILLON = 'BROUILLON',
  SOUMIS = 'SOUMIS',
  VALIDE = 'VALIDE',
  REJETE = 'REJETE',
  ANNULE = 'ANNULE',
  EXPIRE = 'EXPIRE',
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
