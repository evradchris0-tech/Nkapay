import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ApiResponse, PaginatedResponse } from '../../../core/models/api-response.model';

export type StatutDistribution = 'PLANIFIEE' | 'DISTRIBUEE' | 'ANNULEE';

export interface Distribution {
  id: string;
  reunionId: string;
  reunion?: { id: string; numeroReunion: number; dateReunion: string };
  exerciceMembreBeneficiaireId: string;
  exerciceMembreBeneficiaire?: { id: string; matricule: string; utilisateur?: { prenom: string; nom: string } };
  ordre: number;
  montantBrut: number;
  montantRetenu: number;
  montantNet: number;
  statut: StatutDistribution;
  transactionId?: string;
  creeLe: string;
  distribueeLe?: string;
  commentaire?: string;
}

export interface CreateDistributionDto {
  reunionId: string;
  exerciceMembreBeneficiaireId: string;
  ordre: number;
  montantBrut: number;
  montantRetenu?: number;
  commentaire?: string;
}

export interface DistributionSummary {
  totalDistributions: number;
  totalMontantBrut: number;
  totalMontantRetenu: number;
  totalMontantNet: number;
  distributionsPlanifiees: number;
  distributionsEffectuees: number;
}

@Injectable({
  providedIn: 'root'
})
export class DistributionService {
  private api = inject(ApiService);
  private basePath = '/distributions';

  getAll(params?: { 
    reunionId?: string; 
    exerciceId?: string;
    exerciceMembreId?: string; 
    statut?: StatutDistribution;
    page?: number; 
    limit?: number 
  }): Observable<PaginatedResponse<Distribution>> {
    return this.api.get<PaginatedResponse<Distribution>>(this.basePath, params);
  }

  getById(id: string): Observable<ApiResponse<Distribution>> {
    return this.api.get<ApiResponse<Distribution>>(`${this.basePath}/${id}`);
  }

  getByReunion(reunionId: string): Observable<ApiResponse<Distribution[]>> {
    return this.api.get<ApiResponse<Distribution[]>>(`${this.basePath}/reunion/${reunionId}`);
  }

  getSummary(params?: { exerciceId?: string }): Observable<ApiResponse<DistributionSummary>> {
    return this.api.get<ApiResponse<DistributionSummary>>(`${this.basePath}/summary`, params);
  }

  create(data: CreateDistributionDto): Observable<ApiResponse<Distribution>> {
    return this.api.post<ApiResponse<Distribution>>(this.basePath, data);
  }

  update(id: string, data: Partial<CreateDistributionDto>): Observable<ApiResponse<Distribution>> {
    return this.api.patch<ApiResponse<Distribution>>(`${this.basePath}/${id}`, data);
  }

  delete(id: string): Observable<ApiResponse<void>> {
    return this.api.delete<ApiResponse<void>>(`${this.basePath}/${id}`);
  }

  distribuer(id: string): Observable<ApiResponse<Distribution>> {
    return this.api.post<ApiResponse<Distribution>>(`${this.basePath}/${id}/distribuer`, {});
  }

  annuler(id: string): Observable<ApiResponse<Distribution>> {
    return this.api.post<ApiResponse<Distribution>>(`${this.basePath}/${id}/annuler`, {});
  }
}
