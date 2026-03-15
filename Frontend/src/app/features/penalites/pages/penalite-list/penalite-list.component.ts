import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PenaliteService, Penalite } from '../../services/penalite.service';
import { NotificationService } from '../../../../core/services/notification.service';

type FiltreStatut = 'TOUS' | 'EN_ATTENTE' | 'PAYEE' | 'ANNULEE' | 'PARDONNEE';

@Component({
  selector: 'app-penalite-list',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, CurrencyPipe, FormsModule],
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

    <div class="filters-bar">
      <div class="search-box">
        <span class="material-icons">search</span>
        <input type="text" [ngModel]="searchTerm()" (ngModelChange)="searchTerm.set($event); page.set(1)" placeholder="Rechercher un membre..."/>
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
        <span class="material-icons">gavel</span>
        <p>Aucune pénalité trouvée</p>
      </div>

      <div *ngIf="filtered().length > 0" class="table-container">
        <table>
          <thead>
            <tr>
              <th>Membre</th>
              <th>Type</th>
              <th>Montant</th>
              <th>Statut</th>
              <th>Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of filtered()" class="clickable" (click)="goTo(p.id)">
              <td>{{ p.exerciceMembre?.utilisateur?.prenom }} {{ p.exerciceMembre?.utilisateur?.nom }}</td>
              <td>{{ p.typePenalite?.libelle || 'N/A' }}</td>
              <td class="amount">{{ p.montant | currency:'XAF':'symbol':'1.0-0':'fr' }}</td>
              <td><span class="badge" [class]="getStatusClass(p.statut)">{{ getStatusLabel(p.statut) }}</span></td>
              <td>{{ p.dateApplication | date:'dd/MM/yyyy' }}</td>
              <td><span class="material-icons arrow">chevron_right</span></td>
            </tr>
          </tbody>
        </table>

        <div class="pagination" *ngIf="totalPages() > 1">
          <button [disabled]="page() === 1" (click)="goPage(page() - 1)">
            <span class="material-icons">chevron_left</span>
          </button>
          <span>Page {{ page() }} / {{ totalPages() }}</span>
          <button [disabled]="page() === totalPages()" (click)="goPage(page() + 1)">
            <span class="material-icons">chevron_right</span>
          </button>
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
    .table-container { background: white; border-radius: 12px; overflow: hidden; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 1rem; text-align: left; border-bottom: 1px solid var(--border-color, #e5e7eb); }
    th { background: var(--bg-subtle, #f9fafb); font-weight: 600; color: var(--text-secondary, #374151); font-size: 0.875rem; }
    td { font-size: 0.875rem; color: var(--text-secondary, #4b5563); }
    tr.clickable { cursor: pointer; transition: background 0.15s; }
    tr.clickable:hover { background: var(--bg-subtle, #f9fafb); }
    .amount { font-weight: 600; color: var(--text-primary, #1f2937); }
    .arrow { color: var(--text-secondary, #9ca3af); font-size: 1.25rem; }
    .badge { padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 500; }
    .badge.green { background: #d1fae5; color: #065f46; }
    .badge.yellow { background: #fef3c7; color: #92400e; }
    .badge.gray { background: #f3f4f6; color: #4b5563; }
    .badge.red { background: #fee2e2; color: #991b1b; }
    .pagination { display: flex; align-items: center; justify-content: center; gap: 1rem; padding: 1rem; border-top: 1px solid var(--border-color, #e5e7eb); }
    .pagination button { display: flex; align-items: center; padding: 0.375rem; border: 1px solid var(--border-color, #e5e7eb); background: white; border-radius: 6px; cursor: pointer; }
    .pagination button:disabled { opacity: 0.4; cursor: not-allowed; }
    .pagination span { font-size: 0.875rem; color: var(--text-secondary, #6b7280); }
  `
})
export class PenaliteListComponent implements OnInit {
  private penaliteService = inject(PenaliteService);
  private notification = inject(NotificationService);
  private router = inject(Router);

  allPenalites = signal<Penalite[]>([]);
  isLoading = signal(true);
  filtreStatut = signal<FiltreStatut>('TOUS');
  searchTerm = signal('');
  page = signal(1);
  readonly limit = 20;

  readonly filtres: { key: FiltreStatut; label: string }[] = [
    { key: 'TOUS', label: 'Toutes' },
    { key: 'EN_ATTENTE', label: 'En attente' },
    { key: 'PAYEE', label: 'Payées' },
    { key: 'ANNULEE', label: 'Annulées' },
    { key: 'PARDONNEE', label: 'Pardonnées' },
  ];

  private filtered_base = computed(() => {
    let list = this.allPenalites();
    const f = this.filtreStatut();
    const q = this.searchTerm().toLowerCase().trim();
    if (f !== 'TOUS') list = list.filter(p => p.statut === f);
    if (q) list = list.filter(p =>
      p.exerciceMembre?.utilisateur?.prenom?.toLowerCase().includes(q) ||
      p.exerciceMembre?.utilisateur?.nom?.toLowerCase().includes(q)
    );
    return list;
  });

  filtered = computed(() => {
    const list = this.filtered_base();
    const start = (this.page() - 1) * this.limit;
    return list.slice(start, start + this.limit);
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.filtered_base().length / this.limit)));

  ngOnInit() {
    this.loadPenalites();
  }

  loadPenalites() {
    this.isLoading.set(true);
    this.penaliteService.getAll({ limit: 200 }).subscribe({
      next: (res) => {
        this.allPenalites.set(res.data || []);
        this.isLoading.set(false);
      },
      error: () => {
        this.notification.error('Erreur', 'Impossible de charger les pénalités');
        this.allPenalites.set([]);
        this.isLoading.set(false);
      }
    });
  }

  onSearch() { /* handled via ngModelChange */ }
  setFiltre(f: FiltreStatut) { this.filtreStatut.set(f); this.page.set(1); }
  goPage(p: number) { this.page.set(p); }
  goTo(id: string) { this.router.navigate(['/dashboard/penalites', id]); }
  getCount(statut: string): number { return this.allPenalites().filter(p => p.statut === statut).length; }

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
