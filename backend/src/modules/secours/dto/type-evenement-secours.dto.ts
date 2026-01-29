/**
 * DTOs pour TypeEvenementSecours
 */

export interface CreateTypeEvenementSecoursDto {
  code: string;
  libelle: string;
  description?: string;
  montantParDefaut?: number;
  ordreAffichage?: number;
  estActif?: boolean;
}

export interface UpdateTypeEvenementSecoursDto {
  libelle?: string;
  description?: string;
  montantParDefaut?: number;
  ordreAffichage?: number;
  estActif?: boolean;
}

export interface TypeEvenementSecoursResponseDto {
  id: string;
  code: string;
  libelle: string;
  description: string | null;
  montantParDefaut: number | null;
  ordreAffichage: number;
  estActif: boolean;
  creeLe: Date;
}
