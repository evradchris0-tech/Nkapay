/**
 * Adhesion Models
 */

export interface AdhesionTontine {
  id: string;
  tontineId: string;
  utilisateurId: string;
  utilisateur?: {
    id: string;
    prenom: string;
    nom: string;
    telephone1: string;
  };
  tontine?: {
    id: string;
    nom: string;
    nomCourt: string;
  };
  matricule?: string;
  dateAdhesionTontine: Date;
  role: RoleTontine;
  photo?: string;
  quartierResidence?: string;
  statut: StatutAdhesion;
  creeLe: Date;
  modifieLe?: Date;
}

export enum RoleTontine {
  PRESIDENT = 'PRESIDENT',
  VICE_PRESIDENT = 'VICE_PRESIDENT',
  SECRETAIRE = 'SECRETAIRE',
  TRESORIER = 'TRESORIER',
  COMMISSAIRE = 'COMMISSAIRE',
  MEMBRE = 'MEMBRE',
}

export enum StatutAdhesion {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export interface CreateAdhesionDto {
  tontineId: string;
  utilisateurId: string;
  role?: RoleTontine;
  quartierResidence?: string;
}

export interface UpdateAdhesionDto {
  role?: RoleTontine;
  photo?: string;
  quartierResidence?: string;
}

export interface DemandeAdhesion {
  id: string;
  tontineId: string;
  utilisateurId: string;
  message?: string;
  statut: StatutDemandeAdhesion;
  traitéeLe?: Date;
  traiteeParExerciceMembreId?: string;
  motifRefus?: string;
  creeLe: Date;
}

export enum StatutDemandeAdhesion {
  EN_ATTENTE = 'EN_ATTENTE',
  APPROUVEE = 'APPROUVEE',
  REFUSEE = 'REFUSEE',
}
