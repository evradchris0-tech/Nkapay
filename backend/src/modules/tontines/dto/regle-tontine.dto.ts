/**
 * DTOs pour RegleTontine
 */

export interface CreateRegleTontineDto {
  tontineId: string;
  ruleDefinitionId: string;
  valeur: string;
  modifieParAdhesionTontineId?: string;
}

export interface UpdateRegleTontineDto {
  valeur?: string;
  estActive?: boolean;
  modifieParAdhesionTontineId?: string;
}

export interface RegleTontineResponseDto {
  id: string;
  tontineId: string;
  ruleDefinitionId: string;
  ruleDefinition?: {
    id: string;
    cle: string;
    libelle: string;
    typeValeur: string;
    categorie: string;
  };
  valeur: string;
  estActive: boolean;
  modifieLe: Date;
  modifieParAdhesionTontineId: string | null;
  creeLe: Date;
}

export interface RegleTontineFiltersDto {
  tontineId?: string;
  categorie?: string;
  estActive?: boolean;
}
