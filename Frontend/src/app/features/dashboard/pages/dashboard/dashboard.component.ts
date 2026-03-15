import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService, DashboardStats, RecentActivity } from '../../services/dashboard.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private authService      = inject(AuthService);
  private notif            = inject(NotificationService);

  stats       = signal<DashboardStats | null>(null);
  activities  = signal<RecentActivity[]>([]);
  isLoading   = signal(true);
  hasError    = signal(false);
  currentUser = this.authService.currentUser;
  today       = new Date();

  ngOnInit() {
    this.loadDashboard();
  }

  loadDashboard() {
    this.isLoading.set(true);
    this.hasError.set(false);

    this.dashboardService.getStats().subscribe({
      next: response => {
        if (response.success && response.data) {
          this.stats.set(response.data);
        } else {
          this.hasError.set(true);
          this.notif.error(response.message ?? 'Impossible de charger les statistiques');
        }
        this.isLoading.set(false);
      },
      error: err => {
        this.hasError.set(true);
        this.isLoading.set(false);
        this.notif.error(err.error?.message ?? 'Erreur de chargement du tableau de bord');
      }
    });

    this.dashboardService.getRecentActivities().subscribe({
      next: response => {
        if (response.success && response.data) {
          this.activities.set(response.data);
        }
      },
      error: err => {
        this.notif.error(err.error?.message ?? 'Impossible de charger les activités récentes');
      }
    });
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
