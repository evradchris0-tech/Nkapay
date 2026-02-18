import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TontineService } from '../../services/tontine.service';
import { Tontine, RegleTontine } from '../../../../core/models/tontine.model';
import { MembreService, AdhesionTontine, RoleMembre } from '../../../membres/services/membre.service';
import { ExerciceService, Exercice } from '../../../exercices/services/exercice.service';
import { UtilisateurService } from '../../../admin/services/utilisateur.service';
import { Utilisateur } from '../../../../core/models/user.model';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-tontine-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe, DatePipe, FormsModule],
  templateUrl: './tontine-detail.component.html',
  styleUrl: './tontine-detail.component.scss'
})
export class TontineDetailComponent implements OnInit {
  private tontineService = inject(TontineService);
  private membreService = inject(MembreService);
  private exerciceService = inject(ExerciceService);
  private utilisateurService = inject(UtilisateurService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private notification = inject(NotificationService);

  tontine = signal<Tontine | null>(null);
  membres = signal<AdhesionTontine[]>([]);
  exercices = signal<Exercice[]>([]);
  regles = signal<RegleTontine[]>([]);
  isLoading = signal(true);
  isMembresLoading = signal(false);
  isExercicesLoading = signal(false);
  isReglesLoading = signal(false);
  activeTab = signal<'overview' | 'membres' | 'exercices' | 'regles'>('overview');

  // Modal ajout membre
  showAddMembreModal = signal(false);
  utilisateurs = signal<Utilisateur[]>([]);
  isSearchingUsers = signal(false);
  isAddingMembre = signal(false);
  searchQuery = '';
  selectedUserId = '';
  newMatricule = '';
  newRole: RoleMembre = 'MEMBRE';
  roles: RoleMembre[] = ['PRESIDENT', 'VICE_PRESIDENT', 'TRESORIER', 'SECRETAIRE', 'COMMISSAIRE', 'MEMBRE'];

  ngOnInit() {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.loadTontine(id);
    }
  }

  loadTontine(id: string) {
    this.isLoading.set(true);
    this.tontineService.getById(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.tontine.set(response.data);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.notification.error('Erreur', 'Impossible de charger la tontine');
        this.router.navigate(['/dashboard/tontines']);
      }
    });
  }

  setTab(tab: 'overview' | 'membres' | 'exercices' | 'regles') {
    this.activeTab.set(tab);
    const tontineId = this.tontine()?.id;
    if (!tontineId) return;

    if (tab === 'membres' && this.membres().length === 0) {
      this.loadMembres(tontineId);
    } else if (tab === 'exercices' && this.exercices().length === 0) {
      this.loadExercices(tontineId);
    } else if (tab === 'regles' && this.regles().length === 0) {
      this.loadRegles(tontineId);
    }
  }

  loadMembres(tontineId: string) {
    this.isMembresLoading.set(true);
    this.membreService.getAdhesionsByTontine(tontineId).subscribe({
      next: (res) => {
        this.membres.set(res.data || []);
        this.isMembresLoading.set(false);
      },
      error: () => {
        this.notification.error('Erreur', 'Impossible de charger les membres');
        this.isMembresLoading.set(false);
      }
    });
  }

  loadExercices(tontineId: string) {
    this.isExercicesLoading.set(true);
    this.exerciceService.getAll({ tontineId }).subscribe({
      next: (res) => {
        this.exercices.set(res.data || []);
        this.isExercicesLoading.set(false);
      },
      error: () => {
        this.notification.error('Erreur', 'Impossible de charger les exercices');
        this.isExercicesLoading.set(false);
      }
    });
  }

  loadRegles(tontineId: string) {
    this.isReglesLoading.set(true);
    this.tontineService.getRegles(tontineId).subscribe({
      next: (res) => {
        this.regles.set(res.data || []);
        this.isReglesLoading.set(false);
      },
      error: () => {
        this.notification.error('Erreur', 'Impossible de charger les règles');
        this.isReglesLoading.set(false);
      }
    });
  }

  getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      'PRESIDENT': 'Président',
      'VICE_PRESIDENT': 'Vice-Président',
      'TRESORIER': 'Trésorier',
      'SECRETAIRE': 'Secrétaire',
      'COMMISSAIRE': 'Commissaire',
      'MEMBRE': 'Membre'
    };
    return labels[role] || role;
  }

  getStatutExerciceLabel(statut: string): string {
    const labels: Record<string, string> = {
      'PLANIFIE': 'Planifié',
      'OUVERT': 'Ouvert',
      'FERME': 'Fermé',
      'ANNULE': 'Annulé'
    };
    return labels[statut] || statut;
  }

  getStatutExerciceColor(statut: string): string {
    switch (statut) {
      case 'OUVERT': return 'green';
      case 'PLANIFIE': return 'blue';
      case 'FERME': return 'gray';
      case 'ANNULE': return 'red';
      default: return 'gray';
    }
  }

  exportPdf(type: 'fiche' | 'membres' | 'cotisations' | 'prets') {
    const id = this.tontine()?.id;
    if (!id) return;

    this.tontineService.exportPdf(id, type).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tontine-${id}-${type}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.notification.success('Export', 'PDF téléchargé avec succès');
      },
      error: () => {
        this.notification.error('Erreur', "Impossible d'exporter le PDF");
      }
    });
  }

  getStatusLabel(statut: string): string {
    switch (statut) {
      case 'ACTIVE': return 'Active';
      case 'INACTIVE': return 'Inactive';
      case 'SUSPENDUE': return 'Suspendue';
      default: return statut;
    }
  }

  getStatusColor(statut: string): string {
    switch (statut) {
      case 'ACTIVE': return 'green';
      case 'INACTIVE': return 'gray';
      case 'SUSPENDUE': return 'red';
      default: return 'gray';
    }
  }

  openAddMembreModal() {
    this.showAddMembreModal.set(true);
    this.searchQuery = '';
    this.selectedUserId = '';
    this.newMatricule = '';
    this.newRole = 'MEMBRE';
    this.utilisateurs.set([]);
  }

  closeAddMembreModal() {
    this.showAddMembreModal.set(false);
  }

  searchUsers() {
    if (this.searchQuery.length < 2) return;
    
    this.isSearchingUsers.set(true);
    this.utilisateurService.getAll({ search: this.searchQuery, limit: 10 }).subscribe({
      next: (res) => {
        const existingMemberIds = this.membres().map(m => m.utilisateurId);
        const filtered = (res.data || []).filter(u => !existingMemberIds.includes(u.id));
        this.utilisateurs.set(filtered);
        this.isSearchingUsers.set(false);
      },
      error: () => {
        this.isSearchingUsers.set(false);
        this.notification.error('Erreur', 'Recherche échouée');
      }
    });
  }

  selectUser(user: Utilisateur) {
    this.selectedUserId = user.id;
    this.newMatricule = `${this.tontine()?.nomCourt || 'TN'}-${String(this.membres().length + 1).padStart(3, '0')}`;
  }

  addMembre() {
    if (!this.selectedUserId || !this.newMatricule || !this.tontine()) return;

    this.isAddingMembre.set(true);
    const data = {
      tontineId: this.tontine()!.id,
      utilisateurId: this.selectedUserId,
      matricule: this.newMatricule,
      role: this.newRole
    };

    this.membreService.createAdhesion(data).subscribe({
      next: (res) => {
        this.isAddingMembre.set(false);
        if (res.success) {
          this.notification.success('Succès', 'Membre ajouté avec succès');
          this.closeAddMembreModal();
          this.loadMembres(this.tontine()!.id);
        } else {
          this.notification.error('Erreur', res.message || 'Ajout échoué');
        }
      },
      error: (err) => {
        this.isAddingMembre.set(false);
        this.notification.error('Erreur', err.error?.message || 'Ajout échoué');
      }
    });
  }
}
