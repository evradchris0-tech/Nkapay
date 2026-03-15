import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ApiResponse, PaginatedResponse } from '../../../core/models/api-response.model';

export interface Reunion {
  id: string;
  exerciceId: string;
  exercice?: { id: string; libelle: string; tontine?: { id: string; nom: string } };
  numeroReunion: number;
  dateReunion: string;
  heureDebut?: string;
  lieu?: string;
  hoteExerciceMembreId?: string;
  hote?: { id: string; matricule: string; utilisateur?: { prenom: string; nom: string } };
  statut: 'PLANIFIEE' | 'OUVERTE' | 'CLOTUREE' | 'ANNULEE';
  ouverteLe?: string;
  clotureeLe?: string;
  creeLe: string;
  nombrePresents?: number;
  nombreAbsents?: number;
}

export interface PlanifierReunionDto {
  exerciceId: string;
  numeroReunion: number;
  dateReunion: string;
  heureDebut?: string;
  lieu?: string;
  hoteExerciceMembreId?: string;
}

export interface UpdateReunionDto {
  dateReunion?: string;
  heureDebut?: string;
  lieu?: string;
  hoteExerciceMembreId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReunionService {
  private api = inject(ApiService);
  private basePath = '/reunions';

  getAll(params?: { exerciceId?: string; statut?: string; page?: number; limit?: number }): Observable<PaginatedResponse<Reunion>> {
    return this.api.get<PaginatedResponse<Reunion>>(this.basePath, params);
  }

  getById(id: string): Observable<ApiResponse<Reunion>> {
    return this.api.get<ApiResponse<Reunion>>(`${this.basePath}/${id}`);
  }

  planifier(data: PlanifierReunionDto): Observable<ApiResponse<Reunion>> {
    return this.api.post<ApiResponse<Reunion>>(this.basePath, data);
  }

  update(id: string, data: UpdateReunionDto): Observable<ApiResponse<Reunion>> {
    return this.api.patch<ApiResponse<Reunion>>(`${this.basePath}/${id}`, data);
  }

  delete(id: string): Observable<ApiResponse<void>> {
    return this.api.delete<ApiResponse<void>>(`${this.basePath}/${id}`);
  }

  ouvrir(id: string): Observable<ApiResponse<Reunion>> {
    return this.api.post<ApiResponse<Reunion>>(`${this.basePath}/${id}/ouvrir`, {});
  }

  cloturer(id: string, clotureeParExerciceMembreId: string): Observable<ApiResponse<Reunion>> {
    return this.api.post<ApiResponse<Reunion>>(`${this.basePath}/${id}/cloturer`, { clotureeParExerciceMembreId });
  }

  annuler(id: string): Observable<ApiResponse<Reunion>> {
    return this.api.post<ApiResponse<Reunion>>(`${this.basePath}/${id}/annuler`, {});
  }
}
