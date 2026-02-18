import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ApiResponse, PaginatedResponse } from '../../../core/models/api-response.model';

export type StatutPret = 'DEMANDE' | 'APPROUVE' | 'REFUSE' | 'DECAISSE' | 'EN_COURS' | 'SOLDE' | 'DEFAUT';

export interface Pret {
  id: string;
  reunionId: string;
  reunion?: { id: string; numeroReunion: number; dateReunion: string };
  exerciceMembreId: string;
  exerciceMembre?: { id: string; matricule: string; utilisateur?: { prenom: string; nom: string } };
  montantCapital: number;
  tauxInteret: number;
  montantInteret: number;
  montantTotalDu: number;
  dureeMois: number;
  statut: StatutPret;
  capitalRestant: number;
  dateDemande: string;
  dateApprobation?: string;
  dateDecaissement?: string;
  dateEcheance?: string;
  dateSolde?: string;
  motifRefus?: string;
  commentaire?: string;
}

export interface CreatePretDto {
  reunionId: string;
  exerciceMembreId: string;
  montantCapital: number;
  tauxInteret?: number;
  dureeMois: number;
  commentaire?: string;
}

export interface PretSummary {
  totalPrets: number;
  totalCapital: number;
  totalInterets: number;
  totalRembourse: number;
  totalRestant: number;
  pretsEnCours: number;
  pretsSoldes: number;
  pretsEnDefaut: number;
}

@Injectable({
  providedIn: 'root'
})
export class PretService {
  private api = inject(ApiService);
  private basePath = '/prets';

  getAll(params?: { 
    exerciceId?: string; 
    exerciceMembreId?: string; 
    statut?: StatutPret;
    dateDebut?: string;
    dateFin?: string;
    page?: number; 
    limit?: number 
  }): Observable<PaginatedResponse<Pret>> {
    return this.api.get<PaginatedResponse<Pret>>(this.basePath, params);
  }

  getById(id: string): Observable<ApiResponse<Pret>> {
    return this.api.get<ApiResponse<Pret>>(`${this.basePath}/${id}`);
  }

  getSummary(params?: { exerciceId?: string }): Observable<ApiResponse<PretSummary>> {
    return this.api.get<ApiResponse<PretSummary>>(`${this.basePath}/summary`, params);
  }

  create(data: CreatePretDto): Observable<ApiResponse<Pret>> {
    return this.api.post<ApiResponse<Pret>>(this.basePath, data);
  }

  approuver(id: string, approuveParExerciceMembreId: string): Observable<ApiResponse<Pret>> {
    return this.api.post<ApiResponse<Pret>>(`${this.basePath}/${id}/approuver`, { approuveParExerciceMembreId });
  }

  refuser(id: string, data: { motifRefus: string }): Observable<ApiResponse<Pret>> {
    return this.api.post<ApiResponse<Pret>>(`${this.basePath}/${id}/refuser`, data);
  }

  decaisser(id: string): Observable<ApiResponse<Pret>> {
    return this.api.post<ApiResponse<Pret>>(`${this.basePath}/${id}/decaisser`, {});
  }

  solder(id: string): Observable<ApiResponse<Pret>> {
    return this.api.post<ApiResponse<Pret>>(`${this.basePath}/${id}/solder`, {});
  }

  mettreEnDefaut(id: string): Observable<ApiResponse<Pret>> {
    return this.api.post<ApiResponse<Pret>>(`${this.basePath}/${id}/defaut`, {});
  }
}
