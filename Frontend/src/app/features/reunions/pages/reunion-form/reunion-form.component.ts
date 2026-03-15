import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ReunionService } from '../../services/reunion.service';
import { ExerciceService, Exercice } from '../../../exercices/services/exercice.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-reunion-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="page">
      <a routerLink="/dashboard/reunions" class="back-link">
        <span class="material-icons">arrow_back</span> Retour aux réunions
      </a>

      <div class="form-card">
        <h1>Planifier une réunion</h1>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="exerciceId">Exercice *</label>
            <select id="exerciceId" formControlName="exerciceId" [class.invalid]="f['exerciceId'].invalid && f['exerciceId'].touched">
              <option value="">Sélectionner un exercice</option>
              <option *ngFor="let ex of exercices()" [value]="ex.id">{{ ex.libelle }} ({{ ex.tontine?.nom }})</option>
            </select>
            <span *ngIf="f['exerciceId'].invalid && f['exerciceId'].touched" class="error-message">L'exercice est requis</span>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="numeroReunion">Numéro de réunion *</label>
              <input type="number" id="numeroReunion" formControlName="numeroReunion" min="1" max="24" />
            </div>
            <div class="form-group">
              <label for="dateReunion">Date *</label>
              <input type="date" id="dateReunion" formControlName="dateReunion" [class.invalid]="f['dateReunion'].invalid && f['dateReunion'].touched" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="heureDebut">Heure de début</label>
              <input type="time" id="heureDebut" formControlName="heureDebut" />
            </div>
            <div class="form-group">
              <label for="lieu">Lieu</label>
              <input type="text" id="lieu" formControlName="lieu" placeholder="Ex: Domicile de M. Dupont" />
            </div>
          </div>

          <div class="form-actions">
            <a routerLink="/dashboard/reunions" class="btn-secondary">Annuler</a>
            <button type="submit" class="btn-primary" [disabled]="isLoading()">
              <ng-container *ngIf="isLoading(); else saveLabel">
                <span class="spinner-small"></span> Planification...
              </ng-container>
              <ng-template #saveLabel>
                <span class="material-icons">event</span> Planifier
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
export class ReunionFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private reunionService = inject(ReunionService);
  private exerciceService = inject(ExerciceService);
  private router = inject(Router);
  private notification = inject(NotificationService);

  form!: FormGroup;
  isLoading = signal(false);
  exercices = signal<Exercice[]>([]);

  ngOnInit() {
    this.form = this.fb.group({
      exerciceId: ['', Validators.required],
      numeroReunion: [1, [Validators.required, Validators.min(1)]],
      dateReunion: ['', Validators.required],
      heureDebut: [''],
      lieu: ['']
    });
    this.loadExercices();
  }

  loadExercices() {
    this.exerciceService.getAll({ statut: 'OUVERT' }).subscribe({
      next: (res) => this.exercices.set(res.data || []),
      error: () => this.notification.error('Erreur', 'Impossible de charger les exercices')
    });
  }

  get f() { return this.form.controls; }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isLoading.set(true);
    this.reunionService.planifier(this.form.value).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success) {
          this.notification.success('Succès', 'Réunion planifiée');
          this.router.navigate(['/dashboard/reunions']);
        } else {
          this.notification.error('Erreur', res.message || 'Planification échouée');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.notification.error('Erreur', err.error?.message || 'Planification échouée');
      }
    });
  }
}
