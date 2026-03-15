import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DistributionService, Distribution, StatutDistribution } from '../../services/distribution.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-distribution-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe, DatePipe, FormsModule],
  templateUrl: './distribution-detail.component.html',
  styleUrl: './distribution-detail.component.scss'
})
export class DistributionDetailComponent implements OnInit {
  private distributionService = inject(DistributionService);
  private notif               = inject(NotificationService);
  private route               = inject(ActivatedRoute);
  private router              = inject(Router);

  distribution        = signal<Distribution | null>(null);
  autresDistributions = signal<Distribution[]>([]);
  isLoading           = signal(true);
  hasError            = signal(false);
  actionInProgress    = signal(false);
  isLoadingAutres     = signal(false);

  // Modal distribuer
  showDistribuerModal = signal(false);
  transactionId       = '';

  // State machine : PLANIFIEE → DISTRIBUEE / ANNULEE
  canDistribuer = computed(() => this.distribution()?.statut === 'PLANIFIEE');
  canAnnuler    = computed(() => this.distribution()?.statut === 'PLANIFIEE');

  // Résumé de toutes les distributions de la même réunion
  totalBrut     = computed(() => this.autresDistributions().reduce((s, d) => s + d.montantBrut, 0));
  totalRetenu   = computed(() => this.autresDistributions().reduce((s, d) => s + d.montantRetenu, 0));
  totalNet      = computed(() => this.autresDistributions().reduce((s, d) => s + d.montantNet, 0));
  nbDistribuees = computed(() => this.autresDistributions().filter(d => d.statut === 'DISTRIBUEE').length);
  nbPlanifiees  = computed(() => this.autresDistributions().filter(d => d.statut === 'PLANIFIEE').length);
  nbAnnulees    = computed(() => this.autresDistributions().filter(d => d.statut === 'ANNULEE').length);

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.load(id);
    } else {
      this.router.navigate(['/dashboard/distributions']);
    }
  }

  load(id: string): void {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.distributionService.getById(id).subscribe({
      next: res => {
        if (res.success && res.data) {
          this.distribution.set(res.data);
          this.loadAutresDistributions(res.data.reunionId);
        } else {
          this.hasError.set(true);
          this.notif.error(res.message ?? 'Distribution introuvable');
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

  loadAutresDistributions(reunionId: string): void {
    this.isLoadingAutres.set(true);
    this.distributionService.getByReunion(reunionId).subscribe({
      next: res => {
        if (res.success && res.data) {
          this.autresDistributions.set([...res.data].sort((a, b) => a.ordre - b.ordre));
        }
        this.isLoadingAutres.set(false);
      },
      error: err => {
        this.isLoadingAutres.set(false);
        this.notif.error(err.error?.message ?? 'Impossible de charger les distributions de la réunion');
      }
    });
  }

  // ─── Distribuer ──────────────────────────────────────────────────────────

  openDistribuerModal(): void {
    this.transactionId = '';
    this.showDistribuerModal.set(true);
  }

  closeDistribuerModal(): void {
    this.showDistribuerModal.set(false);
  }

  confirmerDistribuer(): void {
    const d = this.distribution();
    if (!d) return;
    this.actionInProgress.set(true);
    this.showDistribuerModal.set(false);
    this.distributionService.distribuer(d.id, this.transactionId.trim() || undefined).subscribe({
      next: res => {
        this.actionInProgress.set(false);
        if (res.success && res.data) {
          this.distribution.set(res.data);
          this.autresDistributions.update(list =>
            list.map(item => item.id === res.data!.id ? res.data! : item)
          );
          this.notif.success('Distribution effectuée avec succès');
        } else {
          this.notif.error(res.message ?? 'Échec de la distribution');
        }
      },
      error: err => {
        this.actionInProgress.set(false);
        this.notif.error(err.error?.message ?? 'Erreur serveur');
      }
    });
  }

  // ─── Annuler ──────────────────────────────────────────────────────────────

  annuler(): void {
    const d = this.distribution();
    if (!d) return;
    if (!confirm('Annuler cette distribution ? Cette action est irréversible.')) return;
    this.actionInProgress.set(true);
    this.distributionService.annuler(d.id).subscribe({
      next: res => {
        this.actionInProgress.set(false);
        if (res.success && res.data) {
          this.distribution.set(res.data);
          this.autresDistributions.update(list =>
            list.map(item => item.id === res.data!.id ? res.data! : item)
          );
          this.notif.success('Distribution annulée');
        } else {
          this.notif.error(res.message ?? 'Échec de l\'annulation');
        }
      },
      error: err => {
        this.actionInProgress.set(false);
        this.notif.error(err.error?.message ?? 'Erreur serveur');
      }
    });
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  getBeneficiaireNom(d: Distribution): string {
    const u = d.exerciceMembreBeneficiaire?.utilisateur;
    if (u) return `${u.prenom} ${u.nom}`;
    return d.exerciceMembreBeneficiaire?.matricule ?? '—';
  }

  getStatutLabel(statut: StatutDistribution | string): string {
    const labels: Record<string, string> = {
      'PLANIFIEE':  'Planifiée',
      'DISTRIBUEE': 'Distribuée',
      'ANNULEE':    'Annulée'
    };
    return labels[statut] ?? statut;
  }

  getStatutColor(statut: StatutDistribution | string): string {
    switch (statut) {
      case 'DISTRIBUEE': return 'green';
      case 'PLANIFIEE':  return 'yellow';
      case 'ANNULEE':    return 'red';
      default:           return 'gray';
    }
  }

  isCurrentDistribution(d: Distribution): boolean {
    return d.id === this.distribution()?.id;
  }
}
