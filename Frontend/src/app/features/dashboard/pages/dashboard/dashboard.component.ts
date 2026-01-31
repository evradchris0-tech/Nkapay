import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService, DashboardStats, RecentActivity } from '../../services/dashboard.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private authService = inject(AuthService);

  stats = signal<DashboardStats | null>(null);
  activities = signal<RecentActivity[]>([]);
  isLoading = signal(true);
  currentUser = this.authService.currentUser;
  today = new Date();

  ngOnInit() {
    this.loadDashboard();
  }

  loadDashboard() {
    this.isLoading.set(true);
    
    this.dashboardService.getStats().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.stats.set(response.data);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        // Set mock data for development
        this.stats.set(this.getMockStats());
      }
    });

    this.dashboardService.getRecentActivities().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.activities.set(response.data);
        }
      },
      error: () => {
        this.activities.set(this.getMockActivities());
      }
    });
  }

  private getMockStats(): DashboardStats {
    return {
      tontines: { total: 5, actives: 3, enPreparation: 2 },
      exercices: { total: 12, enCours: 3 },
      membres: { total: 45, nouveauxMois: 3 },
      transactions: {
        totalCotisations: 2500000,
        cotisationsMois: 350000,
        totalDistribue: 1800000,
        pretsEnCours: 450000,
        totalPenalites: 25000
      },
      reunions: {
        prochaine: {
          id: 1,
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          lieu: 'Salle de réunion A',
          tontine: 'Tontine Familiale'
        },
        totalMois: 4
      }
    };
  }

  private getMockActivities(): RecentActivity[] {
    return [
      { type: 'cotisation', description: 'Cotisation reçue', date: new Date().toISOString(), montant: 50000, user: 'Jean Dupont' },
      { type: 'pret', description: 'Nouveau prêt accordé', date: new Date(Date.now() - 86400000).toISOString(), montant: 150000, user: 'Marie Kamga' },
      { type: 'distribution', description: 'Distribution effectuée', date: new Date(Date.now() - 172800000).toISOString(), montant: 300000, user: 'Paul Nkomo' },
      { type: 'adhesion', description: 'Nouveau membre', date: new Date(Date.now() - 259200000).toISOString(), user: 'Sophie Biya' },
      { type: 'reunion', description: 'Réunion planifiée', date: new Date(Date.now() - 345600000).toISOString() }
    ];
  }

  getActivityIcon(type: string): string {
    const icons: Record<string, string> = {
      cotisation: 'payments',
      pret: 'credit_score',
      distribution: 'savings',
      adhesion: 'person_add',
      reunion: 'groups'
    };
    return icons[type] || 'info';
  }

  getActivityColor(type: string): string {
    const colors: Record<string, string> = {
      cotisation: 'green',
      pret: 'blue',
      distribution: 'purple',
      adhesion: 'orange',
      reunion: 'gray'
    };
    return colors[type] || 'gray';
  }
}
