import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { UtilisateurService } from '../../services/utilisateur.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Utilisateur } from '../../../../core/models/user.model';

@Component({
  selector: 'app-utilisateur-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="form-container">
      <a routerLink="/dashboard/admin" class="back-link">
        <span class="material-icons">arrow_back</span>
        Retour à la liste
      </a>

      <div class="form-card">
        <div class="form-header">
          <h2>
            <span class="material-icons">{{ isEditMode() ? 'edit' : 'person_add' }}</span>
            {{ isEditMode() ? 'Modifier l\\'utilisateur' : 'Nouvel utilisateur' }}
          </h2>
          <p *ngIf="!isEditMode()">Créez un nouveau compte utilisateur</p>
          <p *ngIf="isEditMode() && currentUser()">
            Modification de {{ currentUser()?.prenom }} {{ currentUser()?.nom }}
          </p>
        </div>

        <div *ngIf="isLoadingUser()" class="loading-state">
          <div class="spinner"></div>
          <p>Chargement...</p>
        </div>

        <form *ngIf="!isLoadingUser()" [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="form-row">
            <div class="form-group">
              <label for="prenom">Prénom *</label>
              <input 
                type="text" 
                id="prenom" 
                formControlName="prenom"
                placeholder="Prénom"
                [class.invalid]="f['prenom'].invalid && f['prenom'].touched"
              />
              <span class="error" *ngIf="f['prenom'].invalid && f['prenom'].touched">
                Le prénom est requis
              </span>
            </div>

            <div class="form-group">
              <label for="nom">Nom *</label>
              <input 
                type="text" 
                id="nom" 
                formControlName="nom"
                placeholder="Nom"
                [class.invalid]="f['nom'].invalid && f['nom'].touched"
              />
              <span class="error" *ngIf="f['nom'].invalid && f['nom'].touched">
                Le nom est requis
              </span>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="telephone1">Téléphone principal *</label>
              <div class="phone-input">
                <span class="prefix">+237</span>
                <input 
                  type="tel" 
                  id="telephone1" 
                  formControlName="telephone1"
                  placeholder="6XXXXXXXX"
                  [class.invalid]="f['telephone1'].invalid && f['telephone1'].touched"
                />
              </div>
              <span class="error" *ngIf="f['telephone1'].invalid && f['telephone1'].touched">
                Numéro de téléphone invalide (9 chiffres)
              </span>
            </div>

            <div class="form-group">
              <label for="telephone2">Téléphone secondaire</label>
              <div class="phone-input">
                <span class="prefix">+237</span>
                <input 
                  type="tel" 
                  id="telephone2" 
                  formControlName="telephone2"
                  placeholder="6XXXXXXXX"
                />
              </div>
            </div>
          </div>

          <div class="form-group" *ngIf="!isEditMode()">
            <label for="password">Mot de passe temporaire *</label>
            <div class="password-input">
              <input 
                [type]="showPassword() ? 'text' : 'password'" 
                id="password" 
                formControlName="password"
                placeholder="Minimum 4 caractères"
                [class.invalid]="f['password'].invalid && f['password'].touched"
              />
              <button type="button" class="toggle-btn" (click)="togglePassword()">
                <span class="material-icons">
                  {{ showPassword() ? 'visibility_off' : 'visibility' }}
                </span>
              </button>
            </div>
            <span class="error" *ngIf="f['password'].invalid && f['password'].touched">
              Minimum 4 caractères requis
            </span>
            <span class="hint">L'utilisateur devra changer ce mot de passe à la première connexion</span>
          </div>

          <div class="form-group">
            <label for="adresseResidence">Adresse de résidence</label>
            <input 
              type="text" 
              id="adresseResidence" 
              formControlName="adresseResidence"
              placeholder="Quartier, Ville"
            />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="nomContactUrgence">Contact d'urgence (Nom)</label>
              <input 
                type="text" 
                id="nomContactUrgence" 
                formControlName="nomContactUrgence"
                placeholder="Nom du contact"
              />
            </div>

            <div class="form-group">
              <label for="telContactUrgence">Contact d'urgence (Téléphone)</label>
              <input 
                type="tel" 
                id="telContactUrgence" 
                formControlName="telContactUrgence"
                placeholder="+237XXXXXXXXX"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="numeroMobileMoney">MTN Mobile Money</label>
              <input 
                type="tel" 
                id="numeroMobileMoney" 
                formControlName="numeroMobileMoney"
                placeholder="6XXXXXXXX"
              />
            </div>

            <div class="form-group">
              <label for="numeroOrangeMoney">Orange Money</label>
              <input 
                type="tel" 
                id="numeroOrangeMoney" 
                formControlName="numeroOrangeMoney"
                placeholder="6XXXXXXXX"
              />
            </div>
          </div>

          <div class="form-actions">
            <a routerLink="/dashboard/admin" class="btn-cancel">Annuler</a>
            <button type="submit" class="btn-submit" [disabled]="isLoading()">
              <ng-container *ngIf="isLoading(); else submitLabel">
                <span class="spinner-sm"></span>
                Enregistrement...
              </ng-container>
              <ng-template #submitLabel>
                <span class="material-icons">save</span>
                {{ isEditMode() ? 'Mettre à jour' : 'Créer l\\'utilisateur' }}
              </ng-template>
            </button>
          </div>
        </form>

        <div *ngIf="isEditMode() && currentUser()" class="admin-actions">
          <h3>Actions administrateur</h3>
          <div class="action-buttons">
            <button class="btn-action" (click)="resetPassword()" [disabled]="isResetting()">
              <span class="material-icons">lock_reset</span>
              Réinitialiser le mot de passe
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .form-container {
      max-width: 800px;
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

    .form-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      overflow: hidden;
    }

    .form-header {
      padding: 1.5rem 2rem;
      border-bottom: 1px solid #e2e8f0;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);

      h2 {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin: 0;
        font-size: 1.5rem;
        color: #1e293b;

        .material-icons {
          color: #3b82f6;
        }
      }

      p {
        margin: 0.5rem 0 0 2rem;
        color: #64748b;
      }
    }

    .loading-state {
      padding: 3rem;
      text-align: center;
      color: #64748b;

      .spinner {
        width: 40px;
        height: 40px;
        border: 3px solid #e2e8f0;
        border-top-color: #3b82f6;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        margin: 0 auto 1rem;
      }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    form {
      padding: 2rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;

      @media (max-width: 640px) {
        grid-template-columns: 1fr;
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

      input, select {
        width: 100%;
        padding: 0.75rem 1rem;
        border: 2px solid #e2e8f0;
        border-radius: 8px;
        font-size: 0.9375rem;
        transition: all 0.2s;

        &:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        &.invalid {
          border-color: #ef4444;
        }

        &::placeholder {
          color: #94a3b8;
        }
      }

      .error {
        display: block;
        margin-top: 0.25rem;
        font-size: 0.75rem;
        color: #ef4444;
      }

      .hint {
        display: block;
        margin-top: 0.25rem;
        font-size: 0.75rem;
        color: #64748b;
      }
    }

    .phone-input, .password-input {
      position: relative;
      display: flex;
      align-items: center;

      .prefix {
        position: absolute;
        left: 1rem;
        color: #64748b;
        font-weight: 500;
      }

      input {
        padding-left: 3.5rem;
      }

      .toggle-btn {
        position: absolute;
        right: 0.75rem;
        background: none;
        border: none;
        cursor: pointer;
        color: #64748b;
        padding: 0;

        &:hover { color: #1e293b; }
      }
    }

    .password-input input {
      padding-left: 1rem;
      padding-right: 2.5rem;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 1rem;
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
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        color: white;
        border: none;
        border-radius: 8px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;

        &:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        }

        &:disabled {
          opacity: 0.7;
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

    .admin-actions {
      padding: 1.5rem 2rem;
      border-top: 1px solid #e2e8f0;
      background: #fef3c7;

      h3 {
        margin: 0 0 1rem;
        font-size: 0.875rem;
        font-weight: 600;
        color: #92400e;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .action-buttons {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
      }

      .btn-action {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.625rem 1rem;
        background: white;
        border: 2px solid #f59e0b;
        border-radius: 8px;
        color: #92400e;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;

        &:hover:not(:disabled) {
          background: #fef3c7;
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .material-icons {
          font-size: 1.125rem;
        }
      }
    }
  `]
})
export class UtilisateurFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private utilisateurService = inject(UtilisateurService);
  private notification = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  form: FormGroup;
  isLoading = signal(false);
  isLoadingUser = signal(false);
  isResetting = signal(false);
  isEditMode = signal(false);
  currentUser = signal<Utilisateur | null>(null);
  showPassword = signal(false);

  constructor() {
    this.form = this.fb.group({
      prenom: ['', Validators.required],
      nom: ['', Validators.required],
      telephone1: ['', [Validators.required, Validators.pattern(/^\d{9}$/)]],
      telephone2: [''],
      password: ['', [Validators.required, Validators.minLength(4)]],
      adresseResidence: [''],
      nomContactUrgence: [''],
      telContactUrgence: [''],
      numeroMobileMoney: [''],
      numeroOrangeMoney: ['']
    });
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'nouveau') {
      this.isEditMode.set(true);
      this.form.get('password')?.clearValidators();
      this.form.get('password')?.updateValueAndValidity();
      this.loadUser(id);
    }
  }

  loadUser(id: string) {
    this.isLoadingUser.set(true);
    this.utilisateurService.getById(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.currentUser.set(response.data);
          const user = response.data;
          this.form.patchValue({
            prenom: user.prenom,
            nom: user.nom,
            telephone1: user.telephone1?.replace('+237', ''),
            telephone2: user.telephone2?.replace('+237', '') || '',
            adresseResidence: user.adresseResidence || '',
            nomContactUrgence: user.nomContactUrgence || '',
            telContactUrgence: user.telContactUrgence || '',
            numeroMobileMoney: user.numeroMobileMoney || '',
            numeroOrangeMoney: user.numeroOrangeMoney || ''
          });
        }
        this.isLoadingUser.set(false);
      },
      error: () => {
        this.notification.error('Erreur', 'Impossible de charger l\'utilisateur');
        this.isLoadingUser.set(false);
        this.router.navigate(['/dashboard/admin']);
      }
    });
  }

  get f() {
    return this.form.controls;
  }

  togglePassword() {
    this.showPassword.update(v => !v);
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const formValue = this.form.value;

    // Format phone numbers
    const data: any = {
      prenom: formValue.prenom,
      nom: formValue.nom,
      telephone1: formValue.telephone1.startsWith('+') ? formValue.telephone1 : `+237${formValue.telephone1}`,
      adresseResidence: formValue.adresseResidence || undefined,
      nomContactUrgence: formValue.nomContactUrgence || undefined,
      telContactUrgence: formValue.telContactUrgence || undefined,
      numeroMobileMoney: formValue.numeroMobileMoney || undefined,
      numeroOrangeMoney: formValue.numeroOrangeMoney || undefined
    };

    if (formValue.telephone2) {
      data.telephone2 = formValue.telephone2.startsWith('+') ? formValue.telephone2 : `+237${formValue.telephone2}`;
    }

    if (!this.isEditMode()) {
      data.password = formValue.password;
    }

    const request = this.isEditMode()
      ? this.utilisateurService.update(this.currentUser()!.id, data)
      : this.utilisateurService.create(data);

    request.subscribe({
      next: () => {
        this.isLoading.set(false);
        this.notification.success('Succès', this.isEditMode() ? 'Utilisateur mis à jour' : 'Utilisateur créé');
        this.router.navigate(['/dashboard/admin']);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.notification.error('Erreur', error.error?.message || 'Une erreur est survenue');
      }
    });
  }

  resetPassword() {
    const newPassword = prompt('Entrez le nouveau mot de passe temporaire (min. 4 caractères):');
    if (!newPassword || newPassword.length < 4) {
      this.notification.warning('Attention', 'Le mot de passe doit contenir au moins 4 caractères');
      return;
    }

    this.isResetting.set(true);
    this.utilisateurService.resetPassword(this.currentUser()!.id, { nouveauMotDePasse: newPassword }).subscribe({
      next: () => {
        this.isResetting.set(false);
        this.notification.success('Succès', 'Mot de passe réinitialisé');
      },
      error: () => {
        this.isResetting.set(false);
        this.notification.error('Erreur', 'Impossible de réinitialiser le mot de passe');
      }
    });
  }
}
