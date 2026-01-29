/**
 * DTOs pour PaiementMobile
 */

import { StatutPaiementMobile, OperateurMobile } from '../entities/paiement-mobile.entity';

export interface CreatePaiementMobileDto {
  transactionId: string;
  operateur: OperateurMobile;
  numeroTelephone: string;
  montant: number;
}

export interface UpdatePaiementMobileDto {
  statut?: StatutPaiementMobile;
  referenceOperateur?: string;
  messageOperateur?: string;
}

export interface PaiementMobileResponseDto {
  id: string;
  transactionId: string;
  operateur: OperateurMobile;
  numeroTelephone: string;
  montant: number;
  statut: StatutPaiementMobile;
  referenceOperateur: string | null;
  messageOperateur: string | null;
  dateEnvoi: Date | null;
  dateConfirmation: Date | null;
  creeLe: Date;
}

export interface PaiementMobileFiltersDto {
  transactionId?: string;
  operateur?: OperateurMobile;
  statut?: StatutPaiementMobile;
  dateDebut?: Date;
  dateFin?: Date;
}
