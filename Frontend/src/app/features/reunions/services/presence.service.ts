import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ApiResponse } from '../../../core/models/api-response.model';

export interface Presence {
  id: string;
  reunionId: string;
  exerciceMembreId: string;
  exerciceMembre?: {
    id: string;
    utilisateurId: string;
    utilisateurNom: string;
    ordreDistribution?: number;
  };
  estPresent: boolean;
  estEnRetard?: boolean;
  heureArrivee?: string;
  note?: string;
  creeLe: string;
}

export interface PresenceSummary {
  reunionId: string;
  totalMembres: number;
  presents: number;
  absents: number;
  enRetard: number;
  tauxPresence: number;
}

export interface CotisationDue {
  id: string;
  exerciceMembreId: string;
  reunionId: string;
  montant: number;
  statut: 'EN_ATTENTE' | 'PAYEE' | 'ANNULEE';
  membre?: { prenom: string; nom: string; matricule?: string };
}

@Injectable({
  providedIn: 'root'
})
export class PresenceService {
  private api = inject(ApiService);

  getByReunion(reunionId: string): Observable<ApiResponse<Presence[]>> {
    return this.api.get<ApiResponse<Presence[]>>(`/presences/reunion/${reunionId}`);
  }

  getSummary(reunionId: string): Observable<ApiResponse<PresenceSummary>> {
    return this.api.get<ApiResponse<PresenceSummary>>(`/presences/reunion/${reunionId}/summary`);
  }

  getCotisationsDues(reunionId: string): Observable<ApiResponse<CotisationDue[]>> {
    return this.api.get<ApiResponse<CotisationDue[]>>(`/dues/cotisations/reunion/${reunionId}`);
  }
}
