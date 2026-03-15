/**
 * Pret Models
 */

export interface Pret {
  id: string;
  exerciceMembreId: string;
  exerciceMembre?: {
    id: string;
    adhesionTontine?: {
      matricule?: string;
      utilisateur?: {
        prenom: string;
        nom: string;
        telephone1?: string;
      };
    };
  };
  montantCapital: number;
  tauxInteret: number;
  montantInteret: number;
  montantTotalDu: number;
  capitalRestant: number;
  interetRestant: number;
  nombreEcheances: number;
  montantEcheance: number;
  dateDemande: Date;
  dateApprobation?: Date;
  approuveParExerciceMembreId?: string;
  dateDeblocage?: Date;
  dateEcheance?: Date;
  motif?: string;
  statut: StatutPret;
  creeLe: Date;
  modifieLe?: Date;
  remboursements?: RemboursementPret[];
}

export enum StatutPret {
  DEMANDE = 'DEMANDE',
  APPROUVE = 'APPROUVE',
  REJETE = 'REJETE',
  EN_COURS = 'EN_COURS',
  SOLDE = 'SOLDE',
  DEFAUT = 'DEFAUT',
}

export interface CreatePretDto {
  reunionId: string;
  exerciceMembreId: string;
  montantCapital: number;
  tauxInteret?: number;
  dureeMois: number;
  commentaire?: string;
}

export interface RemboursementPret {
  id: string;
  pretId: string;
  transactionId?: string;
  montant: number;
  montantCapital: number;
  montantInteret: number;
  dateRemboursement: Date;
  creeLe: Date;
}

export interface CreateRemboursementDto {
  pretId: string;
  montant: number;
  reunionId?: string;
}
