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
        this.stats.set(null);
      }
    });

    this.dashboardService.getRecentActivities().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.activities.set(response.data);
        }
      },
      error: () => {
        this.activities.set([]);
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
