import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ApiResponse, PaginatedResponse } from '../../../core/models/api-response.model';
import { Tontine, CreateTontineDto, TontineStats, TontineType as TontineTypeModel, RegleTontine } from '../../../core/models/tontine.model';

export interface TontineTypeBackend {
  id: string;
  code: string;
  libelle: string;
  description?: string;
  estActif: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TontineService {
  private api = inject(ApiService);
  private basePath = '/tontines';

  getTontineTypes(): Observable<ApiResponse<TontineTypeBackend[]>> {
    return this.api.get<ApiResponse<TontineTypeBackend[]>>(`${this.basePath}/types`);
  }

  getAll(params?: { page?: number; limit?: number; search?: string; type?: string; estPublique?: boolean }): Observable<PaginatedResponse<Tontine>> {
    return this.api.get<PaginatedResponse<Tontine>>(this.basePath, params);
  }

  searchPublic(params?: { page?: number; limit?: number; search?: string; type?: string }): Observable<PaginatedResponse<Tontine>> {
    return this.api.get<PaginatedResponse<Tontine>>(`${this.basePath}/public`, params);
  }

  getById(id: string): Observable<ApiResponse<Tontine>> {
    return this.api.get<ApiResponse<Tontine>>(`${this.basePath}/${id}`);
  }

  create(data: CreateTontineDto): Observable<ApiResponse<Tontine>> {
    return this.api.post<ApiResponse<Tontine>>(this.basePath, data);
  }

  update(id: string, data: Partial<CreateTontineDto>): Observable<ApiResponse<Tontine>> {
    return this.api.patch<ApiResponse<Tontine>>(`${this.basePath}/${id}`, data);
  }

  delete(id: string): Observable<ApiResponse<void>> {
    return this.api.delete<ApiResponse<void>>(`${this.basePath}/${id}`);
  }

  getStats(id: string): Observable<ApiResponse<TontineStats>> {
    return this.api.get<ApiResponse<TontineStats>>(`${this.basePath}/${id}/stats`);
  }

  getMembres(id: string): Observable<ApiResponse<any[]>> {
    return this.api.get<ApiResponse<any[]>>(`${this.basePath}/${id}/membres`);
  }

  getRegles(tontineId: string): Observable<ApiResponse<RegleTontine[]>> {
    return this.api.get<ApiResponse<RegleTontine[]>>(`${this.basePath}/regles-tontine/tontine/${tontineId}`);
  }

  addRegle(regle: { tontineId: string; ruleDefinitionId: string; valeur: string }): Observable<ApiResponse<RegleTontine>> {
    return this.api.post<ApiResponse<RegleTontine>>(`${this.basePath}/regles-tontine`, regle);
  }

  updateRegle(regleId: string, data: Partial<RegleTontine>): Observable<ApiResponse<RegleTontine>> {
    return this.api.put<ApiResponse<RegleTontine>>(`${this.basePath}/regles-tontine/${regleId}`, data);
  }

  deleteRegle(regleId: string): Observable<ApiResponse<void>> {
    return this.api.delete<ApiResponse<void>>(`${this.basePath}/regles-tontine/${regleId}`);
  }

  exportPdf(id: string, type: 'fiche' | 'membres' | 'cotisations' | 'prets'): Observable<Blob> {
    return this.api.download(`/exports/tontines/${id}/${type}`);
  }
}
