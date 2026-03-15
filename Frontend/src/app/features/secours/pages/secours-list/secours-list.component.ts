import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { SecoursService, SecoursDuAnnuel } from '../../services/secours.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-secours-list',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  template: `
    <div class="page-header">
      <div class="header-left">
        <h1>Secours</h1>
        <p>Gérez les cotisations secours des membres</p>
      </div>
    </div>

    <ng-container *ngIf="isLoading(); else content">
      <div class="loading"><div class="spinner"></div></div>
    </ng-container>

    <ng-template #content>
      <div *ngIf="secoursDus().length === 0" class="empty-state">
        <span class="material-icons">volunteer_activism</span>
        <p>Aucune cotisation secours trouvée</p>
      </div>

      <div *ngIf="secoursDus().length > 0" class="table-container">
        <table>
          <thead>
            <tr>
              <th>Membre</th>
              <th>Montant dû</th>
              <th>Payé</th>
              <th>Restant</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let s of secoursDus()">
              <td>{{ s.exerciceMembre?.utilisateur?.prenom }} {{ s.exerciceMembre?.utilisateur?.nom }}</td>
              <td>{{ s.montantDu | currency:'XAF':'symbol':'1.0-0':'fr' }}</td>
              <td class="green-text">{{ s.montantPaye | currency:'XAF':'symbol':'1.0-0':'fr' }}</td>
              <td class="red-text">{{ s.montantRestant | currency:'XAF':'symbol':'1.0-0':'fr' }}</td>
              <td><span class="badge" [class]="getStatusClass(s.statut)">{{ getStatusLabel(s.statut) }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </ng-template>
  `,
  styles: `
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
    .page-header h1 { font-size: 1.75rem; font-weight: 700; color: #1f2937; margin: 0; }
    .page-header p { color: #6b7280; margin-top: 0.25rem; }
    .loading { display: flex; justify-content: center; padding: 4rem; }
    .spinner { width: 40px; height: 40px; border: 3px solid #e5e7eb; border-top-color: #667eea; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 4rem; background: white; border-radius: 12px; color: #6b7280; }
    .empty-state .material-icons { font-size: 4rem; opacity: 0.3; margin-bottom: 1rem; }
    .table-container { background: white; border-radius: 12px; overflow: hidden; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 1rem; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { background: #f9fafb; font-weight: 600; color: #374151; font-size: 0.875rem; }
    td { font-size: 0.875rem; color: #4b5563; }
    .green-text { color: #059669; font-weight: 500; }
    .red-text { color: #dc2626; font-weight: 500; }
    .badge { padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 500; }
    .badge.green { background: #d1fae5; color: #065f46; }
    .badge.yellow { background: #fef3c7; color: #92400e; }
    .badge.red { background: #fee2e2; color: #991b1b; }
  `
})
export class SecoursListComponent implements OnInit {
  private secoursService = inject(SecoursService);
  private notification = inject(NotificationService);

  secoursDus = signal<SecoursDuAnnuel[]>([]);
  isLoading = signal(true);

  ngOnInit() {
    this.loadSecoursDus();
  }

  loadSecoursDus() {
    this.isLoading.set(true);
    this.secoursService.getSecoursEnRetard().subscribe({
      next: (res) => {
        this.secoursDus.set(res.data || []);
        this.isLoading.set(false);
      },
      error: () => {
        this.notification.error('Erreur', 'Impossible de charger les secours');
        this.secoursDus.set([]);
        this.isLoading.set(false);
      }
    });
  }

  getStatusClass(statut: string): string {
    switch (statut) {
      case 'PAYE': case 'A_JOUR': return 'green';
      case 'EN_RETARD': return 'red';
      default: return 'yellow';
    }
  }

  getStatusLabel(statut: string): string {
    switch (statut) {
      case 'PAYE': return 'Payé';
      case 'A_JOUR': return 'À jour';
      case 'EN_RETARD': return 'En retard';
      default: return statut;
    }
  }
}
