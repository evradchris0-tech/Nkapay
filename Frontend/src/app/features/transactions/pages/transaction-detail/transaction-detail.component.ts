import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TransactionService, Transaction, StatutTransaction } from '../../services/transaction.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-transaction-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe, DatePipe, FormsModule],
  templateUrl: './transaction-detail.component.html',
  styleUrl: './transaction-detail.component.scss'
})
export class TransactionDetailComponent implements OnInit {
  private transactionService = inject(TransactionService);
  private notif = inject(NotificationService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  transaction = signal<Transaction | null>(null);
  isLoading = signal(true);
  hasError = signal(false);
  actionInProgress = signal(false);

  // Modal valider
  showValiderModal = signal(false);
  valideParExerciceMembreId = '';

  // Modal rejeter
  showRejeterModal = signal(false);
  rejeteParExerciceMembreId = '';
  motifRejet = '';

  // Computed: transitions autorisées — BROUILLON → SOUMIS → VALIDE/REJETE → ANNULE
  canSoumettre = computed(() => this.transaction()?.statut === 'BROUILLON');
  canValider   = computed(() => this.transaction()?.statut === 'SOUMIS');
  canRejeter   = computed(() => this.transaction()?.statut === 'SOUMIS');
  canAnnuler   = computed(() => {
    const s = this.transaction()?.statut;
    return s === 'BROUILLON' || s === 'SOUMIS';
  });

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.load(id);
    } else {
      this.router.navigate(['/dashboard/transactions']);
    }
  }

  load(id: string): void {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.transactionService.getById(id).subscribe({
      next: res => {
        if (res.success && res.data) {
          this.transaction.set(res.data);
        } else {
          this.hasError.set(true);
          this.notif.error(res.message ?? 'Transaction introuvable');
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

  // ─── Actions state machine ────────────────────────────────────────────────

  soumettre(): void {
    const tx = this.transaction();
    if (!tx) return;
    this.actionInProgress.set(true);
    this.transactionService.soumettre(tx.id).subscribe({
      next: res => {
        this.actionInProgress.set(false);
        if (res.success && res.data) {
          this.transaction.set(res.data);
          this.notif.success('Transaction soumise pour validation');
        } else {
          this.notif.error(res.message ?? 'Échec de la soumission');
        }
      },
      error: err => {
        this.actionInProgress.set(false);
        this.notif.error(err.error?.message ?? 'Erreur serveur');
      }
    });
  }

  openValiderModal(): void {
    this.valideParExerciceMembreId = '';
    this.showValiderModal.set(true);
  }

  closeValiderModal(): void {
    this.showValiderModal.set(false);
  }

  confirmerValider(): void {
    const tx = this.transaction();
    if (!tx || !this.valideParExerciceMembreId.trim()) return;
    this.actionInProgress.set(true);
    this.showValiderModal.set(false);
    this.transactionService.valider(tx.id, this.valideParExerciceMembreId.trim()).subscribe({
      next: res => {
        this.actionInProgress.set(false);
        if (res.success && res.data) {
          this.transaction.set(res.data);
          this.notif.success('Transaction validée avec succès');
        } else {
          this.notif.error(res.message ?? 'Échec de la validation');
        }
      },
      error: err => {
        this.actionInProgress.set(false);
        this.notif.error(err.error?.message ?? 'Erreur serveur');
      }
    });
  }

  openRejeterModal(): void {
    this.rejeteParExerciceMembreId = '';
    this.motifRejet = '';
    this.showRejeterModal.set(true);
  }

  closeRejeterModal(): void {
    this.showRejeterModal.set(false);
  }

  confirmerRejeter(): void {
    const tx = this.transaction();
    if (!tx || !this.rejeteParExerciceMembreId.trim() || !this.motifRejet.trim()) return;
    this.actionInProgress.set(true);
    this.showRejeterModal.set(false);
    this.transactionService.rejeter(tx.id, {
      rejeteParExerciceMembreId: this.rejeteParExerciceMembreId.trim(),
      motifRejet: this.motifRejet.trim()
    }).subscribe({
      next: res => {
        this.actionInProgress.set(false);
        if (res.success && res.data) {
          this.transaction.set(res.data);
          this.notif.success('Transaction rejetée');
        } else {
          this.notif.error(res.message ?? 'Échec du rejet');
        }
      },
      error: err => {
        this.actionInProgress.set(false);
        this.notif.error(err.error?.message ?? 'Erreur serveur');
      }
    });
  }

  annuler(): void {
    const tx = this.transaction();
    if (!tx) return;
    if (!confirm('Confirmer l\'annulation de cette transaction ?')) return;
    this.actionInProgress.set(true);
    this.transactionService.annuler(tx.id).subscribe({
      next: res => {
        this.actionInProgress.set(false);
        if (res.success && res.data) {
          this.transaction.set(res.data);
          this.notif.success('Transaction annulée');
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

  // ─── Helpers UI ──────────────────────────────────────────────────────────

  getStatutLabel(statut: StatutTransaction | string): string {
    const labels: Record<string, string> = {
      'BROUILLON': 'Brouillon',
      'SOUMIS':    'Soumis',
      'VALIDE':    'Validé',
      'REJETE':    'Rejeté',
      'ANNULE':    'Annulé',
      'EXPIRE':    'Expiré'
    };
    return labels[statut] ?? statut;
  }

  getStatutColor(statut: StatutTransaction | string): string {
    switch (statut) {
      case 'VALIDE':   return 'green';
      case 'SOUMIS':   return 'blue';
      case 'BROUILLON':return 'yellow';
      case 'REJETE':
      case 'ANNULE':   return 'red';
      default:         return 'gray';
    }
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'COTISATION':       'Cotisation',
      'POT':              'Pot',
      'INSCRIPTION':      'Inscription',
      'SECOURS':          'Secours',
      'EPARGNE':          'Épargne',
      'DECAISSEMENT_PRET':'Décaissement prêt',
      'REMBOURSEMENT_PRET':'Remboursement prêt',
      'PENALITE':         'Pénalité',
      'PROJET':           'Projet',
      'AUTRE':            'Autre'
    };
    return labels[type] ?? type;
  }

  getMembreNom(tx: Transaction): string {
    const m = tx.exerciceMembre;
    if (!m) return '—';
    const u = m.utilisateur;
    return u ? `${u.prenom} ${u.nom}` : m.matricule ?? '—';
  }
}
