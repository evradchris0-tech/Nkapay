import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ReunionService, Reunion } from '../../services/reunion.service';
import { PresenceService, Presence, PresenceSummary, CotisationDue } from '../../services/presence.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-reunion-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, DatePipe, CurrencyPipe, DecimalPipe],
  templateUrl: './reunion-detail.component.html',
  styleUrl: './reunion-detail.component.scss'
})
export class ReunionDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private reunionService = inject(ReunionService);
  private presenceService = inject(PresenceService);
  private notification = inject(NotificationService);

  reunion = signal<Reunion | null>(null);
  presences = signal<Presence[]>([]);
  summary = signal<PresenceSummary | null>(null);
  cotisations = signal<CotisationDue[]>([]);
  isLoading = signal(true);
  isActionLoading = signal(false);
  activeTab = signal<'presences' | 'cotisations'>('presences');
  showCloturerForm = signal(false);

  cloturerMembreId = '';

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loadData(id);
  }

  private loadData(id: string) {
    this.isLoading.set(true);
    this.reunionService.getById(id).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success && res.data) {
          this.reunion.set(res.data);
          this.loadPresences(id);
          this.loadCotisations(id);
        } else {
          this.notification.error('Erreur', 'Réunion introuvable');
          this.router.navigate(['/dashboard/reunions']);
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.notification.error('Erreur', 'Impossible de charger la réunion');
        this.router.navigate(['/dashboard/reunions']);
      }
    });
  }

  private loadPresences(reunionId: string) {
    this.presenceService.getByReunion(reunionId).subscribe({
      next: (res) => {
        if (res.success && res.data) this.presences.set(res.data);
      },
      error: () => {}
    });
    this.presenceService.getSummary(reunionId).subscribe({
      next: (res) => {
        if (res.success && res.data) this.summary.set(res.data);
      },
      error: () => {}
    });
  }

  private loadCotisations(reunionId: string) {
    this.presenceService.getCotisationsDues(reunionId).subscribe({
      next: (res) => {
        if (res.success && res.data) this.cotisations.set(res.data);
      },
      error: () => {}
    });
  }

  ouvrir() {
    const r = this.reunion();
    if (!r) return;
    this.isActionLoading.set(true);
    this.reunionService.ouvrir(r.id).subscribe({
      next: (res) => {
        this.isActionLoading.set(false);
        if (res.success && res.data) {
          this.reunion.set(res.data);
          this.loadPresences(r.id);
          this.notification.success('Réunion ouverte', 'La réunion est maintenant ouverte');
        }
      },
      error: (err) => {
        this.isActionLoading.set(false);
        this.notification.error('Erreur', err.error?.message || 'Impossible d\'ouvrir la réunion');
      }
    });
  }

  cloturer() {
    const r = this.reunion();
    if (!r) return;
    if (!this.cloturerMembreId) {
      this.notification.warning('Champ requis', 'Sélectionnez le membre qui clôture la réunion');
      return;
    }
    this.isActionLoading.set(true);
    this.reunionService.cloturer(r.id, this.cloturerMembreId).subscribe({
      next: (res) => {
        this.isActionLoading.set(false);
        if (res.success && res.data) {
          this.reunion.set(res.data);
          this.showCloturerForm.set(false);
          this.cloturerMembreId = '';
          this.notification.success('Réunion clôturée', 'La réunion a été clôturée avec succès');
        }
      },
      error: (err) => {
        this.isActionLoading.set(false);
        this.notification.error('Erreur', err.error?.message || 'Impossible de clôturer la réunion');
      }
    });
  }

  annuler() {
    const r = this.reunion();
    if (!r) return;
    if (!confirm('Êtes-vous sûr de vouloir annuler cette réunion ?')) return;
    this.isActionLoading.set(true);
    this.reunionService.annuler(r.id).subscribe({
      next: (res) => {
        this.isActionLoading.set(false);
        if (res.success && res.data) {
          this.reunion.set(res.data);
          this.notification.success('Réunion annulée', 'La réunion a été annulée');
        }
      },
      error: (err) => {
        this.isActionLoading.set(false);
        this.notification.error('Erreur', err.error?.message || 'Impossible d\'annuler la réunion');
      }
    });
  }

  getStatusClass(statut: string): string {
    const map: Record<string, string> = {
      OUVERTE: 'green',
      PLANIFIEE: 'blue',
      CLOTUREE: 'gray',
      ANNULEE: 'red'
    };
    return map[statut] ?? 'gray';
  }

  getStatusLabel(statut: string): string {
    const map: Record<string, string> = {
      OUVERTE: 'Ouverte',
      PLANIFIEE: 'Planifiée',
      CLOTUREE: 'Clôturée',
      ANNULEE: 'Annulée'
    };
    return map[statut] ?? statut;
  }

  getCotisationClass(statut: string): string {
    const map: Record<string, string> = {
      PAYEE: 'green',
      EN_ATTENTE: 'orange',
      ANNULEE: 'red'
    };
    return map[statut] ?? 'gray';
  }
}
