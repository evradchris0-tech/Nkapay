import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ApiResponse, PaginatedResponse } from '../../../core/models/api-response.model';

export type StatutEvenementSecours = 'DECLARE' | 'EN_COURS_VALIDATION' | 'VALIDE' | 'REFUSE' | 'PAYE';

export interface TypeEvenementSecours {
  id: string;
  code: string;
  libelle: string;
  montantParDefaut: number;
  estActif: boolean;
}

export interface EvenementSecours {
  id: string;
  exerciceMembreId: string;
  exerciceMembre?: { id: string; utilisateurId: string; utilisateurNom: string };
  typeEvenementSecoursId: string;
  typeEvenementSecours?: TypeEvenementSecours;
  dateEvenement: string;
  description?: string;
  montantDemande?: number;
  montantApprouve?: number;
  montantDecaisse?: number;
  statut: StatutEvenementSecours;
  dateDeclaration: string;
  dateValidation?: string;
  dateDecaissement?: string;
  valideParExerciceMembreId?: string;
  transactionId?: string;
  reunionId?: string;
  motifRefus?: string;
}

export interface CreateEvenementSecoursDto {
  exerciceMembreId: string;
  typeEvenementSecoursId: string;
  dateEvenement: string;
  description?: string;
  montantDemande?: number;
  reunionId?: string;
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

  // ─── Événements secours ──────────────────────────────────────────────────

  getEvenements(params?: {
    exerciceId?: string;
    exerciceMembreId?: string;
    typeEvenementSecoursId?: string;
    statut?: StatutEvenementSecours;
    dateDebut?: string;
    dateFin?: string;
    page?: number;
    limit?: number;
  }): Observable<PaginatedResponse<EvenementSecours>> {
    return this.api.get<PaginatedResponse<EvenementSecours>>('/evenements-secours', params);
  }

  getEvenementById(id: string): Observable<ApiResponse<EvenementSecours>> {
    return this.api.get<ApiResponse<EvenementSecours>>(`/evenements-secours/${id}`);
  }

  createEvenement(data: CreateEvenementSecoursDto): Observable<ApiResponse<EvenementSecours>> {
    return this.api.post<ApiResponse<EvenementSecours>>('/evenements-secours', data);
  }

  soumettreEvenement(id: string): Observable<ApiResponse<EvenementSecours>> {
    return this.api.post<ApiResponse<EvenementSecours>>(`/evenements-secours/${id}/soumettre`, {});
  }

  validerEvenement(id: string, data: { valideParExerciceMembreId: string; montantApprouve: number }): Observable<ApiResponse<EvenementSecours>> {
    return this.api.post<ApiResponse<EvenementSecours>>(`/evenements-secours/${id}/valider`, data);
  }

  refuserEvenement(id: string, data: { refuseParExerciceMembreId: string; motifRefus: string }): Observable<ApiResponse<EvenementSecours>> {
    return this.api.post<ApiResponse<EvenementSecours>>(`/evenements-secours/${id}/refuser`, data);
  }

  payerEvenement(id: string, transactionId: string): Observable<ApiResponse<EvenementSecours>> {
    return this.api.post<ApiResponse<EvenementSecours>>(`/evenements-secours/${id}/payer`, { transactionId });
  }

  decaisserEvenement(id: string, data: { decaisseParExerciceMembreId: string; reunionId?: string }): Observable<ApiResponse<EvenementSecours>> {
    return this.api.post<ApiResponse<EvenementSecours>>(`/evenements-secours/${id}/decaisser`, data);
  }

  // ─── Cotisations dues ────────────────────────────────────────────────────

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
