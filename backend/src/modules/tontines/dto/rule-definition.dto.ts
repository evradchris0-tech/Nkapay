/**
 * DTOs pour RuleDefinition
 */

import { TypeValeurRegle, CategorieRegle } from '../entities/rule-definition.entity';

export interface CreateRuleDefinitionDto {
  cle: string;
  libelle: string;
  typeValeur: TypeValeurRegle;
  valeurDefaut?: string;
  valeurMin?: string;
  valeurMax?: string;
  unite?: string;
  estObligatoire?: boolean;
  estModifiableParTontine?: boolean;
  estModifiableParExercice?: boolean;
  categorie: CategorieRegle;
  description?: string;
  ordreAffichage?: number;
}

export interface UpdateRuleDefinitionDto {
  libelle?: string;
  valeurDefaut?: string;
  valeurMin?: string;
  valeurMax?: string;
  unite?: string;
  estObligatoire?: boolean;
  estModifiableParTontine?: boolean;
  estModifiableParExercice?: boolean;
  description?: string;
  ordreAffichage?: number;
}

export interface RuleDefinitionResponseDto {
  id: string;
  cle: string;
  libelle: string;
  typeValeur: TypeValeurRegle;
  valeurDefaut: string | null;
  valeurMin: string | null;
  valeurMax: string | null;
  unite: string | null;
  estObligatoire: boolean;
  estModifiableParTontine: boolean;
  estModifiableParExercice: boolean;
  categorie: CategorieRegle;
  description: string | null;
  ordreAffichage: number;
  creeLe: Date;
}

export interface RuleDefinitionFiltersDto {
  categorie?: CategorieRegle;
  typeValeur?: TypeValeurRegle;
  estObligatoire?: boolean;
}
