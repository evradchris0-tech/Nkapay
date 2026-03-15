import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="auth-shell">
      <!-- Left panel — branding -->
      <div class="auth-panel">
        <div class="panel-inner">
          <div class="brand">
            <img src="assets/logo.svg" alt="Nkapay" class="brand-logo" />
            <span class="brand-name">Nkapay</span>
          </div>

          <div class="panel-body">
            <h2 class="panel-title">La tontine<br/>réinventée.</h2>
            <p class="panel-sub">
              Gérez vos cotisations, prêts et distributions
              en toute simplicité — pour vous et vos membres.
            </p>

            <div class="features">
              <div class="feature">
                <span class="feat-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </span>
                <span>Suivi en temps réel des cotisations</span>
              </div>
              <div class="feature">
                <span class="feat-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </span>
                <span>Gestion des prêts et remboursements</span>
              </div>
              <div class="feature">
                <span class="feat-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </span>
                <span>Rapports et exports automatisés</span>
              </div>
              <div class="feature">
                <span class="feat-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </span>
                <span>Multi-tontines, multi-exercices</span>
              </div>
            </div>
          </div>

          <p class="panel-copy">&copy; {{ year }} Nkapay · Tous droits réservés</p>
        </div>
      </div>

      <!-- Right panel — form -->
      <div class="auth-form-area">
        <div class="form-wrap">
          <router-outlet />
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-shell {
      min-height: 100vh;
      display: flex;
    }

    /* ─── Left Panel ─────────────────── */
    .auth-panel {
      display: none;
      width: 480px;
      flex-shrink: 0;
      background: #0f172a;
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        inset: 0;
        background:
          radial-gradient(ellipse 80% 60% at 20% 110%, rgba(99,102,241,0.35) 0%, transparent 60%),
          radial-gradient(ellipse 60% 50% at 90% -10%, rgba(99,102,241,0.2) 0%, transparent 55%);
        pointer-events: none;
      }

      @media (min-width: 900px) { display: flex; }
    }

    .panel-inner {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      padding: 2.5rem;
      width: 100%;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 0.625rem;
    }

    .brand-logo {
      width: 34px;
      height: 34px;
      border-radius: 8px;
    }

    .brand-name {
      font-size: 1.125rem;
      font-weight: 700;
      color: #f8fafc;
      letter-spacing: -0.02em;
    }

    .panel-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 3rem 0;
    }

    .panel-title {
      font-size: 2.5rem;
      font-weight: 800;
      color: #f8fafc;
      line-height: 1.15;
      letter-spacing: -0.04em;
      margin-bottom: 1.25rem;
    }

    .panel-sub {
      font-size: 1rem;
      color: rgba(226, 232, 240, 0.65);
      line-height: 1.7;
      margin-bottom: 2.5rem;
      max-width: 340px;
    }

    .features {
      display: flex;
      flex-direction: column;
      gap: 0.875rem;
    }

    .feature {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.9375rem;
      color: rgba(226, 232, 240, 0.80);
    }

    .feat-icon {
      width: 26px;
      height: 26px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(99,102,241,0.25);
      border-radius: 6px;
      color: #818cf8;
      flex-shrink: 0;
    }

    .panel-copy {
      font-size: 0.75rem;
      color: rgba(148, 163, 184, 0.4);
    }

    /* ─── Right Panel ────────────────── */
    .auth-form-area {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem 1.5rem;
      background: #f4f6fa;
    }

    .form-wrap {
      width: 100%;
      max-width: 420px;
    }
  `]
})
export class AuthLayoutComponent {
  year = new Date().getFullYear();
}
