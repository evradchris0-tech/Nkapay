import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ReunionService, Reunion } from '../../services/reunion.service';
import { NotificationService } from '../../../../core/services/notification.service';

type FiltreStatut = 'TOUS' | 'PLANIFIEE' | 'OUVERTE' | 'CLOTUREE' | 'ANNULEE';

@Component({
  selector: 'app-reunion-list',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, FormsModule],
  template: `
    <div class="page-header">
      <div class="header-left">
        <h1>Réunions</h1>
        <p>Planifiez et gérez les réunions de vos tontines</p>
      </div>
      <a routerLink="create" class="btn-primary">
        <span class="material-icons">add</span>
        Nouvelle réunion
      </a>
    </div>

    <div class="filters-bar">
      <div class="search-box">
        <span class="material-icons">search</span>
        <input type="text" [ngModel]="searchTerm()" (ngModelChange)="searchTerm.set($event)" placeholder="Tontine, lieu..."/>
      </div>
      <div class="status-tabs">
        <button *ngFor="let f of filtres" class="tab" [class.active]="filtreStatut() === f.key" (click)="setFiltre(f.key)">
          {{ f.label }}
          <span class="count" *ngIf="f.key !== 'TOUS'">{{ getCount(f.key) }}</span>
        </button>
      </div>
    </div>

    <ng-container *ngIf="isLoading(); else content">
      <div class="loading"><div class="spinner"></div></div>
    </ng-container>

    <ng-template #content>
      <div *ngIf="filtered().length === 0" class="empty-state">
        <span class="material-icons">groups</span>
        <p>Aucune réunion trouvée</p>
      </div>

      <div *ngIf="filtered().length > 0" class="list">
        <div *ngFor="let r of filtered()" class="card" [routerLink]="[r.id]">
          <div class="card-header">
            <h3>Réunion #{{ r.numeroReunion }}</h3>
            <span class="badge" [class]="getStatusClass(r.statut)">{{ getStatusLabel(r.statut) }}</span>
          </div>
          <div class="card-body">
            <p><span class="material-icons">business</span> {{ r.exercice?.tontine?.nom || 'N/A' }}</p>
            <p><span class="material-icons">event</span> {{ r.dateReunion | date:'dd/MM/yyyy' }}</p>
            <p *ngIf="r.lieu"><span class="material-icons">place</span> {{ r.lieu }}</p>
            <p *ngIf="r.heureDebut"><span class="material-icons">schedule</span> {{ r.heureDebut }}</p>
          </div>
        </div>
      </div>
    </ng-template>
  `,
  styles: `
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
    .page-header h1 { font-size: 1.75rem; font-weight: 700; color: var(--text-primary, #1f2937); margin: 0; }
    .page-header p { color: var(--text-secondary, #6b7280); margin-top: 0.25rem; }
    .btn-primary { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.25rem; background: var(--primary-gradient, linear-gradient(135deg, #667eea, #764ba2)); color: white; border: none; border-radius: 8px; font-size: 0.875rem; font-weight: 500; text-decoration: none; }
    .filters-bar { display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; align-items: center; }
    .search-box { position: relative; display: flex; align-items: center; }
    .search-box .material-icons { position: absolute; left: 0.75rem; color: var(--text-secondary, #6b7280); font-size: 1.125rem; }
    .search-box input { padding: 0.625rem 0.75rem 0.625rem 2.5rem; border: 2px solid var(--border-color, #e5e7eb); border-radius: 8px; font-size: 0.875rem; width: 220px; }
    .search-box input:focus { outline: none; border-color: var(--primary, #667eea); }
    .status-tabs { display: flex; gap: 0.25rem; flex-wrap: wrap; }
    .tab { padding: 0.5rem 0.875rem; border: 1px solid var(--border-color, #e5e7eb); background: white; border-radius: 6px; font-size: 0.8125rem; font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: 0.375rem; color: var(--text-secondary, #6b7280); transition: all 0.15s; }
    .tab:hover { border-color: var(--primary, #667eea); color: var(--primary, #667eea); }
    .tab.active { background: var(--primary, #667eea); border-color: var(--primary, #667eea); color: white; }
    .tab .count { background: rgba(255,255,255,0.25); border-radius: 10px; padding: 0 0.375rem; font-size: 0.7rem; }
    .tab:not(.active) .count { background: var(--border-color, #e5e7eb); color: var(--text-secondary, #6b7280); }
    .loading { display: flex; justify-content: center; padding: 4rem; }
    .spinner { width: 40px; height: 40px; border: 3px solid var(--border-color, #e5e7eb); border-top-color: var(--primary, #667eea); border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 4rem; background: white; border-radius: 12px; color: var(--text-secondary, #6b7280); }
    .empty-state .material-icons { font-size: 4rem; opacity: 0.3; margin-bottom: 1rem; }
    .list { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); }
    .card { background: white; border-radius: 12px; padding: 1.25rem; cursor: pointer; transition: all 0.15s; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
    .card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .card-header h3 { font-size: 1.125rem; font-weight: 600; color: var(--text-primary, #1f2937); margin: 0; }
    .badge { padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; }
    .badge.green { background: #d1fae5; color: #065f46; }
    .badge.blue { background: #dbeafe; color: #1e40af; }
    .badge.gray { background: #f3f4f6; color: #4b5563; }
    .badge.red { background: #fee2e2; color: #991b1b; }
    .card-body p { display: flex; align-items: center; gap: 0.5rem; color: var(--text-secondary, #6b7280); font-size: 0.875rem; margin: 0.5rem 0; }
    .card-body .material-icons { font-size: 1rem; }
  `
})
export class ReunionListComponent implements OnInit {
  private reunionService = inject(ReunionService);
  private notification = inject(NotificationService);

  allReunions = signal<Reunion[]>([]);
  isLoading = signal(true);
  filtreStatut = signal<FiltreStatut>('TOUS');
  searchTerm = signal('');

  readonly filtres: { key: FiltreStatut; label: string }[] = [
    { key: 'TOUS', label: 'Toutes' },
    { key: 'PLANIFIEE', label: 'Planifiées' },
    { key: 'OUVERTE', label: 'Ouvertes' },
    { key: 'CLOTUREE', label: 'Clôturées' },
    { key: 'ANNULEE', label: 'Annulées' },
  ];

  filtered = computed(() => {
    let list = this.allReunions();
    const f = this.filtreStatut();
    const q = this.searchTerm().toLowerCase().trim();
    if (f !== 'TOUS') list = list.filter(r => r.statut === f);
    if (q) list = list.filter(r =>
      r.exercice?.tontine?.nom?.toLowerCase().includes(q) ||
      r.lieu?.toLowerCase().includes(q)
    );
    return list;
  });

  ngOnInit() {
    this.loadReunions();
  }

  loadReunions() {
    this.isLoading.set(true);
    this.reunionService.getAll({ limit: 200 }).subscribe({
      next: (res) => {
        this.allReunions.set(res.data || []);
        this.isLoading.set(false);
      },
      error: () => {
        this.notification.error('Erreur', 'Impossible de charger les réunions');
        this.allReunions.set([]);
        this.isLoading.set(false);
      }
    });
  }

  onSearch() { /* handled via ngModelChange */ }
  setFiltre(f: FiltreStatut) { this.filtreStatut.set(f); }
  getCount(statut: string): number { return this.allReunions().filter(r => r.statut === statut).length; }

  getStatusClass(statut: string): string {
    switch (statut) {
      case 'OUVERTE': return 'green';
      case 'PLANIFIEE': return 'blue';
      case 'CLOTUREE': return 'gray';
      case 'ANNULEE': return 'red';
      default: return 'gray';
    }
  }

  getStatusLabel(statut: string): string {
    switch (statut) {
      case 'OUVERTE': return 'Ouverte';
      case 'PLANIFIEE': return 'Planifiée';
      case 'CLOTUREE': return 'Clôturée';
      case 'ANNULEE': return 'Annulée';
      default: return statut;
    }
  }
}
