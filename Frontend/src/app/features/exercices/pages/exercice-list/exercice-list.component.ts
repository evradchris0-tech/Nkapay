import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ExerciceService, Exercice } from '../../services/exercice.service';
import { NotificationService } from '../../../../core/services/notification.service';

type FiltreStatut = 'TOUS' | 'BROUILLON' | 'OUVERT' | 'SUSPENDU' | 'FERME';

@Component({
  selector: 'app-exercice-list',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, FormsModule],
  template: `
    <div class="page-header">
      <div class="header-left">
        <h1>Exercices</h1>
        <p>Gérez les exercices comptables de vos tontines</p>
      </div>
      <a routerLink="create" class="btn-primary">
        <span class="material-icons">add</span>
        Nouvel exercice
      </a>
    </div>

    <div class="filters-bar">
      <div class="search-box">
        <span class="material-icons">search</span>
        <input type="text" [ngModel]="searchTerm()" (ngModelChange)="searchTerm.set($event)" placeholder="Libellé, tontine..."/>
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
        <span class="material-icons">calendar_month</span>
        <p>Aucun exercice trouvé</p>
      </div>

      <div *ngIf="filtered().length > 0" class="list">
        <div *ngFor="let ex of filtered()" class="card" [routerLink]="[ex.id]">
          <div class="card-header">
            <h3>{{ ex.libelle }}</h3>
            <span class="badge" [class]="getStatusClass(ex.statut)">{{ getStatusLabel(ex.statut) }}</span>
          </div>
          <div class="card-body">
            <p><span class="material-icons">business</span> {{ ex.tontine?.nom || 'N/A' }}</p>
            <p><span class="material-icons">date_range</span> {{ ex.moisDebut }}/{{ ex.anneeDebut }} — {{ ex.moisFin }}/{{ ex.anneeFin }}</p>
            <p><span class="material-icons">timer</span> {{ ex.dureeMois }} mois</p>
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
    .badge.yellow { background: #fef3c7; color: #92400e; }
    .badge.gray { background: #f3f4f6; color: #4b5563; }
    .badge.red { background: #fee2e2; color: #991b1b; }
    .card-body p { display: flex; align-items: center; gap: 0.5rem; color: var(--text-secondary, #6b7280); font-size: 0.875rem; margin: 0.5rem 0; }
    .card-body .material-icons { font-size: 1rem; }
  `
})
export class ExerciceListComponent implements OnInit {
  private exerciceService = inject(ExerciceService);
  private notification = inject(NotificationService);

  allExercices = signal<Exercice[]>([]);
  isLoading = signal(true);
  filtreStatut = signal<FiltreStatut>('TOUS');
  searchTerm = signal('');

  readonly filtres: { key: FiltreStatut; label: string }[] = [
    { key: 'TOUS', label: 'Tous' },
    { key: 'OUVERT', label: 'Ouverts' },
    { key: 'BROUILLON', label: 'Brouillons' },
    { key: 'SUSPENDU', label: 'Suspendus' },
    { key: 'FERME', label: 'Fermés' },
  ];

  filtered = computed(() => {
    let list = this.allExercices();
    const f = this.filtreStatut();
    const q = this.searchTerm().toLowerCase().trim();
    if (f !== 'TOUS') list = list.filter(ex => ex.statut === f);
    if (q) list = list.filter(ex =>
      ex.libelle?.toLowerCase().includes(q) ||
      ex.tontine?.nom?.toLowerCase().includes(q)
    );
    return list;
  });

  ngOnInit() {
    this.loadExercices();
  }

  loadExercices() {
    this.isLoading.set(true);
    this.exerciceService.getAll({ limit: 200 }).subscribe({
      next: (res) => {
        this.allExercices.set(res.data || []);
        this.isLoading.set(false);
      },
      error: () => {
        this.notification.error('Erreur', 'Impossible de charger les exercices');
        this.allExercices.set([]);
        this.isLoading.set(false);
      }
    });
  }

  onSearch() { /* handled via ngModelChange */ }
  setFiltre(f: FiltreStatut) { this.filtreStatut.set(f); }
  getCount(statut: string): number { return this.allExercices().filter(ex => ex.statut === statut).length; }

  getStatusClass(statut: string): string {
    switch (statut) {
      case 'OUVERT': return 'green';
      case 'BROUILLON': return 'yellow';
      case 'SUSPENDU': return 'red';
      case 'FERME': return 'gray';
      default: return 'gray';
    }
  }

  getStatusLabel(statut: string): string {
    switch (statut) {
      case 'OUVERT': return 'Ouvert';
      case 'BROUILLON': return 'Brouillon';
      case 'SUSPENDU': return 'Suspendu';
      case 'FERME': return 'Fermé';
      default: return statut;
    }
  }
}
