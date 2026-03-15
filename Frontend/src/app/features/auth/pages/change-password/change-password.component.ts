import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.scss'
})
export class ChangePasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private notification = inject(NotificationService);

  passwordForm: FormGroup;
  isLoading = signal(false);
  showCurrentPassword = signal(false);
  showNewPassword = signal(false);
  showConfirmPassword = signal(false);

  constructor() {
    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    
    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({ mismatch: true });
      return { mismatch: true };
    }
    return null;
  }

  onSubmit() {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);

    this.authService.changePassword({
      ancienMotDePasse: this.passwordForm.value.currentPassword,
      nouveauMotDePasse: this.passwordForm.value.newPassword
    }).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        if (response.success) {
          this.notification.success('Succès', 'Mot de passe modifié avec succès');
          this.router.navigate(['/dashboard']);
        } else {
          this.notification.error('Erreur', response.message || 'Erreur lors du changement');
        }
      },
      error: (error) => {
        this.isLoading.set(false);
        this.notification.error('Erreur', error.error?.message || 'Erreur lors du changement');
      }
    });
  }

  get f() {
    return this.passwordForm.controls;
  }

  toggleShowCurrent() {
    this.showCurrentPassword.update(v => !v);
  }

  toggleShowNew() {
    this.showNewPassword.update(v => !v);
  }

  toggleShowConfirm() {
    this.showConfirmPassword.update(v => !v);
  }
}
