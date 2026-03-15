import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ExerciceService } from '../../services/exercice.service';
import { TontineService } from '../../../tontines/services/tontine.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-exercice-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="page">
      <a routerLink="/dashboard/exercices" class="back-link">
        <span class="material-icons">arrow_back</span> Retour aux exercices
      </a>

      <div class="form-card">
        <h1>Nouvel exercice</h1>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="tontineId">Tontine *</label>
            <select id="tontineId" formControlName="tontineId" [class.invalid]="f['tontineId'].invalid && f['tontineId'].touched">
              <option value="">Sélectionner une tontine</option>
              <option *ngFor="let t of tontines()" [value]="t.id">{{ t.nom }}</option>
            </select>
            <span *ngIf="f['tontineId'].invalid && f['tontineId'].touched" class="error-message">La tontine est requise</span>
          </div>

          <div class="form-group">
            <label for="libelle">Libellé *</label>
            <input type="text" id="libelle" formControlName="libelle" placeholder="Ex: Exercice 2026" [class.invalid]="f['libelle'].invalid && f['libelle'].touched" />
            <span *ngIf="f['libelle'].invalid && f['libelle'].touched" class="error-message">Le libellé est requis</span>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="anneeDebut">Année de début *</label>
              <input type="number" id="anneeDebut" formControlName="anneeDebut" min="2020" max="2100" />
            </div>
            <div class="form-group">
              <label for="moisDebut">Mois de début *</label>
              <select id="moisDebut" formControlName="moisDebut">
                <option *ngFor="let m of mois" [value]="m.value">{{ m.label }}</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label for="dureeMois">Durée (mois) *</label>
            <input type="number" id="dureeMois" formControlName="dureeMois" min="1" max="24" />
            <span class="hint">Généralement 12 mois pour un exercice annuel</span>
          </div>

          <div class="form-actions">
            <a routerLink="/dashboard/exercices" class="btn-secondary">Annuler</a>
            <button type="submit" class="btn-primary" [disabled]="isLoading()">
              <ng-container *ngIf="isLoading(); else saveLabel">
                <span class="spinner-small"></span> Création...
              </ng-container>
              <ng-template #saveLabel>
                <span class="material-icons">save</span> Créer
              </ng-template>
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: `
    .page { max-width: 600px; margin: 0 auto; }
    .back-link { display: inline-flex; align-items: center; gap: 0.5rem; color: #6b7280; text-decoration: none; margin-bottom: 1rem; font-size: 0.875rem; }
    .back-link:hover { color: #667eea; }
    .form-card { background: white; border-radius: 12px; padding: 2rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .form-card h1 { font-size: 1.5rem; font-weight: 700; color: #1f2937; margin: 0 0 1.5rem; }
    form { display: flex; flex-direction: column; gap: 1.25rem; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
    .form-group label { font-size: 0.875rem; font-weight: 500; color: #1f2937; }
    .form-group input, .form-group select { padding: 0.75rem; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 1rem; }
    .form-group input:focus, .form-group select:focus { outline: none; border-color: #667eea; box-shadow: 0 0 0 3px rgba(102,126,234,0.1); }
    .form-group input.invalid, .form-group select.invalid { border-color: #ef4444; }
    .error-message { font-size: 0.75rem; color: #ef4444; }
    .hint { font-size: 0.75rem; color: #6b7280; }
    .form-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1rem; padding-top: 1.5rem; border-top: 1px solid #e5e7eb; }
    .btn-primary { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.5rem; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; border-radius: 8px; font-size: 0.875rem; font-weight: 500; cursor: pointer; }
    .btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(102,126,234,0.4); }
    .btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
    .btn-secondary { display: inline-flex; align-items: center; padding: 0.75rem 1.5rem; background: white; color: #1f2937; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 0.875rem; text-decoration: none; }
    .btn-secondary:hover { background: #f9fafb; }
    .spinner-small { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `
})
export class ExerciceFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private exerciceService = inject(ExerciceService);
  private tontineService = inject(TontineService);
  private router = inject(Router);
  private notification = inject(NotificationService);

  form!: FormGroup;
  isLoading = signal(false);
  tontines = signal<{id: string; nom: string}[]>([]);

  mois = [
    { value: 1, label: 'Janvier' }, { value: 2, label: 'Février' }, { value: 3, label: 'Mars' },
    { value: 4, label: 'Avril' }, { value: 5, label: 'Mai' }, { value: 6, label: 'Juin' },
    { value: 7, label: 'Juillet' }, { value: 8, label: 'Août' }, { value: 9, label: 'Septembre' },
    { value: 10, label: 'Octobre' }, { value: 11, label: 'Novembre' }, { value: 12, label: 'Décembre' }
  ];

  ngOnInit() {
    const now = new Date();
    this.form = this.fb.group({
      tontineId: ['', Validators.required],
      libelle: ['', [Validators.required, Validators.minLength(3)]],
      anneeDebut: [now.getFullYear(), [Validators.required, Validators.min(2020)]],
      moisDebut: [now.getMonth() + 1, Validators.required],
      dureeMois: [12, [Validators.required, Validators.min(1), Validators.max(24)]]
    });
    this.loadTontines();
  }

  loadTontines() {
    this.tontineService.getAll().subscribe({
      next: (res) => this.tontines.set(res.data || []),
      error: () => this.notification.error('Erreur', 'Impossible de charger les tontines')
    });
  }

  get f() { return this.form.controls; }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isLoading.set(true);
    
    const formValue = this.form.value;
    
    // Calculer anneeFin et moisFin
    let moisFin = formValue.moisDebut + formValue.dureeMois - 1;
    let anneeFin = formValue.anneeDebut;
    
    while (moisFin > 12) {
      moisFin -= 12;
      anneeFin++;
    }
    
    const data = {
      ...formValue,
      anneeFin,
      moisFin
    };
    
    this.exerciceService.create(data).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success) {
          this.notification.success('Succès', 'Exercice créé');
          this.router.navigate(['/dashboard/exercices']);
        } else {
          this.notification.error('Erreur', res.message || 'Création échouée');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.notification.error('Erreur', err.error?.message || 'Création échouée');
      }
    });
  }
}
