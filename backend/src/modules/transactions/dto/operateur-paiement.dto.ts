/**
 * DTOs pour OperateurPaiement
 */

export interface CreateOperateurPaiementDto {
  code: string;
  nom: string;
  logoUrl?: string;
  estActif?: boolean;
  configApi?: Record<string, any>;
  fraisFixe?: number;
  fraisPourcentage?: number;
}

export interface UpdateOperateurPaiementDto {
  nom?: string;
  logoUrl?: string;
  estActif?: boolean;
  configApi?: Record<string, any>;
  fraisFixe?: number;
  fraisPourcentage?: number;
}

export interface OperateurPaiementResponseDto {
  id: string;
  code: string;
  nom: string;
  logoUrl: string | null;
  estActif: boolean;
  fraisFixe: number;
  fraisPourcentage: number;
  creeLe: Date;
  modifieLe: Date | null;
}
