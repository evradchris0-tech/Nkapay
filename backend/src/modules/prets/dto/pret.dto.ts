/**
 * DTOs pour le module Pret
 */

import { StatutPret } from '../entities/pret.entity';

/**
 * DTO pour la demande d'un prêt
 */
export interface CreatePretDto {
  reunionId: string;
  exerciceMembreId: string;
  montantCapital: number;
  tauxInteret?: number;
  dureeMois: number;
  commentaire?: string;
}

/**
 * DTO pour l'approbation d'un prêt
 */
export interface ApprouverPretDto {
  approuveParExerciceMembreId: string;
  tauxInteret?: number;
  dureeMois?: number;
}

/**
 * DTO pour le refus d'un prêt
 */
export interface RefuserPretDto {
  rejeteParExerciceMembreId: string;
  motifRefus: string;
}

/**
 * DTO pour le décaissement d'un prêt
 */
export interface DecaisserPretDto {
  dateDecaissement?: string;
}

/**
 * DTO pour un remboursement de prêt
 */
export interface CreateRemboursementDto {
  pretId: string;
  reunionId: string;
  montantCapital: number;
  montantInteret?: number;
  transactionId?: string;
  commentaire?: string;
}

/**
 * DTO de réponse pour un prêt
 */
export interface PretResponseDto {
  id: string;
  reunionId: string;
  exerciceMembreId: string;
  exerciceMembre?: {
    id: string;
    utilisateurId: string;
    utilisateurNom?: string;
  };
  montantCapital: number;
  tauxInteret: number;
  montantInteret: number;
  montantTotalDu: number;
  dureeMois: number;
  statut: StatutPret;
  capitalRestant: number;
  dateDemande: Date;
  dateApprobation: Date | null;
  dateDecaissement: Date | null;
  dateEcheance: Date | null;
  dateSolde: Date | null;
  approuveParExerciceMembreId: string | null;
  motifRefus: string | null;
  commentaire: string | null;
  nombreRemboursements?: number;
  montantTotalRembourse?: number;
}

/**
 * DTO de réponse pour un remboursement
 */
export interface RemboursementPretResponseDto {
  id: string;
  pretId: string;
  reunionId: string;
  transactionId: string | null;
  montantCapital: number;
  montantInteret: number;
  montantTotal: number;
  dateRemboursement: Date;
  capitalRestantApres: number;
  commentaire: string | null;
}

/**
 * DTO pour la liste des prêts
 */
export interface PretsListResponseDto {
  prets: PretResponseDto[];
  total: number;
}

/**
 * DTO pour les filtres de recherche de prêts
 */
export interface PretFiltersDto {
  exerciceId?: string;
  exerciceMembreId?: string;
  statut?: StatutPret;
  dateDebut?: string;
  dateFin?: string;
}

/**
 * DTO pour le résumé des prêts
 */
export interface PretsSummaryDto {
  totalPrets: number;
  totalCapitalPrete: number;
  totalCapitalRestant: number;
  totalInterets: number;
  pretsEnCours: number;
  pretsSoldes: number;
  pretsEnDefaut: number;
}
