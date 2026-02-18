import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ApiResponse, PaginatedResponse } from '../../../core/models/api-response.model';

export interface TypeEvenementSecours {
  id: string;
  code: string;
  libelle: string;
  montantParDefaut: number;
  estActif: boolean;
}

export interface SecoursDuAnnuel {
  id: string;
  exerciceMembreId: string;
  exerciceMembre?: { id: string; matricule: string; utilisateur?: { prenom: string; nom: string } };
  exerciceId: string;
  montantDu: number;
  montantPaye: number;
  montantRestant: number;
  statut: 'A_JOUR' | 'EN_RETARD' | 'PAYE';
  creeLe: string;
}

export interface BilanSecoursExercice {
  id: string;
  exerciceId: string;
  typeEvenementSecoursId: string;
  typeEvenementSecours?: TypeEvenementSecours;
  totalCollecte: number;
  totalDepense: number;
  solde: number;
  creeLe: string;
}

@Injectable({
  providedIn: 'root'
})
export class SecoursService {
  private api = inject(ApiService);

  getSecoursDus(exerciceId: string): Observable<ApiResponse<SecoursDuAnnuel[]>> {
    return this.api.get<ApiResponse<SecoursDuAnnuel[]>>(`/secours/dus/exercice/${exerciceId}`);
  }

  getSecoursEnRetard(): Observable<ApiResponse<SecoursDuAnnuel[]>> {
    return this.api.get<ApiResponse<SecoursDuAnnuel[]>>('/secours/dus/en-retard');
  }

  getBilanSecours(exerciceId: string): Observable<ApiResponse<BilanSecoursExercice[]>> {
    return this.api.get<ApiResponse<BilanSecoursExercice[]>>(`/secours/bilans/exercice/${exerciceId}`);
  }

  getTypesEvenement(): Observable<ApiResponse<TypeEvenementSecours[]>> {
    return this.api.get<ApiResponse<TypeEvenementSecours[]>>('/types-evenements-secours');
  }

  payerSecours(id: string, montant: number): Observable<ApiResponse<SecoursDuAnnuel>> {
    return this.api.post<ApiResponse<SecoursDuAnnuel>>(`/secours/dus/${id}/payer`, { montant });
  }
}
