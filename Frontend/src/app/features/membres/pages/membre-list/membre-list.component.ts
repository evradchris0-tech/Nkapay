import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-membre-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-header">
      <div class="header-left">
        <h1>Membres</h1>
        <p>Gérez les membres de vos tontines</p>
      </div>
    </div>
    <div class="placeholder">
      <span class="material-icons">people</span>
      <p>Liste des membres en cours de développement</p>
    </div>
  `,
  styles: `
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .page-header h1 { font-size: 1.75rem; font-weight: 700; color: #1f2937; margin: 0; }
    .page-header p { color: #6b7280; margin-top: 0.25rem; }
    .placeholder { display: flex; flex-direction: column; align-items: center; padding: 4rem; background: white; border-radius: 12px; color: #6b7280; }
    .placeholder .material-icons { font-size: 4rem; opacity: 0.3; margin-bottom: 1rem; }
  `
})
export class MembreListComponent {}
