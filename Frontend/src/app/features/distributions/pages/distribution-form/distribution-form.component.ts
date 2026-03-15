import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DistributionService } from '../../services/distribution.service';
import { ReunionService, Reunion } from '../../../reunions/services/reunion.service';
import { MembreService, ExerciceMembre } from '../../../membres/services/membre.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-distribution-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="page">
      <a routerLink="/dashboard/distributions" class="back-link">
        <span class="material-icons">arrow_back</span> Retour aux distributions
      </a>

      <div class="form-card">
        <h1>Nouvelle distribution</h1>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="reunionId">Réunion *</label>
            <select id="reunionId" formControlName="reunionId" (change)="onReunionChange()" [class.invalid]="f['reunionId'].invalid && f['reunionId'].touched">
              <option value="">Sélectionner une réunion</option>
              <option *ngFor="let r of reunions()" [value]="r.id">Réunion #{{ r.numeroReunion }} - {{ r.exercice?.tontine?.nom }}</option>
            </select>
            <span *ngIf="f['reunionId'].invalid && f['reunionId'].touched" class="error-message">La réunion est requise</span>
          </div>

          <div class="form-group">
            <label for="exerciceMembreBeneficiaireId">Bénéficiaire *</label>
            <select id="exerciceMembreBeneficiaireId" formControlName="exerciceMembreBeneficiaireId" [class.invalid]="f['exerciceMembreBeneficiaireId'].invalid && f['exerciceMembreBeneficiaireId'].touched">
              <option value="">Sélectionner un membre</option>
              <option *ngFor="let m of membres()" [value]="m.id">{{ m.adhesionTontine?.utilisateur?.prenom }} {{ m.adhesionTontine?.utilisateur?.nom }}</option>
            </select>
            <span *ngIf="f['exerciceMembreBeneficiaireId'].invalid && f['exerciceMembreBeneficiaireId'].touched" class="error-message">Le bénéficiaire est requis</span>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="ordre">Ordre de distribution *</label>
              <input type="number" id="ordre" formControlName="ordre" min="1" />
            </div>
            <div class="form-group">
              <label for="montantBrut">Montant brut (FCFA) *</label>
              <input type="number" id="montantBrut" formControlName="montantBrut" min="0" step="1000" />
            </div>
          </div>

          <div class="form-group">
            <label for="montantRetenu">Montant retenu (FCFA)</label>
            <input type="number" id="montantRetenu" formControlName="montantRetenu" min="0" step="100" />
            <span class="hint">Retenues pour prêts, pénalités, etc.</span>
          </div>

          <div class="form-group">
            <label for="commentaire">Commentaire</label>
            <textarea id="commentaire" formControlName="commentaire" rows="2" placeholder="Notes sur cette distribution..."></textarea>
          </div>

          <div class="form-actions">
            <a routerLink="/dashboard/distributions" class="btn-secondary">Annuler</a>
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
    .form-group input, .form-group select, .form-group textarea { padding: 0.75rem; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 1rem; }
    .form-group input:focus, .form-group select:focus, .form-group textarea:focus { outline: none; border-color: #667eea; box-shadow: 0 0 0 3px rgba(102,126,234,0.1); }
    .form-group input.invalid, .form-group select.invalid { border-color: #ef4444; }
    .form-group textarea { resize: vertical; min-height: 60px; }
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
export class DistributionFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private distributionService = inject(DistributionService);
  private reunionService = inject(ReunionService);
  private membreService = inject(MembreService);
  private router = inject(Router);
  private notification = inject(NotificationService);

  form!: FormGroup;
  isLoading = signal(false);
  reunions = signal<Reunion[]>([]);
  membres = signal<ExerciceMembre[]>([]);

  ngOnInit() {
    this.form = this.fb.group({
      reunionId: ['', Validators.required],
      exerciceMembreBeneficiaireId: ['', Validators.required],
      ordre: [1, [Validators.required, Validators.min(1)]],
      montantBrut: [0, [Validators.required, Validators.min(0)]],
      montantRetenu: [0],
      commentaire: ['']
    });
    this.loadReunions();
  }

  loadReunions() {
    this.reunionService.getAll().subscribe({
      next: (res) => this.reunions.set(res.data || []),
      error: () => {}
    });
  }

  onReunionChange() {
    const reunionId = this.form.get('reunionId')?.value;
    if (reunionId) {
      const reunion = this.reunions().find(r => r.id === reunionId);
      if (reunion?.exerciceId) {
        this.membreService.getExerciceMembres({ exerciceId: reunion.exerciceId, estActif: true }).subscribe({
          next: (res) => this.membres.set(res.data || [])
        });
      }
    }
  }

  get f() { return this.form.controls; }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isLoading.set(true);
    this.distributionService.create(this.form.value).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success) {
          this.notification.success('Succès', 'Distribution créée');
          this.router.navigate(['/dashboard/distributions']);
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
