import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ApiResponse, PaginatedResponse } from '../../../core/models/api-response.model';

export type TypeTransaction = 
  | 'INSCRIPTION' | 'COTISATION' | 'POT' | 'SECOURS' | 'EPARGNE'
  | 'DECAISSEMENT_PRET' | 'REMBOURSEMENT_PRET' | 'DEPENSE_SECOURS'
  | 'PENALITE' | 'PROJET' | 'AUTRE';

export type StatutTransaction = 'BROUILLON' | 'SOUMIS' | 'VALIDE' | 'REJETE' | 'ANNULE' | 'EXPIRE';

export interface Transaction {
  id: string;
  reunionId?: string;
  reunion?: { id: string; numeroReunion: number; dateReunion: string };
  typeTransaction: TypeTransaction;
  exerciceMembreId?: string;
  exerciceMembre?: { id: string; matricule: string; utilisateur?: { prenom: string; nom: string } };
  montant: number;
  reference: string;
  description?: string;
  statut: StatutTransaction;
  creeLe: string;
  soumisLe?: string;
  valideLe?: string;
  rejeteLe?: string;
}

export interface CreateTransactionDto {
  reunionId?: string;
  typeTransaction: TypeTransaction;
  exerciceMembreId?: string;
  projetId?: string;
  montant: number;
  description?: string;
  modeCreation?: 'MANUEL' | 'MOBILE' | 'IMPORT' | 'AUTOMATIQUE';
  creeParExerciceMembreId?: string;
  autoSoumis?: boolean;
}

export interface CreateCotisationDto {
  reunionId: string;
  exerciceMembreId: string;
  montant: number;
  description?: string;
  modeCreation?: string;
  creeParExerciceMembreId?: string;
  autoSoumis?: boolean;
}

export interface TransactionSummary {
  totalCotisations: number;
  totalPot: number;
  totalInscriptions: number;
  nombreTransactions: number;
}

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private api = inject(ApiService);
  private basePath = '/transactions';

  getAll(params?: { 
    reunionId?: string; 
    exerciceMembreId?: string; 
    typeTransaction?: TypeTransaction;
    statut?: StatutTransaction;
    page?: number; 
    limit?: number 
  }): Observable<PaginatedResponse<Transaction>> {
    return this.api.get<PaginatedResponse<Transaction>>(this.basePath, params);
  }

  getById(id: string): Observable<ApiResponse<Transaction>> {
    return this.api.get<ApiResponse<Transaction>>(`${this.basePath}/${id}`);
  }

  getByReference(reference: string): Observable<ApiResponse<Transaction>> {
    return this.api.get<ApiResponse<Transaction>>(`${this.basePath}/reference/${reference}`);
  }

  getSummary(params?: { reunionId?: string; exerciceId?: string }): Observable<ApiResponse<TransactionSummary>> {
    return this.api.get<ApiResponse<TransactionSummary>>(`${this.basePath}/summary`, params);
  }

  create(data: CreateTransactionDto): Observable<ApiResponse<Transaction>> {
    return this.api.post<ApiResponse<Transaction>>(this.basePath, data);
  }

  createCotisation(data: CreateCotisationDto): Observable<ApiResponse<Transaction>> {
    return this.api.post<ApiResponse<Transaction>>(`${this.basePath}/cotisation`, data);
  }

  createPot(data: CreateCotisationDto): Observable<ApiResponse<Transaction>> {
    return this.api.post<ApiResponse<Transaction>>(`${this.basePath}/pot`, data);
  }

  createInscription(data: { exerciceMembreId: string; montant: number }): Observable<ApiResponse<Transaction>> {
    return this.api.post<ApiResponse<Transaction>>(`${this.basePath}/inscription`, data);
  }

  update(id: string, data: Partial<CreateTransactionDto>): Observable<ApiResponse<Transaction>> {
    return this.api.patch<ApiResponse<Transaction>>(`${this.basePath}/${id}`, data);
  }

  delete(id: string): Observable<ApiResponse<void>> {
    return this.api.delete<ApiResponse<void>>(`${this.basePath}/${id}`);
  }

  soumettre(id: string): Observable<ApiResponse<Transaction>> {
    return this.api.post<ApiResponse<Transaction>>(`${this.basePath}/${id}/soumettre`, {});
  }

  valider(id: string, valideParExerciceMembreId: string): Observable<ApiResponse<Transaction>> {
    return this.api.post<ApiResponse<Transaction>>(`${this.basePath}/${id}/valider`, { valideParExerciceMembreId });
  }

  rejeter(id: string, data: { rejeteParExerciceMembreId: string; motifRejet: string }): Observable<ApiResponse<Transaction>> {
    return this.api.post<ApiResponse<Transaction>>(`${this.basePath}/${id}/rejeter`, data);
  }

  annuler(id: string): Observable<ApiResponse<Transaction>> {
    return this.api.post<ApiResponse<Transaction>>(`${this.basePath}/${id}/annuler`, {});
  }
}
