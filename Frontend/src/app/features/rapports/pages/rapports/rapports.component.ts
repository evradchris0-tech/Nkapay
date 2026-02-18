import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TontineService } from '../../../tontines/services/tontine.service';
import { NotificationService } from '../../../../core/services/notification.service';

interface ExportOption {
  id: string;
  label: string;
  description: string;
  icon: string;
  type: 'fiche' | 'membres' | 'cotisations' | 'prets';
}

@Component({
  selector: 'app-rapports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <div class="header-left">
        <h1>Rapports & Exports</h1>
        <p>Générez des rapports PDF pour vos tontines</p>
      </div>
    </div>

    <div class="content-grid">
      <!-- Tontine Selection -->
      <div class="card">
        <h3>1. Sélectionner une tontine</h3>
        <select [(ngModel)]="selectedTontineId" class="select-full">
          <option [ngValue]="null">-- Choisir une tontine --</option>
          <ng-container *ngFor="let t of tontines(); trackBy: trackById">
            <option [value]="t.id">{{ t.nom }}</option>
          </ng-container>
        </select>
      </div>

      <!-- Export Options -->
      <div class="card">
        <h3>2. Choisir le type de rapport</h3>
        <div class="export-options">
          <ng-container *ngFor="let option of exportOptions">
            <button 
              class="export-btn"
              [class.selected]="selectedExport === option.id"
              (click)="selectedExport = option.id"
              [disabled]="!selectedTontineId"
            >
              <span class="material-icons">{{ option.icon }}</span>
              <div class="export-info">
                <span class="export-label">{{ option.label }}</span>
                <span class="export-desc">{{ option.description }}</span>
              </div>
            </button>
          </ng-container>
        </div>
      </div>

      <!-- Generate Button -->
      <div class="card actions-card">
        <button 
          class="btn-primary"
          [disabled]="!selectedTontineId || !selectedExport || isLoading()"
          (click)="generateReport()"
        >
          <ng-container *ngIf="isLoading(); else notLoading">
            <span class="spinner"></span>
            Génération en cours...
          </ng-container>
          <ng-template #notLoading>
            <span class="material-icons">download</span>
            Télécharger le PDF
          </ng-template>
        </button>
      </div>
    </div>
  `,
  styles: `
    .page-header { margin-bottom: 1.5rem; }
    .page-header h1 { font-size: 1.75rem; font-weight: 700; color: #1f2937; margin: 0; }
    .page-header p { color: #6b7280; margin-top: 0.25rem; }

    .content-grid { display: flex; flex-direction: column; gap: 1.5rem; max-width: 600px; }

    .card { background: white; border-radius: 12px; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .card h3 { font-size: 1rem; font-weight: 600; color: #1f2937; margin: 0 0 1rem; }

    .select-full { width: 100%; padding: 0.75rem; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 1rem; }
    .select-full:focus { outline: none; border-color: #667eea; }

    .export-options { display: flex; flex-direction: column; gap: 0.75rem; }

    .export-btn {
      display: flex; align-items: center; gap: 1rem;
      padding: 1rem; border: 2px solid #e5e7eb; border-radius: 8px;
      background: white; cursor: pointer; transition: all 0.2s; text-align: left;

      &:hover:not(:disabled) { border-color: #667eea; background: #f9fafb; }
      &.selected { border-color: #667eea; background: rgba(102, 126, 234, 0.1); }
      &:disabled { opacity: 0.5; cursor: not-allowed; }

      .material-icons { font-size: 1.5rem; color: #667eea; }
      .export-info { display: flex; flex-direction: column; }
      .export-label { font-weight: 500; color: #1f2937; }
      .export-desc { font-size: 0.75rem; color: #6b7280; }
    }

    .actions-card { text-align: center; }

    .btn-primary {
      display: inline-flex; align-items: center; gap: 0.5rem;
      padding: 1rem 2rem; background: linear-gradient(135deg, #667eea, #764ba2);
      color: white; border: none; border-radius: 8px; font-size: 1rem; font-weight: 500;
      cursor: pointer; transition: all 0.2s;

      &:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4); }
      &:disabled { opacity: 0.7; cursor: not-allowed; }
    }

    .spinner { width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `
})
export class RapportsComponent {
  private tontineService = inject(TontineService);
  private notification = inject(NotificationService);

  tontines = signal<{ id: string; nom: string }[]>([]);
  isLoading = signal(false);
  selectedTontineId: string | null = null;
  selectedExport: string | null = null;

  exportOptions: ExportOption[] = [
    { id: 'fiche', label: 'Fiche complète', description: 'Informations détaillées de la tontine', icon: 'description', type: 'fiche' },
    { id: 'membres', label: 'Liste des membres', description: 'Tous les membres avec leurs rôles', icon: 'people', type: 'membres' },
    { id: 'cotisations', label: 'État des cotisations', description: 'Résumé des cotisations par membre', icon: 'payments', type: 'cotisations' },
    { id: 'prets', label: 'Liste des prêts', description: 'Prêts en cours et remboursements', icon: 'credit_score', type: 'prets' }
  ];

  constructor() {
    this.loadTontines();
  }

  loadTontines() {
    this.tontineService.getAll().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.tontines.set(response.data.map(t => ({ id: String(t.id!), nom: t.nom })));
        }
      },
      error: () => {
        this.notification.error('Erreur', 'Impossible de charger les tontines');
        this.tontines.set([]);
      }
    });
  }

  generateReport() {
    if (!this.selectedTontineId || !this.selectedExport) return;

    const option = this.exportOptions.find(o => o.id === this.selectedExport);
    if (!option) return;

    this.isLoading.set(true);

    this.tontineService.exportPdf(this.selectedTontineId, option.type).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tontine-${this.selectedTontineId}-${option.type}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.notification.success('Export réussi', 'Le PDF a été téléchargé');
        this.isLoading.set(false);
      },
      error: () => {
        this.notification.error('Erreur', "Impossible de générer le rapport");
        this.isLoading.set(false);
      }
    });
  }

  trackById(index: number, item: { id: string }) {
    return item.id;
  }
}
