import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PretService, Pret } from '../../services/pret.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-pret-list',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, CurrencyPipe],
  template: `
    <div class="page-header">
      <div class="header-left">
        <h1>Prêts</h1>
        <p>Gérez les prêts accordés aux membres</p>
      </div>
      <a routerLink="create" class="btn-primary">
        <span class="material-icons">add</span>
        Nouveau prêt
      </a>
    </div>

    <ng-container *ngIf="isLoading(); else content">
      <div class="loading"><div class="spinner"></div></div>
    </ng-container>

    <ng-template #content>
      <div *ngIf="prets().length === 0" class="empty-state">
        <span class="material-icons">credit_score</span>
        <p>Aucun prêt trouvé</p>
      </div>

      <div *ngIf="prets().length > 0" class="list">
        <div *ngFor="let p of prets()" class="card" [routerLink]="[p.id]">
          <div class="card-header">
            <h3>{{ p.exerciceMembre?.utilisateur?.prenom }} {{ p.exerciceMembre?.utilisateur?.nom }}</h3>
            <span class="badge" [class]="getStatusClass(p.statut)">{{ getStatusLabel(p.statut) }}</span>
          </div>
          <div class="card-body">
            <div class="amount-row">
              <span class="label">Capital</span>
              <span class="value">{{ p.montantCapital | currency:'XAF':'symbol':'1.0-0':'fr' }}</span>
            </div>
            <div class="amount-row">
              <span class="label">Restant</span>
              <span class="value red">{{ p.capitalRestant | currency:'XAF':'symbol':'1.0-0':'fr' }}</span>
            </div>
            <p><span class="material-icons">event</span> {{ p.dateDemande | date:'dd/MM/yyyy' }}</p>
            <p *ngIf="p.dateEcheance"><span class="material-icons">timer</span> Échéance: {{ p.dateEcheance | date:'dd/MM/yyyy' }}</p>
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
    .card { background: white; border-radius: 12px; padding: 1.25rem; cursor: pointer; transition: box-shadow 0.2s; }
    .card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .card-header h3 { font-size: 1.125rem; font-weight: 600; color: #1f2937; margin: 0; }
    .badge { padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; }
    .badge.green { background: #d1fae5; color: #065f46; }
    .badge.blue { background: #dbeafe; color: #1e40af; }
    .badge.yellow { background: #fef3c7; color: #92400e; }
    .badge.gray { background: #f3f4f6; color: #4b5563; }
    .badge.red { background: #fee2e2; color: #991b1b; }
    .badge.orange { background: #ffedd5; color: #c2410c; }
    .amount-row { display: flex; justify-content: space-between; margin-bottom: 0.5rem; }
    .amount-row .label { color: #6b7280; font-size: 0.875rem; }
    .amount-row .value { font-weight: 600; color: #1f2937; }
    .amount-row .value.red { color: #dc2626; }
    .card-body p { display: flex; align-items: center; gap: 0.5rem; color: #6b7280; font-size: 0.875rem; margin: 0.5rem 0; }
    .card-body .material-icons { font-size: 1rem; }
  `
})
export class PretListComponent implements OnInit {
  private pretService = inject(PretService);
  private notification = inject(NotificationService);

  prets = signal<Pret[]>([]);
  isLoading = signal(true);

  ngOnInit() {
    this.loadPrets();
  }

  loadPrets() {
    this.isLoading.set(true);
    this.pretService.getAll().subscribe({
      next: (res) => {
        this.prets.set(res.data || []);
        this.isLoading.set(false);
      },
      error: () => {
        this.notification.error('Erreur', 'Impossible de charger les prêts');
        this.prets.set([]);
        this.isLoading.set(false);
      }
    });
  }

  getStatusClass(statut: string): string {
    switch (statut) {
      case 'SOLDE': return 'green';
      case 'EN_COURS': case 'DECAISSE': return 'blue';
      case 'DEMANDE': return 'yellow';
      case 'APPROUVE': return 'orange';
      case 'REFUSE': case 'DEFAUT': return 'red';
      default: return 'gray';
    }
  }

  getStatusLabel(statut: string): string {
    switch (statut) {
      case 'DEMANDE': return 'Demandé';
      case 'APPROUVE': return 'Approuvé';
      case 'REFUSE': return 'Refusé';
      case 'DECAISSE': return 'Décaissé';
      case 'EN_COURS': return 'En cours';
      case 'SOLDE': return 'Soldé';
      case 'DEFAUT': return 'En défaut';
      default: return statut;
    }
  }
}
