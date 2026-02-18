import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DistributionService, Distribution } from '../../services/distribution.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-distribution-list',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, CurrencyPipe],
  template: `
    <div class="page-header">
      <div class="header-left">
        <h1>Distributions</h1>
        <p>Gérez les distributions du pot aux membres</p>
      </div>
      <a routerLink="create" class="btn-primary">
        <span class="material-icons">add</span>
        Nouvelle distribution
      </a>
    </div>

    <ng-container *ngIf="isLoading(); else content">
      <div class="loading"><div class="spinner"></div></div>
    </ng-container>

    <ng-template #content>
      <div *ngIf="distributions().length === 0" class="empty-state">
        <span class="material-icons">savings</span>
        <p>Aucune distribution trouvée</p>
      </div>

      <div *ngIf="distributions().length > 0" class="list">
        <div *ngFor="let d of distributions()" class="card">
          <div class="card-header">
            <h3>{{ d.exerciceMembreBeneficiaire?.utilisateur?.prenom }} {{ d.exerciceMembreBeneficiaire?.utilisateur?.nom }}</h3>
            <span class="badge" [class]="getStatusClass(d.statut)">{{ getStatusLabel(d.statut) }}</span>
          </div>
          <div class="card-body">
            <div class="amount-row">
              <span class="label">Montant net</span>
              <span class="value">{{ d.montantNet | currency:'XAF':'symbol':'1.0-0':'fr' }}</span>
            </div>
            <p><span class="material-icons">event</span> {{ d.creeLe | date:'dd/MM/yyyy' }}</p>
            <p><span class="material-icons">tag</span> Ordre: {{ d.ordre }}</p>
          </div>
        </div>
      </div>
    </ng-template>
  `,
  styles: `
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
    .page-header h1 { font-size: 1.75rem; font-weight: 700; color: #1f2937; margin: 0; }
    .page-header p { color: #6b7280; margin-top: 0.25rem; }
    .btn-primary { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.25rem; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; border-radius: 8px; font-size: 0.875rem; font-weight: 500; text-decoration: none; }
    .loading { display: flex; justify-content: center; padding: 4rem; }
    .spinner { width: 40px; height: 40px; border: 3px solid #e5e7eb; border-top-color: #667eea; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 4rem; background: white; border-radius: 12px; color: #6b7280; }
    .empty-state .material-icons { font-size: 4rem; opacity: 0.3; margin-bottom: 1rem; }
    .list { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); }
    .card { background: white; border-radius: 12px; padding: 1.25rem; }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .card-header h3 { font-size: 1.125rem; font-weight: 600; color: #1f2937; margin: 0; }
    .badge { padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; }
    .badge.green { background: #d1fae5; color: #065f46; }
    .badge.blue { background: #dbeafe; color: #1e40af; }
    .badge.red { background: #fee2e2; color: #991b1b; }
    .amount-row { display: flex; justify-content: space-between; margin-bottom: 0.5rem; }
    .amount-row .label { color: #6b7280; font-size: 0.875rem; }
    .amount-row .value { font-weight: 600; color: #1f2937; }
    .card-body p { display: flex; align-items: center; gap: 0.5rem; color: #6b7280; font-size: 0.875rem; margin: 0.5rem 0; }
    .card-body .material-icons { font-size: 1rem; }
  `
})
export class DistributionListComponent implements OnInit {
  private distributionService = inject(DistributionService);
  private notification = inject(NotificationService);

  distributions = signal<Distribution[]>([]);
  isLoading = signal(true);

  ngOnInit() {
    this.loadDistributions();
  }

  loadDistributions() {
    this.isLoading.set(true);
    this.distributionService.getAll().subscribe({
      next: (res) => {
        this.distributions.set(res.data || []);
        this.isLoading.set(false);
      },
      error: () => {
        this.notification.error('Erreur', 'Impossible de charger les distributions');
        this.distributions.set([]);
        this.isLoading.set(false);
      }
    });
  }

  getStatusClass(statut: string): string {
    switch (statut) {
      case 'DISTRIBUEE': return 'green';
      case 'PLANIFIEE': return 'blue';
      case 'ANNULEE': return 'red';
      default: return 'gray';
    }
  }

  getStatusLabel(statut: string): string {
    switch (statut) {
      case 'DISTRIBUEE': return 'Distribuée';
      case 'PLANIFIEE': return 'Planifiée';
      case 'ANNULEE': return 'Annulée';
      default: return statut;
    }
  }
}
