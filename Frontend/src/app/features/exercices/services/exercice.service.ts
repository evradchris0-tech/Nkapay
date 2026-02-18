import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ApiResponse, PaginatedResponse } from '../../../core/models/api-response.model';

export interface Exercice {
  id: string;
  tontineId: string;
  tontine?: { id: string; nom: string };
  libelle: string;
  anneeDebut: number;
  moisDebut: number;
  anneeFin: number;
  moisFin: number;
  dureeMois: number;
  statut: 'BROUILLON' | 'OUVERT' | 'SUSPENDU' | 'FERME';
  ouvertLe?: string;
  fermeLe?: string;
  creeLe: string;
  nombreMembres?: number;
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

  create(data: CreateExerciceDto): Observable<ApiResponse<Exercice>> {
    return this.api.post<ApiResponse<Exercice>>(this.basePath, data);
  }

  update(id: string, data: UpdateExerciceDto): Observable<ApiResponse<Exercice>> {
    return this.api.patch<ApiResponse<Exercice>>(`${this.basePath}/${id}`, data);
  }

  delete(id: string): Observable<ApiResponse<void>> {
    return this.api.delete<ApiResponse<void>>(`${this.basePath}/${id}`);
  }

  ouvrir(id: string, dateOuverture?: string): Observable<ApiResponse<Exercice>> {
    return this.api.post<ApiResponse<Exercice>>(`${this.basePath}/${id}/ouvrir`, { dateOuverture });
  }

  fermer(id: string): Observable<ApiResponse<Exercice>> {
    return this.api.post<ApiResponse<Exercice>>(`${this.basePath}/${id}/fermer`, {});
  }

  suspendre(id: string): Observable<ApiResponse<Exercice>> {
    return this.api.post<ApiResponse<Exercice>>(`${this.basePath}/${id}/suspendre`, {});
  }

  reprendre(id: string): Observable<ApiResponse<Exercice>> {
    return this.api.post<ApiResponse<Exercice>>(`${this.basePath}/${id}/reprendre`, {});
  }
}
