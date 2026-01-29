/**
 * DTOs pour le module Secours (Événements de secours)
 */

import { StatutEvenementSecours } from '../entities/evenement-secours.entity';

/**
 * DTO pour la déclaration d'un événement de secours
 */
export interface CreateEvenementSecoursDto {
  exerciceMembreId: string;
  typeEvenementSecoursId: string;
  dateEvenement: string; // Format YYYY-MM-DD
  description?: string;
  montantDemande?: number;
}

/**
 * DTO pour la validation d'un événement de secours
 */
export interface ValiderEvenementSecoursDto {
  valideParExerciceMembreId: string;
  montantApprouve: number;
}

/**
 * DTO pour le refus d'un événement de secours
 */
export interface RefuserEvenementSecoursDto {
  refuseParExerciceMembreId: string;
  motifRefus: string;
}

/**
 * DTO pour le paiement d'un événement de secours
 */
export interface PayerEvenementSecoursDto {
  transactionId: string;
}

/**
 * DTO de réponse pour un événement de secours
 */
export interface EvenementSecoursResponseDto {
  id: string;
  exerciceMembreId: string;
  exerciceMembre?: {
    id: string;
    utilisateurId: string;
    utilisateurNom?: string;
  };
  typeEvenementSecoursId: string;
  typeEvenementSecours?: {
    id: string;
    code: string;
    libelle: string;
    montantParDefaut?: number;
  };
  dateEvenement: string;
  description: string | null;
  montantDemande: number | null;
  montantApprouve: number | null;
  statut: StatutEvenementSecours;
  dateDeclaration: Date;
  dateValidation: Date | null;
  valideParExerciceMembreId: string | null;
  transactionId: string | null;
  motifRefus: string | null;
}

/**
 * DTO pour la liste des événements de secours
 */
export interface EvenementsSecoursListResponseDto {
  evenements: EvenementSecoursResponseDto[];
  total: number;
}

/**
 * DTO pour les filtres de recherche
 */
export interface EvenementSecoursFiltersDto {
  exerciceId?: string;
  exerciceMembreId?: string;
  typeEvenementSecoursId?: string;
  statut?: StatutEvenementSecours;
  dateDebut?: string;
  dateFin?: string;
}

/**
 * DTO pour le résumé des secours
 */
export interface SecoursSummaryDto {
  totalEvenements: number;
  totalMontantDemande: number;
  totalMontantApprouve: number;
  totalMontantPaye: number;
  evenementsEnAttente: number;
  evenementsValides: number;
  evenementsPaues: number;
  evenementsRefuses: number;
}
