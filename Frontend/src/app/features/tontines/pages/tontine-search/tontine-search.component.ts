import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TontineService } from '../../services/tontine.service';
import { Tontine, TontineTypeLabels } from '../../../../core/models/tontine.model';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-tontine-search',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="search-page">
      <div class="search-header">
        <div class="header-content">
          <h1>
            <span class="material-icons">search</span>
            Découvrir des tontines
          </h1>
          <p>Trouvez et rejoignez des tontines ouvertes aux nouveaux membres</p>
        </div>
      </div>

      <div class="search-bar">
        <div class="search-input-wrapper">
          <span class="material-icons">search</span>
          <input 
            type="text" 
            [(ngModel)]="searchTerm" 
            (keyup.enter)="onSearch()"
            placeholder="Rechercher par nom de tontine..."
          />
          <button *ngIf="searchTerm" class="clear-btn" (click)="clearSearch()">
            <span class="material-icons">close</span>
          </button>
        </div>
        <button class="btn-search" (click)="onSearch()">
          <span class="material-icons">search</span>
          Rechercher
        </button>
      </div>

      <div class="results-info" *ngIf="!isLoading()">
        <span>{{ tontines().length }} tontine(s) trouvée(s)</span>
      </div>

      <div *ngIf="isLoading()" class="loading-state">
        <div class="spinner"></div>
        <p>Recherche en cours...</p>
      </div>

      <div *ngIf="!isLoading() && tontines().length === 0" class="empty-state">
        <span class="material-icons">search_off</span>
        <h3>Aucune tontine trouvée</h3>
        <p>Essayez de modifier vos critères de recherche</p>
      </div>

      <div class="tontines-grid" *ngIf="!isLoading() && tontines().length > 0">
        <div class="tontine-card" *ngFor="let tontine of tontines()">
          <div class="card-header">
            <div class="tontine-logo">
              <span class="material-icons">account_balance</span>
            </div>
            <div class="tontine-info">
              <h3>{{ tontine.nom }}</h3>
              <span class="tontine-code">{{ tontine.nomCourt }}</span>
            </div>
          </div>

          <div class="card-body">
            <p class="motto" *ngIf="tontine.motto">{{ tontine.motto }}</p>
            
            <div class="stats-row">
              <div class="stat">
                <span class="material-icons">people</span>
                <span class="value">{{ tontine.nombreMembres || 0 }}</span>
                <span class="label">membres</span>
              </div>
              <div class="stat">
                <span class="material-icons">calendar_today</span>
                <span class="value">{{ tontine.anneeFondation || '-' }}</span>
                <span class="label">fondée</span>
              </div>
            </div>

            <div class="tags">
              <span class="tag type">{{ getTypeLabel(tontine) }}</span>
              <span class="tag status" [class.active]="tontine.statut === 'ACTIVE'">
                {{ tontine.statut === 'ACTIVE' ? 'Active' : tontine.statut }}
              </span>
            </div>
          </div>

          <div class="card-footer">
            <a [routerLink]="['/dashboard/tontines', tontine.id]" class="btn-view">
              <span class="material-icons">visibility</span>
              Voir détails
            </a>
            <button class="btn-join" (click)="requestJoin(tontine)">
              <span class="material-icons">person_add</span>
              Rejoindre
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .search-page {
      max-width: 1200px;
      margin: 0 auto;
    }

    .search-header {
      margin-bottom: 2rem;

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

      p {
        color: #64748b;
        margin: 0.5rem 0 0 2.5rem;
      }
    }

    .search-bar {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
      background: white;
      padding: 1rem;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);

      .search-input-wrapper {
        flex: 1;
        position: relative;
        display: flex;
        align-items: center;

        > .material-icons {
          position: absolute;
          left: 1rem;
          color: #94a3b8;
        }

        input {
          width: 100%;
          padding: 0.875rem 2.5rem 0.875rem 3rem;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          font-size: 1rem;
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
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.875rem 1.5rem;
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        color: white;
        border: none;
        border-radius: 10px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        }
      }
    }

    .results-info {
      margin-bottom: 1rem;
      color: #64748b;
      font-size: 0.875rem;
    }

    .loading-state, .empty-state {
      padding: 4rem 2rem;
      text-align: center;
      color: #64748b;
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);

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

    .tontines-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 1.5rem;
    }

    .tontine-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      overflow: hidden;
      transition: all 0.2s;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0,0,0,0.1);
      }
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border-bottom: 1px solid #e2e8f0;

      .tontine-logo {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;

        .material-icons {
          font-size: 1.5rem;
        }
      }

      .tontine-info {
        h3 {
          margin: 0;
          font-size: 1.125rem;
          font-weight: 600;
          color: #1e293b;
        }

        .tontine-code {
          font-size: 0.8125rem;
          color: #64748b;
        }
      }
    }

    .card-body {
      padding: 1.25rem;

      .motto {
        font-style: italic;
        color: #64748b;
        margin: 0 0 1rem;
        font-size: 0.875rem;
        line-height: 1.5;
      }

      .stats-row {
        display: flex;
        gap: 1.5rem;
        margin-bottom: 1rem;

        .stat {
          display: flex;
          align-items: center;
          gap: 0.375rem;

          .material-icons {
            font-size: 1rem;
            color: #3b82f6;
          }

          .value {
            font-weight: 600;
            color: #1e293b;
          }

          .label {
            font-size: 0.8125rem;
            color: #64748b;
          }
        }
      }

      .tags {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;

        .tag {
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 500;

          &.type {
            background: #ede9fe;
            color: #7c3aed;
          }

          &.status {
            background: #f1f5f9;
            color: #64748b;

            &.active {
              background: #dcfce7;
              color: #166534;
            }
          }
        }
      }
    }

    .card-footer {
      display: flex;
      gap: 0.75rem;
      padding: 1rem 1.25rem;
      border-top: 1px solid #e2e8f0;

      .btn-view, .btn-join {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.375rem;
        padding: 0.625rem;
        border-radius: 8px;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        text-decoration: none;
      }

      .btn-view {
        background: #f1f5f9;
        color: #475569;
        border: none;

        &:hover {
          background: #e2e8f0;
        }
      }

      .btn-join {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        border: none;

        &:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
        }
      }
    }
  `]
})
export class TontineSearchComponent implements OnInit {
  private tontineService = inject(TontineService);
  private notification = inject(NotificationService);

  tontines = signal<Tontine[]>([]);
  isLoading = signal(false);
  searchTerm = '';

  typeLabels = TontineTypeLabels;

  ngOnInit() {
    this.loadTontines();
  }

  loadTontines() {
    this.isLoading.set(true);
    
    const params: any = { page: 1, limit: 50, estPublique: true };
    if (this.searchTerm) params.search = this.searchTerm;

    this.tontineService.getAll(params).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.tontines.set(response.data);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.notification.error('Erreur', 'Impossible de charger les tontines');
        this.tontines.set([]);
      }
    });
  }

  onSearch() {
    this.loadTontines();
  }

  clearSearch() {
    this.searchTerm = '';
    this.loadTontines();
  }

  getTypeLabel(tontine: Tontine): string {
    if (tontine.tontineType?.libelle) {
      return tontine.tontineType.libelle;
    }
    return this.typeLabels[tontine.type ?? ''] ?? 'Standard';
  }

  requestJoin(tontine: Tontine) {
    // Navigate to adhesion request page
    window.location.href = `/dashboard/tontines/${tontine.id}/rejoindre`;
  }
}
