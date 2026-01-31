import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ApiResponse } from '../../../core/models/api-response.model';

export interface DashboardStats {
  tontines: {
    total: number;
    actives: number;
    enPreparation: number;
  };
  exercices: {
    total: number;
    enCours: number;
  };
  membres: {
    total: number;
    nouveauxMois: number;
  };
  transactions: {
    totalCotisations: number;
    cotisationsMois: number;
    totalDistribue: number;
    pretsEnCours: number;
    totalPenalites: number;
  };
  reunions: {
    prochaine: {
      id: number;
      date: string;
      lieu: string;
      tontine: string;
    } | null;
    totalMois: number;
  };
}

export interface RecentActivity {
  type: 'cotisation' | 'pret' | 'distribution' | 'adhesion' | 'reunion';
  description: string;
  date: string;
  montant?: number;
  user?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private api = inject(ApiService);

  getStats(): Observable<ApiResponse<DashboardStats>> {
    return this.api.get<ApiResponse<DashboardStats>>('/dashboard/stats');
  }

  getRecentActivities(): Observable<ApiResponse<RecentActivity[]>> {
    return this.api.get<ApiResponse<RecentActivity[]>>('/dashboard/activities');
  }
}
