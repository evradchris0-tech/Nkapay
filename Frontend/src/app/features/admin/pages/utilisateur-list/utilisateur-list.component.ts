import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UtilisateurService } from '../../services/utilisateur.service';
import { Utilisateur } from '../../../../core/models/user.model';
import { NotificationService } from '../../../../core/services/notification.service';
import { PhoneFormatPipe } from '../../../../core/pipes/phone-format.pipe';

@Component({
  selector: 'app-utilisateur-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, DatePipe, PhoneFormatPipe],
  template: `
    <div class="page-header">
      <div class="header-content">
        <h1>
          <span class="material-icons">admin_panel_settings</span>
          Administration des utilisateurs
        </h1>
        <p class="subtitle">Gérez les comptes utilisateurs de la plateforme</p>
      </div>
      <a routerLink="nouveau" class="btn-primary">
        <span class="material-icons">person_add</span>
        Nouvel utilisateur
      </a>
    </div>

    <div class="filters-bar">
      <div class="search-box">
        <span class="material-icons">search</span>
        <input 
          type="text" 
          [(ngModel)]="searchTerm" 
          (keyup.enter)="onSearch()"
          placeholder="Rechercher par nom ou téléphone..."
        />
        <button *ngIf="searchTerm" class="clear-btn" (click)="clearSearch()">
          <span class="material-icons">close</span>
        </button>
      </div>
      <button class="btn-search" (click)="onSearch()">Rechercher</button>
    </div>

    <div class="stats-bar">
      <div class="stat-item">
        <span class="material-icons">people</span>
        <span class="stat-value">{{ utilisateurs().length }}</span>
        <span class="stat-label">utilisateurs</span>
      </div>
      <div class="stat-item">
        <span class="material-icons">verified_user</span>
        <span class="stat-value">{{ superAdminCount() }}</span>
        <span class="stat-label">super admins</span>
      </div>
    </div>

    <div class="content-card">
      <div *ngIf="isLoading()" class="loading-state">
        <div class="spinner"></div>
        <p>Chargement des utilisateurs...</p>
      </div>

      <div *ngIf="!isLoading() && utilisateurs().length === 0" class="empty-state">
        <span class="material-icons">person_off</span>
        <h3>Aucun utilisateur trouvé</h3>
        <p>Créez un nouvel utilisateur pour commencer</p>
      </div>

      <table *ngIf="!isLoading() && utilisateurs().length > 0" class="data-table">
        <thead>
          <tr>
            <th>Utilisateur</th>
            <th>Téléphone</th>
            <th>Date inscription</th>
            <th>Statut</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let user of utilisateurs()">
            <td>
              <div class="user-cell">
                <div class="avatar" [class.admin]="user.estSuperAdmin">
                  {{ getInitials(user) }}
                </div>
                <div class="user-info">
                  <span class="name">{{ user.prenom }} {{ user.nom }}</span>
                  <span *ngIf="user.estSuperAdmin" class="badge admin">Super Admin</span>
                </div>
              </div>
            </td>
            <td>
              <span class="phone">{{ user.telephone1 | phoneFormat }}</span>
              <span *ngIf="user.telephone2" class="phone-secondary">{{ user.telephone2 | phoneFormat }}</span>
            </td>
            <td>{{ user.dateInscription | date:'dd/MM/yyyy' }}</td>
            <td>
              <span class="status-badge" [class.warning]="user.doitChangerMotDePasse">
                {{ user.doitChangerMotDePasse ? 'Mot de passe à changer' : 'Actif' }}
              </span>
            </td>
            <td>
              <div class="actions">
                <a [routerLink]="[user.id]" class="btn-icon" title="Modifier">
                  <span class="material-icons">edit</span>
                </a>
                <button 
                  class="btn-icon danger" 
                  title="Supprimer"
                  (click)="deleteUser(user)"
                  [disabled]="user.estSuperAdmin"
                >
                  <span class="material-icons">delete</span>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      gap: 1rem;

      .header-content {
        h1 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.75rem;
          font-weight: 700;
          color: #1e293b;
          margin: 0;

          .material-icons {
            color: #3b82f6;
            font-size: 2rem;
          }
        }

        .subtitle {
          color: #64748b;
          margin: 0.25rem 0 0 2.5rem;
        }
      }
    }

    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
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

    .filters-bar {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;

      .search-box {
        flex: 1;
        min-width: 250px;
        position: relative;
        display: flex;
        align-items: center;

        .material-icons {
          position: absolute;
          left: 1rem;
          color: #94a3b8;
        }

        input {
          width: 100%;
          padding: 0.75rem 2.5rem 0.75rem 3rem;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 0.9375rem;
          transition: all 0.2s;

          &:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }
        }

        .clear-btn {
          position: absolute;
          right: 0.75rem;
          background: none;
          border: none;
          cursor: pointer;
          color: #94a3b8;
          padding: 0;

          &:hover { color: #64748b; }
        }
      }

      .btn-search {
        padding: 0.75rem 1.5rem;
        background: #f1f5f9;
        border: 2px solid #e2e8f0;
        border-radius: 8px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          background: #e2e8f0;
        }
      }
    }

    .stats-bar {
      display: flex;
      gap: 1.5rem;
      margin-bottom: 1.5rem;

      .stat-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.25rem;
        background: white;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);

        .material-icons {
          color: #3b82f6;
        }

        .stat-value {
          font-weight: 700;
          font-size: 1.25rem;
          color: #1e293b;
        }

        .stat-label {
          color: #64748b;
          font-size: 0.875rem;
        }
      }
    }

    .content-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      overflow: hidden;
    }

    .loading-state, .empty-state {
      padding: 4rem 2rem;
      text-align: center;
      color: #64748b;

      .material-icons {
        font-size: 3rem;
        margin-bottom: 1rem;
        opacity: 0.5;
      }

      h3 {
        margin: 0 0 0.5rem;
        color: #1e293b;
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

    .data-table {
      width: 100%;
      border-collapse: collapse;

      th, td {
        padding: 1rem;
        text-align: left;
        border-bottom: 1px solid #e2e8f0;
      }

      th {
        background: #f8fafc;
        font-weight: 600;
        color: #475569;
        font-size: 0.8125rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      tbody tr {
        transition: background 0.2s;

        &:hover {
          background: #f8fafc;
        }

        &:last-child td {
          border-bottom: none;
        }
      }
    }

    .user-cell {
      display: flex;
      align-items: center;
      gap: 0.75rem;

      .avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 0.875rem;

        &.admin {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        }
      }

      .user-info {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;

        .name {
          font-weight: 500;
          color: #1e293b;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          padding: 0.125rem 0.5rem;
          border-radius: 4px;
          font-size: 0.6875rem;
          font-weight: 600;
          text-transform: uppercase;

          &.admin {
            background: #fef3c7;
            color: #92400e;
          }
        }
      }
    }

    .phone {
      display: block;
      font-family: monospace;
      color: #1e293b;
    }

    .phone-secondary {
      display: block;
      font-family: monospace;
      font-size: 0.8125rem;
      color: #64748b;
    }

    .status-badge {
      display: inline-flex;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.8125rem;
      font-weight: 500;
      background: #dcfce7;
      color: #166534;

      &.warning {
        background: #fef3c7;
        color: #92400e;
      }
    }

    .actions {
      display: flex;
      gap: 0.5rem;

      .btn-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border: none;
        border-radius: 6px;
        background: #f1f5f9;
        color: #64748b;
        cursor: pointer;
        transition: all 0.2s;
        text-decoration: none;

        &:hover:not(:disabled) {
          background: #e2e8f0;
          color: #1e293b;
        }

        &.danger:hover:not(:disabled) {
          background: #fee2e2;
          color: #dc2626;
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
export class UtilisateurListComponent implements OnInit {
  private utilisateurService = inject(UtilisateurService);
  private notification = inject(NotificationService);

  utilisateurs = signal<Utilisateur[]>([]);
  isLoading = signal(true);
  searchTerm = '';

  superAdminCount = signal(0);

  ngOnInit() {
    this.loadUtilisateurs();
  }

  loadUtilisateurs() {
    this.isLoading.set(true);
    
    const filters: any = { page: 1, limit: 100 };
    if (this.searchTerm) filters.search = this.searchTerm;

    this.utilisateurService.getAll(filters).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.utilisateurs.set(response.data);
          this.superAdminCount.set(response.data.filter(u => u.estSuperAdmin).length);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.notification.error('Erreur', 'Impossible de charger les utilisateurs');
        this.utilisateurs.set([]);
      }
    });
  }

  onSearch() {
    this.loadUtilisateurs();
  }

  clearSearch() {
    this.searchTerm = '';
    this.loadUtilisateurs();
  }

  getInitials(user: Utilisateur): string {
    return `${user.prenom?.charAt(0) || ''}${user.nom?.charAt(0) || ''}`.toUpperCase();
  }

  deleteUser(user: Utilisateur) {
    if (user.estSuperAdmin) {
      this.notification.warning('Attention', 'Impossible de supprimer un super administrateur');
      return;
    }

    if (confirm(`Êtes-vous sûr de vouloir supprimer ${user.prenom} ${user.nom} ?`)) {
      this.utilisateurService.delete(user.id).subscribe({
        next: () => {
          this.notification.success('Succès', 'Utilisateur supprimé');
          this.loadUtilisateurs();
        },
        error: () => {
          this.notification.error('Erreur', 'Impossible de supprimer l\'utilisateur');
        }
      });
    }
  }
}
