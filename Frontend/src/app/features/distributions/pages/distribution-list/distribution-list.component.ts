import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DistributionService, Distribution } from '../../services/distribution.service';
import { NotificationService } from '../../../../core/services/notification.service';

type FiltreStatut = 'TOUS' | 'PLANIFIEE' | 'DISTRIBUEE' | 'ANNULEE';

@Component({
  selector: 'app-distribution-list',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, CurrencyPipe, FormsModule],
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

    <div class="filters-bar">
      <div class="search-box">
        <span class="material-icons">search</span>
        <input type="text" [ngModel]="searchTerm()" (ngModelChange)="searchTerm.set($event); page.set(1)" placeholder="Rechercher un bénéficiaire..."/>
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
        <span class="material-icons">savings</span>
        <p>Aucune distribution trouvée</p>
      </div>

      <div *ngIf="filtered().length > 0" class="list">
        <div *ngFor="let d of filtered()" class="card" (click)="goTo(d.id)">
          <div class="card-header">
            <div class="beneficiaire">
              <span class="ordre">#{{ d.ordre }}</span>
              <h3>{{ d.exerciceMembreBeneficiaire?.utilisateur?.prenom }} {{ d.exerciceMembreBeneficiaire?.utilisateur?.nom }}</h3>
            </div>
            <span class="badge" [class]="getStatusClass(d.statut)">{{ getStatusLabel(d.statut) }}</span>
          </div>
          <div class="card-body">
            <div class="amount-row">
              <span class="label">Montant net</span>
              <span class="value">{{ d.montantNet | currency:'XAF':'symbol':'1.0-0':'fr' }}</span>
            </div>
            <div class="amount-row secondary" *ngIf="d.montantRetenu > 0">
              <span class="label">Retenu</span>
              <span class="value-secondary">- {{ d.montantRetenu | currency:'XAF':'symbol':'1.0-0':'fr' }}</span>
            </div>
            <div class="meta">
              <span><span class="material-icons">event</span> {{ d.creeLe | date:'dd/MM/yyyy' }}</span>
              <span class="material-icons arrow">chevron_right</span>
            </div>
          </div>
        </div>
      </div>

      <div class="pagination" *ngIf="totalPages() > 1">
        <button [disabled]="page() === 1" (click)="goPage(page() - 1)">
          <span class="material-icons">chevron_left</span>
        </button>
        <span>Page {{ page() }} / {{ totalPages() }}</span>
        <button [disabled]="page() === totalPages()" (click)="goPage(page() + 1)">
          <span class="material-icons">chevron_right</span>
        </button>
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
    .search-box input { padding: 0.625rem 0.75rem 0.625rem 2.5rem; border: 2px solid var(--border-color, #e5e7eb); border-radius: 8px; font-size: 0.875rem; width: 240px; }
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
    .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; gap: 0.5rem; }
    .beneficiaire { display: flex; align-items: center; gap: 0.5rem; }
    .ordre { font-size: 0.75rem; font-weight: 700; color: var(--primary, #667eea); background: #eef2ff; padding: 0.125rem 0.5rem; border-radius: 4px; }
    .card-header h3 { font-size: 1rem; font-weight: 600; color: var(--text-primary, #1f2937); margin: 0; }
    .badge { padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; white-space: nowrap; }
    .badge.green { background: #d1fae5; color: #065f46; }
    .badge.blue { background: #dbeafe; color: #1e40af; }
    .badge.red { background: #fee2e2; color: #991b1b; }
    .badge.gray { background: #f3f4f6; color: #4b5563; }
    .amount-row { display: flex; justify-content: space-between; margin-bottom: 0.375rem; }
    .amount-row .label { color: var(--text-secondary, #6b7280); font-size: 0.875rem; }
    .amount-row .value { font-weight: 700; color: var(--text-primary, #1f2937); }
    .amount-row.secondary .value-secondary { font-size: 0.875rem; color: #ef4444; }
    .meta { display: flex; align-items: center; justify-content: space-between; margin-top: 0.75rem; color: var(--text-secondary, #6b7280); font-size: 0.8125rem; }
    .meta span { display: flex; align-items: center; gap: 0.25rem; }
    .meta .material-icons { font-size: 0.9rem; }
    .arrow { color: var(--text-secondary, #9ca3af) !important; font-size: 1.25rem !important; }
    .pagination { display: flex; align-items: center; justify-content: center; gap: 1rem; padding: 1.5rem 0 0; }
    .pagination button { display: flex; align-items: center; padding: 0.375rem; border: 1px solid var(--border-color, #e5e7eb); background: white; border-radius: 6px; cursor: pointer; }
    .pagination button:disabled { opacity: 0.4; cursor: not-allowed; }
    .pagination span { font-size: 0.875rem; color: var(--text-secondary, #6b7280); }
  `
})
export class DistributionListComponent implements OnInit {
  private distributionService = inject(DistributionService);
  private notification = inject(NotificationService);
  private router = inject(Router);

  allDistributions = signal<Distribution[]>([]);
  isLoading = signal(true);
  filtreStatut = signal<FiltreStatut>('TOUS');
  searchTerm = signal('');
  page = signal(1);
  readonly limit = 12;

  readonly filtres: { key: FiltreStatut; label: string }[] = [
    { key: 'TOUS', label: 'Toutes' },
    { key: 'PLANIFIEE', label: 'Planifiées' },
    { key: 'DISTRIBUEE', label: 'Distribuées' },
    { key: 'ANNULEE', label: 'Annulées' },
  ];

  private filtered_base = computed(() => {
    let list = this.allDistributions();
    const f = this.filtreStatut();
    const q = this.searchTerm().toLowerCase().trim();
    if (f !== 'TOUS') list = list.filter(d => d.statut === f);
    if (q) list = list.filter(d =>
      d.exerciceMembreBeneficiaire?.utilisateur?.prenom?.toLowerCase().includes(q) ||
      d.exerciceMembreBeneficiaire?.utilisateur?.nom?.toLowerCase().includes(q)
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
    this.loadDistributions();
  }

  loadDistributions() {
    this.isLoading.set(true);
    this.distributionService.getAll({ limit: 200 }).subscribe({
      next: (res) => {
        this.allDistributions.set(res.data || []);
        this.isLoading.set(false);
      },
      error: () => {
        this.notification.error('Erreur', 'Impossible de charger les distributions');
        this.allDistributions.set([]);
        this.isLoading.set(false);
      }
    });
  }

  onSearch() { /* handled via ngModelChange */ }
  setFiltre(f: FiltreStatut) { this.filtreStatut.set(f); this.page.set(1); }
  goPage(p: number) { this.page.set(p); }
  goTo(id: string) { this.router.navigate(['/dashboard/distributions', id]); }
  getCount(statut: string): number { return this.allDistributions().filter(d => d.statut === statut).length; }

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
