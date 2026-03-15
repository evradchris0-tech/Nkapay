import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  MembreService,
  AdhesionTontine,
  ExerciceMembre,
  StatutAdhesion
} from '../../services/membre.service';
import { NotificationService } from '../../../../core/services/notification.service';

type ActiveTab = 'apercu' | 'exercices';

@Component({
  selector: 'app-membre-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './membre-detail.component.html',
  styleUrl: './membre-detail.component.scss'
})
export class MembreDetailComponent implements OnInit {
  private membreService    = inject(MembreService);
  private notif            = inject(NotificationService);
  private route            = inject(ActivatedRoute);
  private router           = inject(Router);

  adhesion           = signal<AdhesionTontine | null>(null);
  exercices          = signal<ExerciceMembre[]>([]);
  isLoading          = signal(true);
  hasError           = signal(false);
  isExercicesLoading = signal(false);
  actionInProgress   = signal(false);
  activeTab          = signal<ActiveTab>('apercu');

  // ─── State machine : ACTIVE ↔ INACTIVE ───────────────────────────────────
  canDesactiver = computed(() => this.adhesion()?.statut === 'ACTIVE');
  canReactiver  = computed(() => this.adhesion()?.statut === 'INACTIVE');

  isExercicesEmpty = computed(() => !this.isExercicesLoading() && this.exercices().length === 0);
  exercicesActifs  = computed(() => this.exercices().filter(e => e.estActif).length);

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.load(id);
    } else {
      this.router.navigate(['/dashboard/membres']);
    }
  }

  load(id: string): void {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.membreService.getAdhesionById(id).subscribe({
      next: res => {
        if (res.success && res.data) {
          this.adhesion.set(res.data);
        } else {
          this.hasError.set(true);
          this.notif.error(res.message ?? 'Membre introuvable');
        }
        this.isLoading.set(false);
      },
      error: err => {
        this.hasError.set(true);
        this.isLoading.set(false);
        this.notif.error(err.error?.message ?? 'Erreur de chargement');
        this.router.navigate(['/dashboard/membres']);
      }
    });
  }

  setTab(tab: ActiveTab): void {
    this.activeTab.set(tab);
    if (tab === 'exercices' && this.exercices().length === 0) {
      this.loadExercices();
    }
  }

  loadExercices(): void {
    const a = this.adhesion();
    if (!a) return;
    this.isExercicesLoading.set(true);
    this.membreService.getExerciceMembres({ adhesionTontineId: a.id, limit: 50 }).subscribe({
      next: res => {
        if (res.success) {
          this.exercices.set(res.data ?? []);
        } else {
          this.notif.error('Impossible de charger les exercices');
        }
        this.isExercicesLoading.set(false);
      },
      error: err => {
        this.isExercicesLoading.set(false);
        this.notif.error(err.error?.message ?? 'Erreur de chargement');
      }
    });
  }

  // ─── Actions state machine ────────────────────────────────────────────────

  desactiver(): void {
    const a = this.adhesion();
    if (!a) return;
    if (!confirm(`Désactiver le membre « ${this.getMembreNom(a)} » ? Il ne pourra plus participer aux activités de la tontine.`)) return;
    this.actionInProgress.set(true);
    this.membreService.desactiverAdhesion(a.id).subscribe({
      next: res => {
        this.actionInProgress.set(false);
        if (res.success && res.data) {
          this.adhesion.set(res.data);
          this.notif.success('Membre désactivé');
        } else {
          this.notif.error(res.message ?? 'Échec de la désactivation');
        }
      },
      error: err => {
        this.actionInProgress.set(false);
        this.notif.error(err.error?.message ?? 'Erreur serveur');
      }
    });
  }

  reactiver(): void {
    const a = this.adhesion();
    if (!a) return;
    if (!confirm(`Réactiver le membre « ${this.getMembreNom(a)} » ?`)) return;
    this.actionInProgress.set(true);
    this.membreService.reactiverAdhesion(a.id).subscribe({
      next: res => {
        this.actionInProgress.set(false);
        if (res.success && res.data) {
          this.adhesion.set(res.data);
          this.notif.success('Membre réactivé');
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

  // ─── Helpers UI ──────────────────────────────────────────────────────────

  getMembreNom(a: AdhesionTontine): string {
    const u = a.utilisateur;
    return u ? `${u.prenom} ${u.nom}` : a.matricule;
  }

  getStatutColor(statut: StatutAdhesion | string): string {
    return statut === 'ACTIVE' ? 'green' : 'gray';
  }

  getStatutLabel(statut: StatutAdhesion | string): string {
    return statut === 'ACTIVE' ? 'Actif' : 'Inactif';
  }

  getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      'PRESIDENT':      'Président',
      'VICE_PRESIDENT': 'Vice-Président',
      'TRESORIER':      'Trésorier',
      'SECRETAIRE':     'Secrétaire',
      'COMMISSAIRE':    'Commissaire',
      'MEMBRE':         'Membre'
    };
    return labels[role] ?? role;
  }
}
