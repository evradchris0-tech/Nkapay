import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="auth-layout">
      <div class="auth-container">
        <div class="auth-header">
          <img src="assets/logo.svg" alt="Nkapay" class="logo" />
          <h1>Nkapay</h1>
          <p>Gestion de tontines simplifiée</p>
        </div>
        <div class="auth-content">
          <router-outlet />
        </div>
        <div class="auth-footer">
          <p>&copy; {{ currentYear }} Nkapay. Tous droits réservés.</p>
        </div>
      </div>
    </div>
  `,
  styles: `
    .auth-layout {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 1rem;
    }

    .auth-container {
      width: 100%;
      max-width: 420px;
    }

    .auth-header {
      text-align: center;
      margin-bottom: 2rem;
      color: white;

      .logo {
        width: 80px;
        height: 80px;
        margin-bottom: 1rem;
      }

      h1 {
        font-size: 2rem;
        font-weight: 700;
        margin: 0;
      }

      p {
        font-size: 1rem;
        opacity: 0.9;
        margin-top: 0.5rem;
      }
    }

    .auth-content {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    }

    .auth-footer {
      text-align: center;
      margin-top: 1.5rem;
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.875rem;
    }
  `
})
export class AuthLayoutComponent {
  currentYear = new Date().getFullYear();
}
