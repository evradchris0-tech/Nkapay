import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PenaliteService, Penalite } from '../../services/penalite.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-penalite-list',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, CurrencyPipe],
  template: `
    <div class="page-header">
      <div class="header-left">
        <h1>Pénalités</h1>
        <p>Gérez les pénalités des membres</p>
      </div>
      <a routerLink="create" class="btn-primary">
        <span class="material-icons">add</span>
        Nouvelle pénalité
      </a>
    </div>

    <ng-container *ngIf="isLoading(); else content">
      <div class="loading"><div class="spinner"></div></div>
    </ng-container>

    <ng-template #content>
      <div *ngIf="penalites().length === 0" class="empty-state">
        <span class="material-icons">gavel</span>
        <p>Aucune pénalité trouvée</p>
      </div>

      <div *ngIf="penalites().length > 0" class="table-container">
        <table>
          <thead>
            <tr>
              <th>Membre</th>
              <th>Type</th>
              <th>Montant</th>
              <th>Statut</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of penalites()">
              <td>{{ p.exerciceMembre?.utilisateur?.prenom }} {{ p.exerciceMembre?.utilisateur?.nom }}</td>
              <td>{{ p.typePenalite?.libelle || 'N/A' }}</td>
              <td class="amount">{{ p.montant | currency:'XAF':'symbol':'1.0-0':'fr' }}</td>
              <td><span class="badge" [class]="getStatusClass(p.statut)">{{ getStatusLabel(p.statut) }}</span></td>
              <td>{{ p.dateApplication | date:'dd/MM/yyyy' }}</td>
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
    .btn-primary { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.25rem; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; border-radius: 8px; font-size: 0.875rem; font-weight: 500; text-decoration: none; }
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
    .amount { font-weight: 600; color: #1f2937; }
    .badge { padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 500; }
    .badge.green { background: #d1fae5; color: #065f46; }
    .badge.yellow { background: #fef3c7; color: #92400e; }
    .badge.gray { background: #f3f4f6; color: #4b5563; }
    .badge.red { background: #fee2e2; color: #991b1b; }
  `
})
export class PenaliteListComponent implements OnInit {
  private penaliteService = inject(PenaliteService);
  private notification = inject(NotificationService);

  penalites = signal<Penalite[]>([]);
  isLoading = signal(true);

  ngOnInit() {
    this.loadPenalites();
  }

  loadPenalites() {
    this.isLoading.set(true);
    this.penaliteService.getAll().subscribe({
      next: (res) => {
        this.penalites.set(res.data || []);
        this.isLoading.set(false);
      },
      error: () => {
        this.notification.error('Erreur', 'Impossible de charger les pénalités');
        this.penalites.set([]);
        this.isLoading.set(false);
      }
    });
  }

  getStatusClass(statut: string): string {
    switch (statut) {
      case 'PAYEE': return 'green';
      case 'EN_ATTENTE': return 'yellow';
      case 'ANNULEE': return 'red';
      case 'PARDONNEE': return 'gray';
      default: return 'gray';
    }
  }

  getStatusLabel(statut: string): string {
    switch (statut) {
      case 'PAYEE': return 'Payée';
      case 'EN_ATTENTE': return 'En attente';
      case 'ANNULEE': return 'Annulée';
      case 'PARDONNEE': return 'Pardonnée';
      default: return statut;
    }
  }
}
