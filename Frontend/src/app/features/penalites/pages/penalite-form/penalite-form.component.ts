import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PenaliteService, TypePenalite } from '../../services/penalite.service';
import { ReunionService, Reunion } from '../../../reunions/services/reunion.service';
import { MembreService, ExerciceMembre } from '../../../membres/services/membre.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-penalite-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="page">
      <a routerLink="/dashboard/penalites" class="back-link">
        <span class="material-icons">arrow_back</span> Retour aux pénalités
      </a>

      <div class="form-card">
        <h1>Nouvelle pénalité</h1>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="exerciceMembreId">Membre *</label>
            <select id="exerciceMembreId" formControlName="exerciceMembreId" [class.invalid]="f['exerciceMembreId'].invalid && f['exerciceMembreId'].touched">
              <option value="">Sélectionner un membre</option>
              <option *ngFor="let m of membres()" [value]="m.id">{{ m.adhesionTontine?.utilisateur?.prenom }} {{ m.adhesionTontine?.utilisateur?.nom }}</option>
            </select>
            <span *ngIf="f['exerciceMembreId'].invalid && f['exerciceMembreId'].touched" class="error-message">Le membre est requis</span>
          </div>

          <div class="form-group">
            <label for="reunionId">Réunion (optionnel)</label>
            <select id="reunionId" formControlName="reunionId">
              <option value="">Aucune</option>
              <option *ngFor="let r of reunions()" [value]="r.id">Réunion #{{ r.numeroReunion }}</option>
            </select>
          </div>

          <div class="form-group">
            <label for="typePenaliteId">Type de pénalité *</label>
            <select id="typePenaliteId" formControlName="typePenaliteId" (change)="onTypeChange()" [class.invalid]="f['typePenaliteId'].invalid && f['typePenaliteId'].touched">
              <option value="">Sélectionner un type</option>
              <option *ngFor="let t of typesPenalite()" [value]="t.id">{{ t.libelle }} ({{ t.montantDefaut | number }} FCFA)</option>
            </select>
            <span *ngIf="f['typePenaliteId'].invalid && f['typePenaliteId'].touched" class="error-message">Le type est requis</span>
          </div>

          <div class="form-group">
            <label for="montant">Montant (FCFA) *</label>
            <input type="number" id="montant" formControlName="montant" min="100" step="100" [class.invalid]="f['montant'].invalid && f['montant'].touched" />
            <span *ngIf="f['montant'].invalid && f['montant'].touched" class="error-message">Montant minimum 100 FCFA</span>
          </div>

          <div class="form-group">
            <label for="motif">Motif</label>
            <textarea id="motif" formControlName="motif" rows="2" placeholder="Raison de la pénalité..."></textarea>
          </div>

          <div class="form-actions">
            <a routerLink="/dashboard/penalites" class="btn-secondary">Annuler</a>
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
    .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
    .form-group label { font-size: 0.875rem; font-weight: 500; color: #1f2937; }
    .form-group input, .form-group select, .form-group textarea { padding: 0.75rem; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 1rem; }
    .form-group input:focus, .form-group select:focus, .form-group textarea:focus { outline: none; border-color: #667eea; box-shadow: 0 0 0 3px rgba(102,126,234,0.1); }
    .form-group input.invalid, .form-group select.invalid { border-color: #ef4444; }
    .form-group textarea { resize: vertical; min-height: 60px; }
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
export class PenaliteFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private penaliteService = inject(PenaliteService);
  private reunionService = inject(ReunionService);
  private membreService = inject(MembreService);
  private router = inject(Router);
  private notification = inject(NotificationService);

  form!: FormGroup;
  isLoading = signal(false);
  reunions = signal<Reunion[]>([]);
  membres = signal<ExerciceMembre[]>([]);
  typesPenalite = signal<TypePenalite[]>([]);

  ngOnInit() {
    this.form = this.fb.group({
      exerciceMembreId: ['', Validators.required],
      reunionId: [''],
      typePenaliteId: ['', Validators.required],
      montant: [1000, [Validators.required, Validators.min(100)]],
      motif: ['']
    });
    this.loadData();
  }

  loadData() {
    this.reunionService.getAll().subscribe({
      next: (res) => this.reunions.set(res.data || [])
    });
    this.membreService.getExerciceMembres({ estActif: true }).subscribe({
      next: (res) => this.membres.set(res.data || [])
    });
    this.penaliteService.getTypes().subscribe({
      next: (res) => this.typesPenalite.set(res.data || [])
    });
  }

  onTypeChange() {
    const typeId = this.form.get('typePenaliteId')?.value;
    const type = this.typesPenalite().find(t => t.id === typeId);
    if (type) {
      this.form.patchValue({ montant: type.montantDefaut });
    }
  }

  get f() { return this.form.controls; }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isLoading.set(true);
    const data = { ...this.form.value };
    if (!data.reunionId) delete data.reunionId;

    this.penaliteService.create(data).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success) {
          this.notification.success('Succès', 'Pénalité créée');
          this.router.navigate(['/dashboard/penalites']);
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
