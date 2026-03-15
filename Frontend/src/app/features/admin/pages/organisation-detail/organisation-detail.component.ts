import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import { ApiResponse, PaginatedResponse } from '../../../../core/models/api-response.model';
import {
  OrganisationService,
  Organisation,
  StatutOrganisation
} from '../../services/organisation.service';
import { NotificationService } from '../../../../core/services/notification.service';

interface MembreOrganisation {
  id: string;
  utilisateurId: string;
  prenom: string;
  nom: string;
  telephone1: string;
  email?: string;
  role: 'ORG_ADMIN' | 'ORG_MEMBRE';
  statut: string;
  creeLe: string;
}

interface TontineResume {
  id: string;
  nom: string;
  slug?: string;
  statut: string;
  creeLe: string;
}

@Component({
  selector: 'app-organisation-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, CurrencyPipe],
  templateUrl: './organisation-detail.component.html',
  styleUrl: './organisation-detail.component.scss'
})
export class OrganisationDetailComponent implements OnInit {
  private orgService = inject(OrganisationService);
  private apiService = inject(ApiService);
  private notif      = inject(NotificationService);
  private route      = inject(ActivatedRoute);
  private router     = inject(Router);

  organisation     = signal<Organisation | null>(null);
  membres          = signal<MembreOrganisation[]>([]);
  tontines         = signal<TontineResume[]>([]);
  isLoading        = signal(true);
  hasError         = signal(false);
  actionInProgress = signal(false);
  isLoadingMembres = signal(false);
  isLoadingTontines = signal(false);

  activeTab = signal<'apercu' | 'membres' | 'tontines'>('apercu');

  // State machine : ACTIVE ↔ SUSPENDUE
  canSuspendre = computed(() => this.organisation()?.statut === 'ACTIVE');
  canReactiver = computed(() => this.organisation()?.statut === 'SUSPENDUE');

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.load(id);
    } else {
      this.router.navigate(['/dashboard/admin/organisations']);
    }
  }

  load(id: string): void {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.orgService.getById(id).subscribe({
      next: res => {
        if (res.success && res.data) {
          this.organisation.set(res.data);
        } else {
          this.hasError.set(true);
          this.notif.error(res.message ?? 'Organisation introuvable');
        }
        this.isLoading.set(false);
      },
      error: err => {
        this.hasError.set(true);
        this.isLoading.set(false);
        this.notif.error(err.error?.message ?? 'Erreur de chargement');
      }
    });
  }

  setTab(tab: 'apercu' | 'membres' | 'tontines'): void {
    this.activeTab.set(tab);
    if (tab === 'membres' && this.membres().length === 0) {
      this.loadMembres();
    }
    if (tab === 'tontines' && this.tontines().length === 0) {
      this.loadTontines();
    }
  }

  loadMembres(): void {
    const org = this.organisation();
    if (!org) return;
    this.isLoadingMembres.set(true);
    // NOTE: /org/membres requiert le contexte org dans le JWT.
    // Depuis la vue SuperAdmin, ce endpoint peut retourner une erreur 403.
    this.apiService.get<ApiResponse<MembreOrganisation[]>>('/org/membres').subscribe({
      next: res => {
        if (res.success && res.data) {
          this.membres.set(res.data);
        }
        this.isLoadingMembres.set(false);
      },
      error: () => this.isLoadingMembres.set(false)
    });
  }

  loadTontines(): void {
    const org = this.organisation();
    if (!org) return;
    this.isLoadingTontines.set(true);
    this.apiService.get<PaginatedResponse<TontineResume>>('/tontines', { page: 1, limit: 50 }).subscribe({
      next: res => {
        if (res.success) {
          this.tontines.set(res.data ?? []);
        }
        this.isLoadingTontines.set(false);
      },
      error: () => this.isLoadingTontines.set(false)
    });
  }

  // ─── State machine ──────────────────────────────────────────────────────────

  suspendre(): void {
    const org = this.organisation();
    if (!org) return;
    if (!confirm(`Suspendre l'organisation « ${org.nom} » ? Ses membres ne pourront plus se connecter.`)) return;
    this.actionInProgress.set(true);
    this.orgService.suspendre(org.id).subscribe({
      next: res => {
        this.actionInProgress.set(false);
        if (res.success && res.data) {
          this.organisation.set(res.data);
          this.notif.success('Organisation suspendue');
        } else {
          this.notif.error(res.message ?? 'Échec de la suspension');
        }
      },
      error: err => {
        this.actionInProgress.set(false);
        this.notif.error(err.error?.message ?? 'Erreur serveur');
      }
    });
  }

  reactiver(): void {
    const org = this.organisation();
    if (!org) return;
    if (!confirm(`Réactiver l'organisation « ${org.nom} » ?`)) return;
    this.actionInProgress.set(true);
    this.orgService.reactiver(org.id).subscribe({
      next: res => {
        this.actionInProgress.set(false);
        if (res.success && res.data) {
          this.organisation.set(res.data);
          this.notif.success('Organisation réactivée');
        } else {
          this.notif.error(res.message ?? 'Échec de la réactivation');
        }
      },
      error: err => {
        this.actionInProgress.set(false);
        this.notif.error(err.error?.message ?? 'Erreur serveur');
      }
    });
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  getStatutLabel(statut: StatutOrganisation | string): string {
    const labels: Record<string, string> = {
      'ACTIVE':    'Active',
      'SUSPENDUE': 'Suspendue',
      'EXPIREE':   'Expirée'
    };
    return labels[statut] ?? statut;
  }

  getStatutColor(statut: StatutOrganisation | string): string {
    switch (statut) {
      case 'ACTIVE':    return 'green';
      case 'SUSPENDUE': return 'orange';
      case 'EXPIREE':   return 'red';
      default:          return 'gray';
    }
  }

  getRoleLabel(role: string): string {
    return role === 'ORG_ADMIN' ? 'Admin' : 'Membre';
  }

  getTontineStatutColor(statut: string): string {
    switch (statut) {
      case 'ACTIVE':    return 'green';
      case 'INACTIVE':  return 'gray';
      case 'SUSPENDUE': return 'orange';
      default:          return 'gray';
    }
  }

  getInitials(nom: string): string {
    return nom.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }
}
