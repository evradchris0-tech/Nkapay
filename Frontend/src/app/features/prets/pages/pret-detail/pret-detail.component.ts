import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PretService, Pret, StatutPret } from '../../services/pret.service';
import { ApiService } from '../../../../core/services/api.service';
import { ApiResponse, PaginatedResponse } from '../../../../core/models/api-response.model';
import { NotificationService } from '../../../../core/services/notification.service';

interface RemboursementPret {
  id: string;
  pretId: string;
  reunionId?: string;
  transactionId?: string;
  montantCapital: number;
  montantInteret: number;
  montantTotal: number;
  dateRemboursement: string;
  capitalRestantApres: number;
  commentaire?: string;
}

@Component({
  selector: 'app-pret-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe, DatePipe, FormsModule],
  templateUrl: './pret-detail.component.html',
  styleUrl: './pret-detail.component.scss'
})
export class PretDetailComponent implements OnInit {
  private pretService    = inject(PretService);
  private api            = inject(ApiService);
  private notif          = inject(NotificationService);
  private route          = inject(ActivatedRoute);
  private router         = inject(Router);

  pret             = signal<Pret | null>(null);
  remboursements   = signal<RemboursementPret[]>([]);
  isLoading        = signal(true);
  hasError         = signal(false);
  isRembLoading    = signal(false);
  actionInProgress = signal(false);

  // Modal approuver
  showApprouverModal            = signal(false);
  approuveParExerciceMembreId   = '';

  // Modal refuser
  showRefuserModal              = signal(false);
  rejeteParExerciceMembreId     = '';
  motifRefus                    = '';

  // ─── State machine : DEMANDE → APPROUVE/REFUSE → DECAISSE → EN_COURS → SOLDE/DEFAUT ───
  canApprouver     = computed(() => this.pret()?.statut === 'DEMANDE');
  canRefuser       = computed(() => this.pret()?.statut === 'DEMANDE');
  canDecaisser     = computed(() => this.pret()?.statut === 'APPROUVE');
  canSolder        = computed(() => this.pret()?.statut === 'EN_COURS');
  canMettreEnDefaut= computed(() => this.pret()?.statut === 'EN_COURS');

  // Progression visuelle
  avancement = computed(() => {
    const p = this.pret();
    if (!p || p.montantTotalDu === 0) return 0;
    const rembourse = p.montantTotalDu - p.capitalRestant;
    return Math.round((rembourse / p.montantTotalDu) * 100);
  });

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.load(id);
    } else {
      this.router.navigate(['/dashboard/prets']);
    }
  }

  load(id: string): void {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.pretService.getById(id).subscribe({
      next: res => {
        if (res.success && res.data) {
          this.pret.set(res.data);
          this.loadRemboursements(id);
        } else {
          this.hasError.set(true);
          this.notif.error(res.message ?? 'Prêt introuvable');
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

  loadRemboursements(pretId: string): void {
    this.isRembLoading.set(true);
    this.api.get<PaginatedResponse<RemboursementPret>>(`/remboursements-prets/pret/${pretId}`).subscribe({
      next: res => {
        if (res.success) {
          this.remboursements.set(res.data ?? []);
        } else {
          this.notif.error('Impossible de charger les remboursements');
        }
        this.isRembLoading.set(false);
      },
      error: err => {
        this.isRembLoading.set(false);
        this.notif.error(err.error?.message ?? 'Erreur de chargement des remboursements');
      }
    });
  }

  // ─── Actions state machine ────────────────────────────────────────────────

  openApprouverModal(): void {
    this.approuveParExerciceMembreId = '';
    this.showApprouverModal.set(true);
  }

  closeApprouverModal(): void {
    this.showApprouverModal.set(false);
  }

  confirmerApprouver(): void {
    const p = this.pret();
    if (!p || !this.approuveParExerciceMembreId.trim()) return;
    this.actionInProgress.set(true);
    this.showApprouverModal.set(false);
    this.pretService.approuver(p.id, this.approuveParExerciceMembreId.trim()).subscribe({
      next: res => {
        this.actionInProgress.set(false);
        if (res.success && res.data) {
          this.pret.set(res.data);
          this.notif.success('Prêt approuvé avec succès');
        } else {
          this.notif.error(res.message ?? 'Échec de l\'approbation');
        }
      },
      error: err => {
        this.actionInProgress.set(false);
        this.notif.error(err.error?.message ?? 'Erreur serveur');
      }
    });
  }

  openRefuserModal(): void {
    this.rejeteParExerciceMembreId = '';
    this.motifRefus = '';
    this.showRefuserModal.set(true);
  }

  closeRefuserModal(): void {
    this.showRefuserModal.set(false);
  }

  confirmerRefuser(): void {
    const p = this.pret();
    if (!p || !this.rejeteParExerciceMembreId.trim() || !this.motifRefus.trim()) return;
    this.actionInProgress.set(true);
    this.showRefuserModal.set(false);
    this.pretService.refuser(p.id, {
      rejeteParExerciceMembreId: this.rejeteParExerciceMembreId.trim(),
      motifRefus: this.motifRefus.trim()
    }).subscribe({
      next: res => {
        this.actionInProgress.set(false);
        if (res.success && res.data) {
          this.pret.set(res.data);
          this.notif.success('Prêt refusé');
        } else {
          this.notif.error(res.message ?? 'Échec du refus');
        }
      },
      error: err => {
        this.actionInProgress.set(false);
        this.notif.error(err.error?.message ?? 'Erreur serveur');
      }
    });
  }

  decaisser(): void {
    const p = this.pret();
    if (!p) return;
    if (!confirm('Confirmer le décaissement de ce prêt ?')) return;
    this.actionInProgress.set(true);
    this.pretService.decaisser(p.id).subscribe({
      next: res => {
        this.actionInProgress.set(false);
        if (res.success && res.data) {
          this.pret.set(res.data);
          this.notif.success('Prêt décaissé');
        } else {
          this.notif.error(res.message ?? 'Échec du décaissement');
        }
      },
      error: err => {
        this.actionInProgress.set(false);
        this.notif.error(err.error?.message ?? 'Erreur serveur');
      }
    });
  }

  solder(): void {
    const p = this.pret();
    if (!p) return;
    if (!confirm('Marquer ce prêt comme soldé ?')) return;
    this.actionInProgress.set(true);
    this.pretService.solder(p.id).subscribe({
      next: res => {
        this.actionInProgress.set(false);
        if (res.success && res.data) {
          this.pret.set(res.data);
          this.notif.success('Prêt soldé');
        } else {
          this.notif.error(res.message ?? 'Échec');
        }
      },
      error: err => {
        this.actionInProgress.set(false);
        this.notif.error(err.error?.message ?? 'Erreur serveur');
      }
    });
  }

  mettreEnDefaut(): void {
    const p = this.pret();
    if (!p) return;
    if (!confirm('Confirmer la mise en défaut de ce prêt ? Cette action est irréversible.')) return;
    this.actionInProgress.set(true);
    this.pretService.mettreEnDefaut(p.id).subscribe({
      next: res => {
        this.actionInProgress.set(false);
        if (res.success && res.data) {
          this.pret.set(res.data);
          this.notif.success('Prêt mis en défaut');
        } else {
          this.notif.error(res.message ?? 'Échec');
        }
      },
      error: err => {
        this.actionInProgress.set(false);
        this.notif.error(err.error?.message ?? 'Erreur serveur');
      }
    });
  }

  // ─── Helpers UI ──────────────────────────────────────────────────────────

  getStatutLabel(statut: StatutPret | string): string {
    const labels: Record<string, string> = {
      'DEMANDE':  'Demandé',
      'APPROUVE': 'Approuvé',
      'REFUSE':   'Refusé',
      'DECAISSE': 'Décaissé',
      'EN_COURS': 'En cours',
      'SOLDE':    'Soldé',
      'DEFAUT':   'En défaut'
    };
    return labels[statut] ?? statut;
  }

  getStatutColor(statut: StatutPret | string): string {
    switch (statut) {
      case 'APPROUVE':
      case 'SOLDE':    return 'green';
      case 'DECAISSE':
      case 'EN_COURS': return 'blue';
      case 'DEMANDE':  return 'yellow';
      case 'REFUSE':
      case 'DEFAUT':   return 'red';
      default:         return 'gray';
    }
  }

  getMembreNom(p: Pret): string {
    const u = p.exerciceMembre?.utilisateur;
    if (u) return `${u.prenom} ${u.nom}`;
    return p.exerciceMembre?.matricule ?? '—';
  }
}
