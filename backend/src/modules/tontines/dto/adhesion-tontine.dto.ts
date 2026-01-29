/**
 * DTOs pour AdhesionTontine
 */

import { RoleMembre, StatutAdhesion } from '../entities/adhesion-tontine.entity';

export interface CreateAdhesionDto {
  tontineId: string;
  utilisateurId: string;
  matricule: string;
  role?: RoleMembre;
  dateAdhesionTontine?: Date;
  photo?: string;
  quartierResidence?: string;
}

export interface UpdateAdhesionDto {
  matricule?: string;
  role?: RoleMembre;
  statut?: StatutAdhesion;
  photo?: string;
  quartierResidence?: string;
}

export interface AdhesionResponseDto {
  id: string;
  tontine: {
    id: string;
    nom: string;
    nomCourt: string;
  };
  utilisateur: {
    id: string;
    nom: string;
    prenom: string;
    telephone1: string;
  };
  matricule: string;
  role: RoleMembre;
  statut: StatutAdhesion;
  dateAdhesionTontine: Date;
  photo: string | null;
  quartierResidence: string | null;
  creeLe: Date;
  modifieLe: Date | null;
}

export interface AdhesionListItemDto {
  id: string;
  utilisateur: {
    id: string;
    nom: string;
    prenom: string;
  };
  matricule: string;
  role: RoleMembre;
  statut: StatutAdhesion;
  dateAdhesionTontine: Date;
}

export interface AdhesionFiltersDto {
  tontineId?: string;
  role?: RoleMembre;
  statut?: StatutAdhesion;
}
