import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ApiResponse, PaginatedResponse } from '../../../core/models/api-response.model';

export type StatutPenalite = 'EN_ATTENTE' | 'PAYEE' | 'ANNULEE' | 'PARDONNEE';

export interface TypePenalite {
  id: string;
  code: string;
  libelle: string;
  montantDefaut: number;
  estActif: boolean;
}

export interface Penalite {
  id: string;
  exerciceMembreId: string;
  exerciceMembre?: { id: string; matricule: string; utilisateur?: { prenom: string; nom: string } };
  reunionId?: string;
  reunion?: { id: string; numeroReunion: number; dateReunion: string };
  typePenaliteId: string;
  typePenalite?: TypePenalite;
  montant: number;
  motif?: string;
  statut: StatutPenalite;
  dateApplication: string;
  datePaiement?: string;
  dateAnnulation?: string;
  motifAnnulation?: string;
}

export interface CreatePenaliteDto {
  exerciceMembreId: string;
  reunionId?: string;
  typePenaliteId: string;
  montant: number;
  motif?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PenaliteService {
  private api = inject(ApiService);
  private basePath = '/penalites';

  getAll(params?: { 
    exerciceMembreId?: string; 
    reunionId?: string;
    typePenaliteId?: string;
    statut?: StatutPenalite;
    page?: number; 
    limit?: number 
  }): Observable<PaginatedResponse<Penalite>> {
    return this.api.get<PaginatedResponse<Penalite>>(this.basePath, params);
  }

  getById(id: string): Observable<ApiResponse<Penalite>> {
    return this.api.get<ApiResponse<Penalite>>(`${this.basePath}/${id}`);
  }

  create(data: CreatePenaliteDto): Observable<ApiResponse<Penalite>> {
    return this.api.post<ApiResponse<Penalite>>(this.basePath, data);
  }

  payer(id: string, transactionId?: string): Observable<ApiResponse<Penalite>> {
    return this.api.post<ApiResponse<Penalite>>(`${this.basePath}/${id}/payer`, { transactionId });
  }

  annuler(id: string, motifAnnulation: string): Observable<ApiResponse<Penalite>> {
    return this.api.post<ApiResponse<Penalite>>(`${this.basePath}/${id}/annuler`, { motifAnnulation });
  }

  pardonner(id: string): Observable<ApiResponse<Penalite>> {
    return this.api.post<ApiResponse<Penalite>>(`${this.basePath}/${id}/pardonner`, {});
  }

  getTypes(): Observable<ApiResponse<TypePenalite[]>> {
    return this.api.get<ApiResponse<TypePenalite[]>>('/types-penalite');
  }
}
