/**
 * DTOs pour le module Penalite
 */

import { StatutPenalite } from '../entities/penalite.entity';

/**
 * DTO pour l'application d'une pénalité
 */
export interface CreatePenaliteDto {
  exerciceMembreId: string;
  reunionId?: string;
  typePenaliteId: string;
  montant: number;
  motif?: string;
  appliqueParExerciceMembreId?: string;
}

/**
 * DTO pour le paiement d'une pénalité
 */
export interface PayerPenaliteDto {
  transactionId: string;
}

/**
 * DTO pour l'annulation d'une pénalité
 */
export interface AnnulerPenaliteDto {
  motifAnnulation: string;
}

/**
 * DTO de réponse pour une pénalité
 */
export interface PenaliteResponseDto {
  id: string;
  exerciceMembreId: string;
  exerciceMembre?: {
    id: string;
    utilisateurId: string;
    utilisateurNom?: string;
  };
  reunionId: string | null;
  typePenaliteId: string;
  typePenalite?: {
    id: string;
    code: string;
    libelle: string;
  };
  montant: number;
  motif: string | null;
  statut: StatutPenalite;
  dateApplication: Date;
  appliqueParExerciceMembreId: string | null;
  transactionId: string | null;
  datePaiement: Date | null;
  dateAnnulation: Date | null;
  motifAnnulation: string | null;
}

/**
 * DTO pour la liste des pénalités
 */
export interface PenalitesListResponseDto {
  penalites: PenaliteResponseDto[];
  total: number;
}

/**
 * DTO pour les filtres de recherche
 */
export interface PenaliteFiltersDto {
  exerciceId?: string;
  exerciceMembreId?: string;
  reunionId?: string;
  typePenaliteId?: string;
  statut?: StatutPenalite;
  dateDebut?: string;
  dateFin?: string;
}

/**
 * DTO pour le résumé des pénalités
 */
export interface PenalitesSummaryDto {
  totalPenalites: number;
  totalMontant: number;
  totalMontantPaye: number;
  totalMontantEnAttente: number;
  penalitesEnAttente: number;
  penalitesPayees: number;
  penalitesAnnulees: number;
  penalitesPardonnees: number;
}
