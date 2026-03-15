/**
 * DTOs pour TypePenalite
 */

import { ModeCalculPenalite } from '../entities/type-penalite.entity';

export interface CreateTypePenaliteDto {
  code: string;
  libelle: string;
  description?: string;
  modeCalcul: ModeCalculPenalite;
  valeurDefaut?: number;
  estActif?: boolean;
}

export interface UpdateTypePenaliteDto {
  libelle?: string;
  description?: string;
  modeCalcul?: ModeCalculPenalite;
  valeurDefaut?: number;
  estActif?: boolean;
}

export interface TypePenaliteResponseDto {
  id: string;
  code: string;
  libelle: string;
  description: string | null;
  modeCalcul: ModeCalculPenalite;
  valeurDefaut: number | null;
  estActif: boolean;
  creeLe: Date;
}
