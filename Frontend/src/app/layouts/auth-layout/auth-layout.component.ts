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
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 50%, #1e40af 100%);
      padding: 1rem;
      position: relative;
      overflow: hidden;
    }

    .auth-layout::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%);
      animation: pulse 15s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 0.5; }
      50% { transform: scale(1.1); opacity: 0.3; }
    }

    .auth-container {
      width: 100%;
      max-width: 440px;
      position: relative;
      z-index: 1;
    }

    .auth-header {
      text-align: center;
      margin-bottom: 2rem;
      color: white;

      .logo {
        width: 88px;
        height: 88px;
        margin-bottom: 1rem;
        filter: drop-shadow(0 4px 12px rgba(0,0,0,0.2));
      }

      h1 {
        font-size: 2.25rem;
        font-weight: 700;
        margin: 0;
        text-shadow: 0 2px 10px rgba(0,0,0,0.1);
      }

      p {
        font-size: 1.0625rem;
        opacity: 0.9;
        margin-top: 0.5rem;
      }
    }

    .auth-content {
      background: white;
      border-radius: 16px;
      padding: 2.5rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }

    .auth-footer {
      text-align: center;
      margin-top: 1.5rem;
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.875rem;
    }
  `
})
export class AuthLayoutComponent {
  currentYear = new Date().getFullYear();
}
