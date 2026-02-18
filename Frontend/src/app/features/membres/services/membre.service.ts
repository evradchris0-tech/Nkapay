import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ApiResponse, PaginatedResponse } from '../../../core/models/api-response.model';

export type RoleMembre = 'PRESIDENT' | 'VICE_PRESIDENT' | 'TRESORIER' | 'SECRETAIRE' | 'COMMISSAIRE' | 'MEMBRE';
export type StatutAdhesion = 'ACTIVE' | 'INACTIVE';

export interface Utilisateur {
  id: string;
  prenom: string;
  nom: string;
  telephone1: string;
  telephone2?: string;
  adresseResidence?: string;
  dateInscription: string;
}

export interface AdhesionTontine {
  id: string;
  tontineId: string;
  tontine?: { id: string; nom: string };
  utilisateurId: string;
  utilisateur?: Utilisateur;
  matricule: string;
  role: RoleMembre;
  statut: StatutAdhesion;
  dateAdhesionTontine: string;
  photo?: string;
  quartierResidence?: string;
  creeLe: string;
}

export interface ExerciceMembre {
  id: string;
  exerciceId: string;
  exercice?: { id: string; libelle: string };
  adhesionTontineId: string;
  adhesionTontine?: AdhesionTontine;
  matricule: string;
  ordreDistribution?: number;
  role: RoleMembre;
  estActif: boolean;
  dateAdhesion: string;
}

export interface CreateAdhesionDto {
  tontineId: string;
  utilisateurId: string;
  matricule: string;
  role?: RoleMembre;
  quartierResidence?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MembreService {
  private api = inject(ApiService);

  getAdhesionsByTontine(tontineId: string, params?: { 
    statut?: StatutAdhesion;
    role?: RoleMembre;
  }): Observable<ApiResponse<AdhesionTontine[]>> {
    return this.api.get<ApiResponse<AdhesionTontine[]>>(`/tontines/adhesions/tontine/${tontineId}`, params);
  }

  getAdhesionsByUser(utilisateurId: string): Observable<ApiResponse<AdhesionTontine[]>> {
    return this.api.get<ApiResponse<AdhesionTontine[]>>(`/tontines/adhesions/user/${utilisateurId}`);
  }

  getAdhesionById(id: string): Observable<ApiResponse<AdhesionTontine>> {
    return this.api.get<ApiResponse<AdhesionTontine>>(`/tontines/adhesions/${id}`);
  }

  createAdhesion(data: CreateAdhesionDto): Observable<ApiResponse<AdhesionTontine>> {
    return this.api.post<ApiResponse<AdhesionTontine>>('/tontines/adhesions', data);
  }

  updateAdhesion(id: string, data: Partial<CreateAdhesionDto>): Observable<ApiResponse<AdhesionTontine>> {
    return this.api.patch<ApiResponse<AdhesionTontine>>(`/tontines/adhesions/${id}`, data);
  }

  desactiverAdhesion(id: string): Observable<ApiResponse<AdhesionTontine>> {
    return this.api.post<ApiResponse<AdhesionTontine>>(`/tontines/adhesions/${id}/deactivate`, {});
  }

  reactiverAdhesion(id: string): Observable<ApiResponse<AdhesionTontine>> {
    return this.api.post<ApiResponse<AdhesionTontine>>(`/tontines/adhesions/${id}/reactivate`, {});
  }

  getExerciceMembres(params?: { 
    exerciceId?: string; 
    adhesionTontineId?: string;
    estActif?: boolean;
    page?: number; 
    limit?: number 
  }): Observable<PaginatedResponse<ExerciceMembre>> {
    return this.api.get<PaginatedResponse<ExerciceMembre>>('/exercices-membres', params);
  }

  getExerciceMembreById(id: string): Observable<ApiResponse<ExerciceMembre>> {
    return this.api.get<ApiResponse<ExerciceMembre>>(`/exercices-membres/${id}`);
  }

  inscrireMembreExercice(data: { exerciceId: string; adhesionTontineId: string; role?: RoleMembre }): Observable<ApiResponse<ExerciceMembre>> {
    return this.api.post<ApiResponse<ExerciceMembre>>('/exercices-membres', data);
  }

  updateExerciceMembre(id: string, data: { role?: RoleMembre; ordreDistribution?: number }): Observable<ApiResponse<ExerciceMembre>> {
    return this.api.patch<ApiResponse<ExerciceMembre>>(`/exercices-membres/${id}`, data);
  }

  desactiverExerciceMembre(id: string): Observable<ApiResponse<ExerciceMembre>> {
    return this.api.post<ApiResponse<ExerciceMembre>>(`/exercices-membres/${id}/desactiver`, {});
  }
}
