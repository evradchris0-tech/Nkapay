import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ApiResponse, PaginatedResponse } from '../../../core/models/api-response.model';

export type StatutExercice = 'BROUILLON' | 'OUVERT' | 'SUSPENDU' | 'FERME';
export type StatutExerciceMembre = 'ACTIF' | 'INACTIF';
export type TypeMembre = 'ORDINAIRE' | 'BENEFICIAIRE' | 'OBSERVATEUR';

export interface Exercice {
  id: string;
  tontineId: string;
  tontine?: { id: string; nom: string; nomCourt?: string };
  libelle: string;
  anneeDebut: number;
  moisDebut: number;
  anneeFin: number;
  moisFin: number;
  dureeMois: number;
  statut: StatutExercice;
  ouvertLe?: string;
  fermeLe?: string;
  creeLe: string;
  nombreMembres?: number;
  nombreReunions?: number;
}

export interface ExerciceMembre {
  id: string;
  exerciceId?: string;
  adhesionTontineId: string;
  adhesionTontine?: {
    id: string;
    matricule: string;
    utilisateur?: { id: string; nom: string; prenom: string };
  };
  typeMembre: TypeMembre;
  moisEntree: number;
  dateEntreeExercice: string;
  nombreParts: number;
  statut: StatutExerciceMembre;
  parrainExerciceMembreId?: string;
  parrain?: { id: string; matricule: string };
  creeLe: string;
}

export interface CreateExerciceDto {
  tontineId: string;
  libelle: string;
  anneeDebut: number;
  moisDebut: number;
  dureeMois: number;
}

export interface UpdateExerciceDto {
  libelle?: string;
  anneeDebut?: number;
  moisDebut?: number;
  dureeMois?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ExerciceService {
  private api = inject(ApiService);
  private basePath = '/exercices';

  getAll(params?: { tontineId?: string; statut?: string; page?: number; limit?: number }): Observable<PaginatedResponse<Exercice>> {
    return this.api.get<PaginatedResponse<Exercice>>(this.basePath, params);
  }

  getById(id: string): Observable<ApiResponse<Exercice>> {
    return this.api.get<ApiResponse<Exercice>>(`${this.basePath}/${id}`);
  }

  getExerciceOuvert(tontineId: string): Observable<ApiResponse<Exercice>> {
    return this.api.get<ApiResponse<Exercice>>(`${this.basePath}/tontine/${tontineId}/ouvert`);
  }

  getMembresExercice(exerciceId: string, params?: { typeMembre?: TypeMembre; statut?: StatutExerciceMembre }): Observable<PaginatedResponse<ExerciceMembre>> {
    return this.api.get<PaginatedResponse<ExerciceMembre>>(`/exercices-membres/exercice/${exerciceId}`, params);
  }

  create(data: CreateExerciceDto): Observable<ApiResponse<Exercice>> {
    return this.api.post<ApiResponse<Exercice>>(this.basePath, data);
  }

  update(id: string, data: UpdateExerciceDto): Observable<ApiResponse<Exercice>> {
    return this.api.patch<ApiResponse<Exercice>>(`${this.basePath}/${id}`, data);
  }

  delete(id: string): Observable<ApiResponse<void>> {
    return this.api.delete<ApiResponse<void>>(`${this.basePath}/${id}`);
  }

  // ─── State machine : BROUILLON → OUVERT ↔ SUSPENDU → FERME ──────────────

  ouvrir(id: string): Observable<ApiResponse<Exercice>> {
    return this.api.post<ApiResponse<Exercice>>(`${this.basePath}/${id}/ouvrir`, {});
  }

  suspendre(id: string): Observable<ApiResponse<Exercice>> {
    return this.api.post<ApiResponse<Exercice>>(`${this.basePath}/${id}/suspendre`, {});
  }

  reprendre(id: string): Observable<ApiResponse<Exercice>> {
    return this.api.post<ApiResponse<Exercice>>(`${this.basePath}/${id}/reprendre`, {});
  }

  fermer(id: string): Observable<ApiResponse<Exercice>> {
    return this.api.post<ApiResponse<Exercice>>(`${this.basePath}/${id}/fermer`, {});
  }
}
