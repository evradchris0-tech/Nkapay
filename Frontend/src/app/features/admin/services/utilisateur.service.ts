import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ApiResponse, PaginatedResponse } from '../../../core/models/api-response.model';
import { Utilisateur, CreateUtilisateurDto, UpdateUtilisateurDto } from '../../../core/models/user.model';

export interface UtilisateurFilters {
  page?: number;
  limit?: number;
  search?: string;
}

export interface ResetPasswordDto {
  nouveauMotDePasse: string;
}

@Injectable({
  providedIn: 'root'
})
export class UtilisateurService {
  private api = inject(ApiService);
  private readonly endpoint = '/utilisateurs';

  getAll(filters?: UtilisateurFilters): Observable<PaginatedResponse<Utilisateur>> {
    const params: Record<string, string | number | boolean> = {};
    if (filters?.page) params['page'] = filters.page;
    if (filters?.limit) params['limit'] = filters.limit;
    if (filters?.search) params['search'] = filters.search;
    
    return this.api.get<PaginatedResponse<Utilisateur>>(this.endpoint, params);
  }

  getById(id: string): Observable<ApiResponse<Utilisateur>> {
    return this.api.get<ApiResponse<Utilisateur>>(`${this.endpoint}/${id}`);
  }

  create(data: CreateUtilisateurDto): Observable<ApiResponse<Utilisateur>> {
    return this.api.post<ApiResponse<Utilisateur>>(this.endpoint, data);
  }

  update(id: string, data: UpdateUtilisateurDto): Observable<ApiResponse<Utilisateur>> {
    return this.api.put<ApiResponse<Utilisateur>>(`${this.endpoint}/${id}`, data);
  }

  delete(id: string): Observable<ApiResponse<void>> {
    return this.api.delete<ApiResponse<void>>(`${this.endpoint}/${id}`);
  }

  resetPassword(id: string, data: ResetPasswordDto): Observable<ApiResponse<void>> {
    return this.api.patch<ApiResponse<void>>(`${this.endpoint}/${id}/password`, {
      ancienMotDePasse: '',
      nouveauMotDePasse: data.nouveauMotDePasse,
      confirmationMotDePasse: data.nouveauMotDePasse
    });
  }
}
