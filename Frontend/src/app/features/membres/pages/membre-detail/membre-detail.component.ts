import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-membre-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <a routerLink="/dashboard/membres" class="back-link"><span class="material-icons">arrow_back</span> Retour</a>
    <div class="placeholder"><h2>Détail Membre</h2><p>En cours de développement</p></div>
  `,
  styles: `.back-link { display: inline-flex; align-items: center; gap: 0.5rem; color: #6b7280; text-decoration: none; margin-bottom: 1rem; } .placeholder { padding: 4rem; background: white; border-radius: 12px; text-align: center; }`
})
export class MembreDetailComponent {}
