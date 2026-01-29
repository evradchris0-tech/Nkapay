/**
 * DTOs pour le module Transaction
 */

import { TypeTransaction, StatutTransaction, ModeCreationTransaction } from '../entities/transaction.entity';

/**
 * DTO pour la création d'une transaction
 */
export interface CreateTransactionDto {
  reunionId?: string;
  typeTransaction: TypeTransaction;
  exerciceMembreId?: string;
  projetId?: string;
  montant: number;
  description?: string;
  modeCreation?: ModeCreationTransaction;
  creeParUtilisateurId?: string;
  creeParExerciceMembreId?: string;
  autoSoumis?: boolean;
}

/**
 * DTO pour la mise à jour d'une transaction
 */
export interface UpdateTransactionDto {
  montant?: number;
  description?: string;
  projetId?: string;
}

/**
 * DTO pour la soumission d'une transaction
 */
export interface SoumettreTransactionDto {
  autoSoumis?: boolean;
}

/**
 * DTO pour la validation d'une transaction
 */
export interface ValiderTransactionDto {
  valideParExerciceMembreId: string;
}

/**
 * DTO pour le rejet d'une transaction
 */
export interface RejeterTransactionDto {
  rejeteParExerciceMembreId: string;
  motifRejet: string;
}

/**
 * DTO de réponse pour une transaction
 */
export interface TransactionResponseDto {
  id: string;
  reunionId: string | null;
  typeTransaction: TypeTransaction;
  exerciceMembreId: string | null;
  exerciceMembre?: {
    id: string;
    utilisateurId: string;
    utilisateurNom?: string;
  } | null;
  projetId: string | null;
  projet?: {
    id: string;
    nom: string;
  } | null;
  montant: number;
  reference: string;
  description: string | null;
  statut: StatutTransaction;
  modeCreation: ModeCreationTransaction;
  creeParUtilisateurId: string | null;
  creeParExerciceMembreId: string | null;
  creeLe: Date;
  soumisLe: Date | null;
  autoSoumis: boolean;
  valideLe: Date | null;
  valideParExerciceMembreId: string | null;
  rejeteLe: Date | null;
  rejeteParExerciceMembreId: string | null;
  motifRejet: string | null;
}

/**
 * DTO de réponse pour la liste des transactions
 */
export interface TransactionsListResponseDto {
  transactions: TransactionResponseDto[];
  total: number;
  page?: number;
  limit?: number;
}

/**
 * DTO pour les filtres de recherche de transactions
 */
export interface TransactionFiltersDto {
  reunionId?: string;
  exerciceId?: string;
  exerciceMembreId?: string;
  typeTransaction?: TypeTransaction;
  statut?: StatutTransaction;
  dateDebut?: string;
  dateFin?: string;
  page?: number;
  limit?: number;
}

/**
 * DTO pour le résumé des transactions
 */
export interface TransactionsSummaryDto {
  totalTransactions: number;
  totalMontant: number;
  parType: {
    type: TypeTransaction;
    count: number;
    montant: number;
  }[];
  parStatut: {
    statut: StatutTransaction;
    count: number;
    montant: number;
  }[];
}

/**
 * DTO pour la création d'une cotisation
 */
export interface CreateCotisationDto {
  reunionId: string;
  exerciceMembreId: string;
  montant: number;
  modeCreation?: ModeCreationTransaction;
  creeParExerciceMembreId?: string;
  autoSoumis?: boolean;
  description?: string;
}

/**
 * DTO pour la création d'une contribution au pot
 */
export interface CreatePotDto {
  reunionId: string;
  exerciceMembreId: string;
  montant: number;
  modeCreation?: ModeCreationTransaction;
  creeParExerciceMembreId?: string;
  autoSoumis?: boolean;
  description?: string;
}

/**
 * DTO pour les frais d'inscription
 */
export interface CreateInscriptionDto {
  exerciceMembreId: string;
  montant: number;
  modeCreation?: ModeCreationTransaction;
  creeParExerciceMembreId?: string;
  autoSoumis?: boolean;
}
