import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private notification = inject(NotificationService);

  loginForm: FormGroup;
  isLoading = signal(false);
  showPassword = signal(false);

  constructor() {
    this.loginForm = this.fb.group({
      telephone: ['', [Validators.required, Validators.pattern(/^\d{9,15}$/)]],
      password: ['', [Validators.required, Validators.minLength(4)]]
    });
  }

  togglePassword() {
    this.showPassword.update(v => !v);
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);

    this.authService.login({
      telephone: this.loginForm.value.telephone,
      motDePasse: this.loginForm.value.password
    }).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        if (response.success) {
          this.notification.success('Bienvenue!', 'Connexion réussie');
          
          // Check if password change is required (support `utilisateur` or `user`)
          const respData: any = response.data as any;
          const user = respData?.utilisateur ?? respData?.user;
          if (user?.doitChangerMotDePasse) {
            this.router.navigate(['/auth/change-password']);
          } else {
            const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
            this.router.navigateByUrl(returnUrl);
          }
        } else {
          this.notification.error('Erreur', response.message || 'Identifiants incorrects');
        }
      },
      error: (error) => {
        this.isLoading.set(false);
        this.notification.error('Erreur', error.error?.message || 'Erreur de connexion');
      }
    });
  }

  get f() {
    return this.loginForm.controls;
  }
}
