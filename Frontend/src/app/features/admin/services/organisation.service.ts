import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ApiResponse } from '../../../core/models/api-response.model';

export type StatutOrganisation = 'ACTIVE' | 'SUSPENDUE' | 'EXPIREE';

export interface Organisation {
  id: string;
  nom: string;
  slug: string;
  emailContact: string;
  telephoneContact?: string;
  pays: string;
  devise: string;
  fuseauHoraire: string;
  logo?: string;
  statut: StatutOrganisation;
  planAbonnementId?: string;
  planCode: string;
  planLibelle: string;
  abonnementDebutLe?: string;
  abonnementFinLe?: string;
  creeLe: string;
  modifieLe?: string;
}

export interface PlanAbonnement {
  id: string;
  code: string;
  libelle: string;
  prixMensuel: number;
  maxTontines: number;
  maxMembres: number;
  fonctionnalites: Record<string, unknown>;
  estActif: boolean;
}

export interface CreateOrganisationDto {
  nom: string;
  slug: string;
  emailContact: string;
  telephoneContact?: string;
  pays?: string;
  devise?: string;
  fuseauHoraire?: string;
  planAbonnementId?: string;
}

@Injectable({ providedIn: 'root' })
export class OrganisationService {
  private api      = inject(ApiService);
  private basePath = '/admin/organisations';

  getAll(): Observable<ApiResponse<Organisation[]>> {
    return this.api.get<ApiResponse<Organisation[]>>(this.basePath);
  }

  getById(id: string): Observable<ApiResponse<Organisation>> {
    return this.api.get<ApiResponse<Organisation>>(`${this.basePath}/${id}`);
  }

  create(data: CreateOrganisationDto): Observable<ApiResponse<Organisation>> {
    return this.api.post<ApiResponse<Organisation>>(this.basePath, data);
  }

  suspendre(id: string): Observable<ApiResponse<Organisation>> {
    return this.api.patch<ApiResponse<Organisation>>(`${this.basePath}/${id}/suspendre`, {});
  }

  reactiver(id: string): Observable<ApiResponse<Organisation>> {
    return this.api.patch<ApiResponse<Organisation>>(`${this.basePath}/${id}/reactiver`, {});
  }

  getPlans(): Observable<ApiResponse<PlanAbonnement[]>> {
    return this.api.get<ApiResponse<PlanAbonnement[]>>('/admin/plans');
  }
}
