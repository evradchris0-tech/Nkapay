/**
 * DTOs pour le module Secours (Événements de secours)
 *
 * Workflow CAYA:
 * - Create → Soumettre → Valider/Refuser → Décaisser (automatique) ou Payer (manuel)
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
  reunionId?: string; // Réunion lors de laquelle l'événement est déclaré
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
 * DTO pour le paiement manuel (lien vers transaction existante)
 */
export interface PayerEvenementSecoursDto {
  transactionId: string;
}

/**
 * DTO pour le décaissement automatisé (crée la transaction + met à jour le bilan)
 */
export interface DecaisserEvenementSecoursDto {
  decaisseParExerciceMembreId: string; // Trésorier qui effectue le décaissement
  reunionId?: string; // Réunion lors de laquelle le décaissement est fait
  seuilAlerteFonds?: number; // Seuil en dessous duquel un renflouement est suggéré
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
  montantDecaisse: number | null;
  statut: StatutEvenementSecours;
  dateDeclaration: Date;
  dateValidation: Date | null;
  dateDecaissement: Date | null;
  valideParExerciceMembreId: string | null;
  transactionId: string | null;
  reunionId: string | null;
  motifRefus: string | null;
  piecesJustificatives: {
    id: string;
    typePiece: string;
    nomFichier: string;
    creeLe: Date;
  }[];
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
  soldeFonds?: number; // Solde actuel du fonds de secours
}

/**
 * DTO pour les informations de renflouement
 */
export interface RenflouementInfoDto {
  exerciceId: string;
  soldeFondsActuel: number;
  montantCible: number;
  deficit: number;
  membresActifs: number;
  montantParMembre: number;
  estNecessaire: boolean;
}
