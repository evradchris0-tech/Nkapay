import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { TontineService } from '../../services/tontine.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ApiService } from '../../../../core/services/api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Tontine } from '../../../../core/models/tontine.model';

@Component({
  selector: 'app-adhesion-request',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="request-container">
      <a routerLink="/dashboard/tontines/recherche" class="back-link">
        <span class="material-icons">arrow_back</span>
        Retour à la recherche
      </a>

      <div *ngIf="isLoadingTontine()" class="loading-card">
        <div class="spinner"></div>
        <p>Chargement de la tontine...</p>
      </div>

      <div *ngIf="!isLoadingTontine() && tontine()" class="request-card">
        <div class="tontine-header">
          <div class="tontine-logo">
            <span class="material-icons">account_balance</span>
          </div>
          <div class="tontine-info">
            <h2>{{ tontine()?.nom }}</h2>
            <span class="code">{{ tontine()?.nomCourt }}</span>
            <p class="motto" *ngIf="tontine()?.motto">« {{ tontine()?.motto }} »</p>
          </div>
        </div>

        <div class="tontine-details">
          <div class="detail-item">
            <span class="material-icons">people</span>
            <span>{{ tontine()?.nombreMembres || 0 }} membres</span>
          </div>
          <div class="detail-item">
            <span class="material-icons">calendar_today</span>
            <span>Fondée en {{ tontine()?.anneeFondation || '-' }}</span>
          </div>
          <div class="detail-item">
            <span class="material-icons">verified</span>
            <span class="status active">Tontine active</span>
          </div>
        </div>

        <div class="request-form-section">
          <h3>
            <span class="material-icons">person_add</span>
            Demande d'adhésion
          </h3>
          <p class="info-text">
            Votre demande sera envoyée aux administrateurs de la tontine pour validation.
            Vous serez notifié de leur décision.
          </p>

          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label for="message">Message de motivation (optionnel)</label>
              <textarea 
                id="message" 
                formControlName="message"
                rows="4"
                placeholder="Présentez-vous et expliquez pourquoi vous souhaitez rejoindre cette tontine..."
              ></textarea>
              <span class="char-count">{{ form.value.message?.length || 0 }} / 500</span>
            </div>

            <div class="form-group checkbox-group">
              <label class="checkbox-label">
                <input type="checkbox" formControlName="acceptRules" />
                <span class="checkmark"></span>
                <span>J'accepte de respecter les règles et statuts de cette tontine</span>
              </label>
              <span class="error" *ngIf="f['acceptRules'].invalid && f['acceptRules'].touched">
                Vous devez accepter les règles pour continuer
              </span>
            </div>

            <div class="form-actions">
              <a routerLink="/dashboard/tontines/recherche" class="btn-cancel">Annuler</a>
              <button type="submit" class="btn-submit" [disabled]="isLoading() || form.invalid">
                <ng-container *ngIf="isLoading(); else submitLabel">
                  <span class="spinner-sm"></span>
                  Envoi en cours...
                </ng-container>
                <ng-template #submitLabel>
                  <span class="material-icons">send</span>
                  Envoyer ma demande
                </ng-template>
              </button>
            </div>
          </form>
        </div>

        <div class="info-box">
          <span class="material-icons">info</span>
          <div>
            <strong>Processus de validation</strong>
            <p>
              Les administrateurs de la tontine examineront votre demande dans un délai de 
              48 à 72 heures. Vous recevrez une notification avec leur décision.
            </p>
          </div>
        </div>
      </div>

      <div *ngIf="!isLoadingTontine() && !tontine()" class="error-card">
        <span class="material-icons">error_outline</span>
        <h3>Tontine introuvable</h3>
        <p>Cette tontine n'existe pas ou n'est plus disponible.</p>
        <a routerLink="/dashboard/tontines/recherche" class="btn-primary">
          Retour à la recherche
        </a>
      </div>
    </div>
  `,
  styles: [`
    .request-container {
      max-width: 700px;
      margin: 0 auto;
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      color: #64748b;
      text-decoration: none;
      margin-bottom: 1.5rem;
      font-weight: 500;
      transition: color 0.2s;

      &:hover {
        color: #3b82f6;
      }
    }

    .loading-card, .error-card {
      background: white;
      border-radius: 12px;
      padding: 4rem 2rem;
      text-align: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);

      .material-icons {
        font-size: 3rem;
        margin-bottom: 1rem;
        color: #94a3b8;
      }

      h3 {
        margin: 0 0 0.5rem;
        color: #1e293b;
      }

      p {
        color: #64748b;
        margin: 0 0 1.5rem;
      }
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e2e8f0;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .request-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      overflow: hidden;
    }

    .tontine-header {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      padding: 1.5rem;
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      color: white;

      .tontine-logo {
        width: 64px;
        height: 64px;
        border-radius: 16px;
        background: rgba(255,255,255,0.2);
        display: flex;
        align-items: center;
        justify-content: center;

        .material-icons {
          font-size: 2rem;
        }
      }

      .tontine-info {
        h2 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 700;
        }

        .code {
          opacity: 0.8;
          font-size: 0.875rem;
        }

        .motto {
          margin: 0.5rem 0 0;
          font-style: italic;
          opacity: 0.9;
          font-size: 0.9375rem;
        }
      }
    }

    .tontine-details {
      display: flex;
      gap: 2rem;
      padding: 1rem 1.5rem;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      flex-wrap: wrap;

      .detail-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        color: #475569;

        .material-icons {
          font-size: 1.125rem;
          color: #3b82f6;
        }

        .status.active {
          color: #059669;
          font-weight: 500;
        }
      }
    }

    .request-form-section {
      padding: 1.5rem;

      h3 {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin: 0 0 0.5rem;
        font-size: 1.125rem;
        color: #1e293b;

        .material-icons {
          color: #3b82f6;
        }
      }

      .info-text {
        color: #64748b;
        margin: 0 0 1.5rem;
        font-size: 0.875rem;
      }
    }

    .form-group {
      margin-bottom: 1.5rem;

      label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: #374151;
        font-size: 0.875rem;
      }

      textarea {
        width: 100%;
        padding: 0.875rem 1rem;
        border: 2px solid #e2e8f0;
        border-radius: 10px;
        font-size: 0.9375rem;
        font-family: inherit;
        resize: vertical;
        transition: all 0.2s;

        &:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        &::placeholder {
          color: #94a3b8;
        }
      }

      .char-count {
        display: block;
        text-align: right;
        font-size: 0.75rem;
        color: #94a3b8;
        margin-top: 0.25rem;
      }

      .error {
        display: block;
        margin-top: 0.25rem;
        font-size: 0.75rem;
        color: #ef4444;
      }
    }

    .checkbox-group {
      .checkbox-label {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        cursor: pointer;
        font-size: 0.875rem;
        color: #475569;

        input[type="checkbox"] {
          width: 18px;
          height: 18px;
          margin-top: 0.125rem;
          accent-color: #3b82f6;
          cursor: pointer;
        }
      }
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid #e2e8f0;

      .btn-cancel {
        padding: 0.75rem 1.5rem;
        background: #f1f5f9;
        color: #475569;
        border: none;
        border-radius: 8px;
        font-weight: 500;
        text-decoration: none;
        cursor: pointer;
        transition: background 0.2s;

        &:hover {
          background: #e2e8f0;
        }
      }

      .btn-submit {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.5rem;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;

        &:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
        }

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .spinner-sm {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
      }
    }

    .info-box {
      display: flex;
      gap: 1rem;
      padding: 1.25rem 1.5rem;
      background: #eff6ff;
      border-top: 1px solid #dbeafe;

      > .material-icons {
        color: #3b82f6;
        flex-shrink: 0;
      }

      strong {
        display: block;
        color: #1e40af;
        font-size: 0.875rem;
        margin-bottom: 0.25rem;
      }

      p {
        margin: 0;
        font-size: 0.8125rem;
        color: #3b82f6;
        line-height: 1.5;
      }
    }

    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      color: white;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 500;
      transition: all 0.2s;

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
      }
    }
  `]
})
export class AdhesionRequestComponent implements OnInit {
  private fb = inject(FormBuilder);
  private tontineService = inject(TontineService);
  private api = inject(ApiService);
  private authService = inject(AuthService);
  private notification = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  form: FormGroup;
  tontine = signal<Tontine | null>(null);
  isLoading = signal(false);
  isLoadingTontine = signal(true);

  constructor() {
    this.form = this.fb.group({
      message: ['', [Validators.maxLength(500)]],
      acceptRules: [false, [Validators.requiredTrue]]
    });
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadTontine(id);
    } else {
      this.isLoadingTontine.set(false);
    }
  }

  loadTontine(id: string) {
    this.tontineService.getById(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.tontine.set(response.data);
        }
        this.isLoadingTontine.set(false);
      },
      error: () => {
        this.isLoadingTontine.set(false);
        this.notification.error('Erreur', 'Impossible de charger la tontine');
      }
    });
  }

  get f() {
    return this.form.controls;
  }

  onSubmit() {
    if (this.form.invalid || !this.tontine()) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);

    const currentUser = this.authService.currentUser();
    if (!currentUser) {
      this.notification.error('Erreur', 'Vous devez être connecté');
      return;
    }

    const data = {
      utilisateurId: currentUser.id,
      tontineId: this.tontine()!.id,
      message: this.form.value.message || ''
    };

    this.api.post('/demandes-adhesion', data).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.notification.success('Demande envoyée', 'Votre demande d\'adhésion a été soumise avec succès');
        this.router.navigate(['/dashboard/tontines']);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.notification.error('Erreur', error.error?.message || 'Impossible d\'envoyer la demande');
      }
    });
  }
}
