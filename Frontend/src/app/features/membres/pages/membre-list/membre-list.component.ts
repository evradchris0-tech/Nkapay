import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MembreService, AdhesionTontine } from '../../services/membre.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-membre-list',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, FormsModule],
  template: `
    <div class="page-header">
      <div class="header-left">
        <h1>Membres</h1>
        <p>Gérez les membres de vos tontines</p>
      </div>
    </div>

    <div class="filters-bar">
      <div class="search-box">
        <span class="material-icons">search</span>
        <input type="text" [ngModel]="searchTerm()" (ngModelChange)="searchTerm.set($event)" placeholder="Nom, matricule, tontine..."/>
      </div>
      <div class="status-tabs">
        <button class="tab" [class.active]="filtreActif() === null" (click)="filtreActif.set(null)">Tous</button>
        <button class="tab" [class.active]="filtreActif() === true" (click)="filtreActif.set(true)">
          Actifs <span class="count">{{ getCount(true) }}</span>
        </button>
        <button class="tab" [class.active]="filtreActif() === false" (click)="filtreActif.set(false)">
          Inactifs <span class="count">{{ getCount(false) }}</span>
        </button>
      </div>
    </div>

    <ng-container *ngIf="isLoading(); else content">
      <div class="loading"><div class="spinner"></div></div>
    </ng-container>

    <ng-template #content>
      <div *ngIf="filtered().length === 0" class="empty-state">
        <span class="material-icons">people</span>
        <p>Aucun membre trouvé</p>
      </div>

      <div *ngIf="filtered().length > 0" class="list">
        <div *ngFor="let m of filtered()" class="card" [routerLink]="[m.id]">
          <div class="card-header">
            <div class="avatar">{{ getInitials(m) }}</div>
            <div class="info">
              <h3>{{ m.utilisateur?.prenom }} {{ m.utilisateur?.nom }}</h3>
              <span class="matricule">{{ m.matricule }}</span>
            </div>
            <span class="badge" [class]="m.statut === 'ACTIVE' ? 'green' : 'gray'">{{ m.statut === 'ACTIVE' ? 'Actif' : 'Inactif' }}</span>
          </div>
          <div class="card-body">
            <p><span class="material-icons">business</span> {{ m.tontine?.nom || 'N/A' }}</p>
            <p><span class="material-icons">badge</span> {{ getRoleLabel(m.role) }}</p>
            <p><span class="material-icons">phone</span> {{ m.utilisateur?.telephone1 }}</p>
            <p><span class="material-icons">event</span> Depuis {{ m.dateAdhesionTontine | date:'dd/MM/yyyy' }}</p>
          </div>
        </div>
      </div>
    </ng-template>
  `,
  styles: `
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .page-header h1 { font-size: 1.75rem; font-weight: 700; color: var(--text-primary, #1f2937); margin: 0; }
    .page-header p { color: var(--text-secondary, #6b7280); margin-top: 0.25rem; }
    .filters-bar { display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; align-items: center; }
    .search-box { position: relative; display: flex; align-items: center; }
    .search-box .material-icons { position: absolute; left: 0.75rem; color: var(--text-secondary, #6b7280); font-size: 1.125rem; }
    .search-box input { padding: 0.625rem 0.75rem 0.625rem 2.5rem; border: 2px solid var(--border-color, #e5e7eb); border-radius: 8px; font-size: 0.875rem; width: 240px; }
    .search-box input:focus { outline: none; border-color: var(--primary, #667eea); }
    .status-tabs { display: flex; gap: 0.25rem; }
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
    .list { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); }
    .card { background: white; border-radius: 12px; padding: 1.25rem; cursor: pointer; transition: all 0.15s; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
    .card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .card-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; }
    .avatar { width: 48px; height: 48px; flex-shrink: 0; border-radius: 50%; background: var(--primary-gradient, linear-gradient(135deg, #667eea, #764ba2)); color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 1rem; }
    .info { flex: 1; min-width: 0; }
    .info h3 { font-size: 1rem; font-weight: 600; color: var(--text-primary, #1f2937); margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .matricule { font-size: 0.75rem; color: var(--text-secondary, #6b7280); }
    .badge { padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; white-space: nowrap; }
    .badge.green { background: #d1fae5; color: #065f46; }
    .badge.gray { background: #f3f4f6; color: #4b5563; }
    .card-body p { display: flex; align-items: center; gap: 0.5rem; color: var(--text-secondary, #6b7280); font-size: 0.875rem; margin: 0.5rem 0; }
    .card-body .material-icons { font-size: 1rem; }
  `
})
export class MembreListComponent implements OnInit {
  private membreService = inject(MembreService);
  private notification = inject(NotificationService);
  private authService = inject(AuthService);

  allMembres = signal<AdhesionTontine[]>([]);
  isLoading = signal(true);
  searchTerm = signal('');
  filtreActif = signal<boolean | null>(null);

  filtered = computed(() => {
    let list = this.allMembres();
    const fa = this.filtreActif();
    const q = this.searchTerm().toLowerCase().trim();
    if (fa !== null) list = list.filter(m => (m.statut === 'ACTIVE') === fa);
    if (q) list = list.filter(m =>
      m.utilisateur?.prenom?.toLowerCase().includes(q) ||
      m.utilisateur?.nom?.toLowerCase().includes(q) ||
      m.matricule?.toLowerCase().includes(q) ||
      m.tontine?.nom?.toLowerCase().includes(q)
    );
    return list;
  });

  ngOnInit() {
    this.loadMembres();
  }

  loadMembres() {
    const currentUser = this.authService.currentUser();
    if (!currentUser) {
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.membreService.getAdhesionsByUser(currentUser.id).subscribe({
      next: (res) => {
        this.allMembres.set(res.data || []);
        this.isLoading.set(false);
      },
      error: () => {
        this.notification.error('Erreur', 'Impossible de charger les membres');
        this.allMembres.set([]);
        this.isLoading.set(false);
      }
    });
  }

  getCount(actif: boolean): number { return this.allMembres().filter(m => (m.statut === 'ACTIVE') === actif).length; }

  getInitials(m: AdhesionTontine): string {
    const prenom = m.utilisateur?.prenom || '';
    const nom = m.utilisateur?.nom || '';
    return (prenom.charAt(0) + nom.charAt(0)).toUpperCase();
  }

  getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      'PRESIDENT': 'Président',
      'VICE_PRESIDENT': 'Vice-Président',
      'TRESORIER': 'Trésorier',
      'SECRETAIRE': 'Secrétaire',
      'COMMISSAIRE': 'Commissaire',
      'MEMBRE': 'Membre'
    };
    return labels[role] || role;
  }
}
