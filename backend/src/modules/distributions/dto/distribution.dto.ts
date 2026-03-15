/**
 * DTOs pour le module Distribution
 */

import { StatutDistribution } from '../entities/distribution.entity';

/**
 * DTO pour la creation d'une distribution
 */
export interface CreateDistributionDto {
  reunionId: string;
  exerciceMembreBeneficiaireId: string;
  ordre: number;
  montantBrut: number;
  montantRetenu?: number;
  commentaire?: string;
}

/**
 * DTO pour la mise a jour d'une distribution
 */
export interface UpdateDistributionDto {
  ordre?: number;
  montantBrut?: number;
  montantRetenu?: number;
  commentaire?: string;
}

/**
 * DTO pour effectuer une distribution
 */
export interface DistribuerDto {
  transactionId?: string;
}

/**
 * DTO de reponse pour une distribution
 */
export interface DistributionResponseDto {
  id: string;
  reunionId: string;
  exerciceMembreBeneficiaireId: string;
  exerciceMembreBeneficiaire?: {
    id: string;
    utilisateurId: string;
    utilisateurNom?: string;
  };
  ordre: number;
  montantBrut: number;
  montantRetenu: number;
  montantNet: number;
  statut: StatutDistribution;
  transactionId: string | null;
  creeLe: Date;
  distribueeLe: Date | null;
  commentaire: string | null;
}

/**
 * DTO pour la liste des distributions
 */
export interface DistributionsListResponseDto {
  distributions: DistributionResponseDto[];
  total: number;
}

/**
 * DTO pour les filtres de recherche
 */
export interface DistributionFiltersDto {
  reunionId?: string;
  exerciceId?: string;
  exerciceMembreId?: string;
  statut?: StatutDistribution;
}

/**
 * DTO pour le resume des distributions
 */
export interface DistributionsSummaryDto {
  totalDistributions: number;
  totalMontantBrut: number;
  totalMontantRetenu: number;
  totalMontantNet: number;
  distributionsPlanifiees: number;
  distributionsEffectuees: number;
  distributionsAnnulees: number;
}
