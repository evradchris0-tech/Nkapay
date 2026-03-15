import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { ExerciceService, Exercice, ExerciceMembre, StatutExercice } from '../../services/exercice.service';
import { ApiResponse } from '../../../../core/models/api-response.model';
import { NotificationService } from '../../../../core/services/notification.service';

type ActiveTab = 'apercu' | 'membres';

@Component({
  selector: 'app-exercice-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './exercice-detail.component.html',
  styleUrl: './exercice-detail.component.scss'
})
export class ExerciceDetailComponent implements OnInit {
  private exerciceService  = inject(ExerciceService);
  private notif            = inject(NotificationService);
  private route            = inject(ActivatedRoute);
  private router           = inject(Router);

  exercice         = signal<Exercice | null>(null);
  membres          = signal<ExerciceMembre[]>([]);
  isLoading        = signal(true);
  hasError         = signal(false);
  isMembresLoading = signal(false);
  actionInProgress = signal(false);
  activeTab        = signal<ActiveTab>('apercu');

  // ─── State machine : BROUILLON → OUVERT ↔ SUSPENDU → FERME ──────────────
  canOuvrir   = computed(() => this.exercice()?.statut === 'BROUILLON');
  canSuspendre= computed(() => this.exercice()?.statut === 'OUVERT');
  canReprendre= computed(() => this.exercice()?.statut === 'SUSPENDU');
  canFermer   = computed(() => this.exercice()?.statut === 'OUVERT');

  isMembresEmpty = computed(() => !this.isMembresLoading() && this.membres().length === 0);

  // Stats membres
  membresActifs   = computed(() => this.membres().filter(m => m.statut === 'ACTIF').length);
  membresInactifs = computed(() => this.membres().filter(m => m.statut === 'INACTIF').length);

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.load(id);
    } else {
      this.router.navigate(['/dashboard/exercices']);
    }
  }

  load(id: string): void {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.exerciceService.getById(id).subscribe({
      next: res => {
        if (res.success && res.data) {
          this.exercice.set(res.data);
        } else {
          this.hasError.set(true);
          this.notif.error(res.message ?? 'Exercice introuvable');
        }
        this.isLoading.set(false);
      },
      error: err => {
        this.hasError.set(true);
        this.isLoading.set(false);
        this.notif.error(err.error?.message ?? 'Erreur de chargement');
        this.router.navigate(['/dashboard/exercices']);
      }
    });
  }

  setTab(tab: ActiveTab): void {
    this.activeTab.set(tab);
    if (tab === 'membres' && this.membres().length === 0) {
      this.loadMembres();
    }
  }

  loadMembres(): void {
    const ex = this.exercice();
    if (!ex) return;
    this.isMembresLoading.set(true);
    this.exerciceService.getMembresExercice(ex.id).subscribe({
      next: res => {
        if (res.success) {
          this.membres.set(res.data ?? []);
        } else {
          this.notif.error('Impossible de charger les membres');
        }
        this.isMembresLoading.set(false);
      },
      error: err => {
        this.isMembresLoading.set(false);
        this.notif.error(err.error?.message ?? 'Impossible de charger les membres');
      }
    });
  }

  // ─── Actions state machine ────────────────────────────────────────────────

  ouvrir(): void {
    const ex = this.exercice();
    if (!ex) return;
    if (!confirm(`Ouvrir l'exercice « ${ex.libelle} » ? Les membres pourront cotiser dès maintenant.`)) return;
    this.doAction(() => this.exerciceService.ouvrir(ex.id), 'Exercice ouvert avec succès');
  }

  suspendre(): void {
    const ex = this.exercice();
    if (!ex) return;
    if (!confirm(`Suspendre l'exercice « ${ex.libelle} » ? Les opérations seront bloquées temporairement.`)) return;
    this.doAction(() => this.exerciceService.suspendre(ex.id), 'Exercice suspendu');
  }

  reprendre(): void {
    const ex = this.exercice();
    if (!ex) return;
    this.doAction(() => this.exerciceService.reprendre(ex.id), 'Exercice repris');
  }

  fermer(): void {
    const ex = this.exercice();
    if (!ex) return;
    if (!confirm(`Fermer définitivement l'exercice « ${ex.libelle} » ? Cette action est irréversible.`)) return;
    this.doAction(() => this.exerciceService.fermer(ex.id), 'Exercice fermé');
  }

  private doAction(action: () => Observable<ApiResponse<Exercice>>, successMsg: string): void {
    this.actionInProgress.set(true);
    action().subscribe({
      next: (res: ApiResponse<Exercice>) => {
        this.actionInProgress.set(false);
        if (res.success && res.data) {
          this.exercice.set(res.data);
          this.notif.success(successMsg);
        } else {
          this.notif.error(res.message ?? 'Échec de l\'action');
        }
      },
      error: (err: { error?: { message?: string } }) => {
        this.actionInProgress.set(false);
        this.notif.error(err.error?.message ?? 'Erreur serveur');
      }
    });
  }

  // ─── Helpers UI ──────────────────────────────────────────────────────────

  getStatutLabel(statut: StatutExercice | string): string {
    const labels: Record<string, string> = {
      'BROUILLON': 'Brouillon',
      'OUVERT':    'Ouvert',
      'SUSPENDU':  'Suspendu',
      'FERME':     'Fermé'
    };
    return labels[statut] ?? statut;
  }

  getStatutColor(statut: StatutExercice | string): string {
    switch (statut) {
      case 'OUVERT':    return 'green';
      case 'SUSPENDU':  return 'yellow';
      case 'BROUILLON': return 'gray';
      case 'FERME':     return 'blue';
      default:          return 'gray';
    }
  }

  getTypeMembreLabel(type: string): string {
    const labels: Record<string, string> = {
      'ORDINAIRE':    'Ordinaire',
      'BENEFICIAIRE': 'Bénéficiaire',
      'OBSERVATEUR':  'Observateur'
    };
    return labels[type] ?? type;
  }

  getMoisLabel(mois: number): string {
    const moisLabels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    return moisLabels[mois - 1] ?? String(mois);
  }

  getMembreNom(m: ExerciceMembre): string {
    const u = m.adhesionTontine?.utilisateur;
    return u ? `${u.prenom} ${u.nom}` : m.adhesionTontine?.matricule ?? '—';
  }
}
