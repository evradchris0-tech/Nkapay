/**
 * DTOs pour Tontine
 */

import { StatutTontine } from '../entities/tontine.entity';

export interface CreateTontineDto {
  nom: string;
  nomCourt: string;
  tontineTypeId: string;
  anneeFondation?: number;
  motto?: string;
  logo?: string;
  estOfficiellementDeclaree?: boolean;
  numeroEnregistrement?: string;
  documentStatuts?: string;
}

export interface UpdateTontineDto {
  nom?: string;
  nomCourt?: string;
  anneeFondation?: number;
  motto?: string;
  logo?: string;
  estOfficiellementDeclaree?: boolean;
  numeroEnregistrement?: string;
  documentStatuts?: string;
  statut?: StatutTontine;
}

export interface TontineResponseDto {
  id: string;
  nom: string;
  nomCourt: string;
  anneeFondation: number | null;
  motto: string | null;
  logo: string | null;
  estOfficiellementDeclaree: boolean;
  numeroEnregistrement: string | null;
  statut: StatutTontine;
  tontineType: {
    id: string;
    code: string;
    libelle: string;
  };
  documentStatuts: string | null;
  creeLe: Date;
  modifieLe: Date | null;
  nombreMembres?: number;
  nombreExercices?: number;
}

export interface TontineFiltersDto {
  statut?: StatutTontine;
  search?: string;        // recherche dans nom OU nomCourt
  tontineTypeId?: string;
  organisationId?: string;
}

export interface TontineListItemDto {
  id: string;
  nom: string;
  nomCourt: string;
  statut: StatutTontine;
  tontineType: {
    id: string;
    code: string;
    libelle: string;
  };
  nombreMembres: number;
  exerciceActif: {
    id: string;
    libelle: string;
  } | null;
}
