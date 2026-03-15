import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PenaliteService, Penalite, StatutPenalite } from '../../services/penalite.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-penalite-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe, DatePipe, FormsModule],
  templateUrl: './penalite-detail.component.html',
  styleUrl: './penalite-detail.component.scss'
})
export class PenaliteDetailComponent implements OnInit {
  private penaliteService  = inject(PenaliteService);
  private notif            = inject(NotificationService);
  private route            = inject(ActivatedRoute);
  private router           = inject(Router);

  penalite         = signal<Penalite | null>(null);
  isLoading        = signal(true);
  hasError         = signal(false);
  actionInProgress = signal(false);

  // Modals
  showPayerModal   = signal(false);
  showAnnulerModal = signal(false);

  // Champs formulaire
  transactionId    = '';
  motifAnnulation  = '';

  // ─── State machine ────────────────────────────────────────────────────────
  // EN_ATTENTE → PAYEE / ANNULEE / PARDONNEE (toutes depuis EN_ATTENTE)
  canPayer     = computed(() => this.penalite()?.statut === 'EN_ATTENTE');
  canAnnuler   = computed(() => this.penalite()?.statut === 'EN_ATTENTE');
  canPardonner = computed(() => this.penalite()?.statut === 'EN_ATTENTE');

  // Progression paiement
  estSoldee = computed(() => {
    const s = this.penalite()?.statut;
    return s === 'PAYEE' || s === 'PARDONNEE';
  });

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.load(id);
    } else {
      this.router.navigate(['/dashboard/penalites']);
    }
  }

  load(id: string): void {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.penaliteService.getById(id).subscribe({
      next: res => {
        if (res.success && res.data) {
          this.penalite.set(res.data);
        } else {
          this.hasError.set(true);
          this.notif.error(res.message ?? 'Pénalité introuvable');
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

  // ─── Payer ────────────────────────────────────────────────────────────────

  openPayerModal(): void {
    this.transactionId = '';
    this.showPayerModal.set(true);
  }

  closePayerModal(): void {
    this.showPayerModal.set(false);
  }

  confirmerPayer(): void {
    const p = this.penalite();
    if (!p) return;
    this.actionInProgress.set(true);
    this.showPayerModal.set(false);
    this.penaliteService.payer(p.id, this.transactionId.trim() || undefined).subscribe({
      next: res => {
        this.actionInProgress.set(false);
        if (res.success && res.data) {
          this.penalite.set(res.data);
          this.notif.success('Pénalité marquée comme payée');
        } else {
          this.notif.error(res.message ?? 'Échec du paiement');
        }
      },
      error: err => {
        this.actionInProgress.set(false);
        this.notif.error(err.error?.message ?? 'Erreur serveur');
      }
    });
  }

  // ─── Annuler ──────────────────────────────────────────────────────────────

  openAnnulerModal(): void {
    this.motifAnnulation = '';
    this.showAnnulerModal.set(true);
  }

  closeAnnulerModal(): void {
    this.showAnnulerModal.set(false);
  }

  confirmerAnnuler(): void {
    const p = this.penalite();
    if (!p || !this.motifAnnulation.trim()) return;
    this.actionInProgress.set(true);
    this.showAnnulerModal.set(false);
    this.penaliteService.annuler(p.id, this.motifAnnulation.trim()).subscribe({
      next: res => {
        this.actionInProgress.set(false);
        if (res.success && res.data) {
          this.penalite.set(res.data);
          this.notif.success('Pénalité annulée');
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

  // ─── Pardonner ────────────────────────────────────────────────────────────

  pardonner(): void {
    const p = this.penalite();
    if (!p) return;
    if (!confirm('Pardonner cette pénalité ? Le membre ne devra plus la régler.')) return;
    this.actionInProgress.set(true);
    this.penaliteService.pardonner(p.id).subscribe({
      next: res => {
        this.actionInProgress.set(false);
        if (res.success && res.data) {
          this.penalite.set(res.data);
          this.notif.success('Pénalité pardonnée');
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

  // ─── Helpers ──────────────────────────────────────────────────────────────

  getStatutLabel(statut: StatutPenalite | string): string {
    const labels: Record<string, string> = {
      'EN_ATTENTE': 'En attente',
      'PAYEE':      'Payée',
      'ANNULEE':    'Annulée',
      'PARDONNEE':  'Pardonnée'
    };
    return labels[statut] ?? statut;
  }

  getStatutColor(statut: StatutPenalite | string): string {
    switch (statut) {
      case 'PAYEE':      return 'green';
      case 'PARDONNEE':  return 'blue';
      case 'EN_ATTENTE': return 'yellow';
      case 'ANNULEE':    return 'red';
      default:           return 'gray';
    }
  }

  getMembreNom(p: Penalite): string {
    const u = p.exerciceMembre?.utilisateur;
    if (u) return `${u.prenom} ${u.nom}`;
    return p.exerciceMembre?.matricule ?? '—';
  }
}
