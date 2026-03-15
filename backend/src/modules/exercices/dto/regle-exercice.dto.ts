/**
 * DTOs pour RegleExercice
 */

export interface CreateRegleExerciceDto {
  exerciceId: string;
  ruleDefinitionId: string;
  valeur: string;
  modifieParExerciceMembreId?: string;
}

export interface UpdateRegleExerciceDto {
  valeur?: string;
  estSurchargee?: boolean;
  modifieParExerciceMembreId?: string;
}

export interface RegleExerciceResponseDto {
  id: string;
  exerciceId: string;
  ruleDefinitionId: string;
  ruleDefinition?: {
    id: string;
    cle: string;
    libelle: string;
    typeValeur: string;
    categorie: string;
  };
  valeur: string;
  estSurchargee: boolean;
  modifieLe: Date;
  modifieParExerciceMembreId: string | null;
  creeLe: Date;
}

export interface RegleExerciceFiltersDto {
  exerciceId?: string;
  categorie?: string;
  estSurchargee?: boolean;
}
