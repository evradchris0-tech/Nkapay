import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { ApiResponse, PaginatedResponse } from '../../../../core/models/api-response.model';
import { NotificationService } from '../../../../core/services/notification.service';

interface ExerciceItem {
  id: string;
  libelle: string;
  statut: string;
  tontine?: { nom: string };
}

interface ExerciceMembreItem {
  id: string;
  matricule: string;
  utilisateur?: { prenom: string; nom: string };
}

interface ReunionItem {
  id: string;
  numeroReunion: number;
  dateReunion: string;
  statut: string;
}

type ExportFormat = 'pdf' | 'excel';

@Component({
  selector: 'app-rapports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rapports.component.html',
  styleUrl: './rapports.component.scss'
})
export class RapportsComponent implements OnInit {
  private api   = inject(ApiService);
  private notif = inject(NotificationService);

  // ─── Données partagées ────────────────────────────────────────────────────
  exercices      = signal<ExerciceItem[]>([]);
  isLoadingExos  = signal(true);
  hasError       = signal(false);

  // ─── Relevé individuel ────────────────────────────────────────────────────
  exoIdReleve       = signal('');
  membresReleve     = signal<ExerciceMembreItem[]>([]);
  membreId          = signal('');
  isLoadingMembres  = signal(false);
  formatReleve      = signal<ExportFormat>('pdf');
  dlReleve          = signal(false);

  canDownloadReleve = computed(() =>
    !!this.exoIdReleve() && !!this.membreId() && !this.dlReleve()
  );

  // ─── Rapport exercice ─────────────────────────────────────────────────────
  exoIdExercice    = signal('');
  formatExercice   = signal<ExportFormat>('pdf');
  dlExercice       = signal(false);

  canDownloadExercice = computed(() =>
    !!this.exoIdExercice() && !this.dlExercice()
  );

  // ─── Rapport mensuel ──────────────────────────────────────────────────────
  exoIdMensuel      = signal('');
  reunions          = signal<ReunionItem[]>([]);
  reunionId         = signal('');
  isLoadingReunions = signal(false);
  formatMensuel     = signal<ExportFormat>('pdf');
  dlMensuel         = signal(false);

  canDownloadMensuel = computed(() =>
    !!this.exoIdMensuel() && !!this.reunionId() && !this.dlMensuel()
  );

  ngOnInit(): void {
    this.loadExercices();
  }

  // ─── Chargement des données ───────────────────────────────────────────────

  loadExercices(): void {
    this.isLoadingExos.set(true);
    this.hasError.set(false);
    this.api.get<PaginatedResponse<ExerciceItem>>('/exercices', { page: 1, limit: 100 }).subscribe({
      next: res => {
        if (res.success) {
          this.exercices.set(res.data ?? []);
        } else {
          this.hasError.set(true);
          this.notif.error('Impossible de charger les exercices');
        }
        this.isLoadingExos.set(false);
      },
      error: err => {
        this.hasError.set(true);
        this.isLoadingExos.set(false);
        this.notif.error(err.error?.message ?? 'Erreur de chargement des exercices');
      }
    });
  }

  onExoReleveChange(): void {
    this.membreId.set('');
    this.membresReleve.set([]);
    const id = this.exoIdReleve();
    if (!id) return;
    this.isLoadingMembres.set(true);
    this.api.get<ApiResponse<ExerciceMembreItem[]>>(`/exercices-membres/exercice/${id}`).subscribe({
      next: res => {
        if (res.success && res.data) {
          this.membresReleve.set(res.data);
        }
        this.isLoadingMembres.set(false);
      },
      error: () => this.isLoadingMembres.set(false)
    });
  }

  onExoMensuelChange(): void {
    this.reunionId.set('');
    this.reunions.set([]);
    const id = this.exoIdMensuel();
    if (!id) return;
    this.isLoadingReunions.set(true);
    this.api.get<PaginatedResponse<ReunionItem>>('/reunions', { exerciceId: id, limit: 100 }).subscribe({
      next: res => {
        if (res.success) {
          this.reunions.set(res.data ?? []);
        }
        this.isLoadingReunions.set(false);
      },
      error: () => this.isLoadingReunions.set(false)
    });
  }

  // ─── Téléchargements ──────────────────────────────────────────────────────

  downloadReleve(): void {
    const exerciceMembreId = this.membreId();
    if (!exerciceMembreId) return;
    const fmt = this.formatReleve();
    const ext = fmt === 'pdf' ? 'pdf' : 'xlsx';
    const membre = this.membresReleve().find(m => m.id === exerciceMembreId);
    const nomFichier = `releve-${membre?.matricule ?? exerciceMembreId}.${ext}`;
    this.dlReleve.set(true);
    this.api.download(`/exports/releve/${exerciceMembreId}?format=${fmt}`).subscribe({
      next: blob => {
        this.triggerDownload(blob, nomFichier);
        this.dlReleve.set(false);
        this.notif.success('Téléchargement lancé');
      },
      error: err => {
        this.dlReleve.set(false);
        this.notif.error(err.error?.message ?? 'Erreur lors du téléchargement');
      }
    });
  }

  downloadExercice(): void {
    const exerciceId = this.exoIdExercice();
    if (!exerciceId) return;
    const fmt = this.formatExercice();
    const ext = fmt === 'pdf' ? 'pdf' : 'xlsx';
    const exo = this.exercices().find(e => e.id === exerciceId);
    const nomFichier = `rapport-exercice-${exo?.libelle ?? exerciceId}.${ext}`;
    this.dlExercice.set(true);
    this.api.download(`/exports/rapport-exercice/${exerciceId}?format=${fmt}`).subscribe({
      next: blob => {
        this.triggerDownload(blob, nomFichier);
        this.dlExercice.set(false);
        this.notif.success('Téléchargement lancé');
      },
      error: err => {
        this.dlExercice.set(false);
        this.notif.error(err.error?.message ?? 'Erreur lors du téléchargement');
      }
    });
  }

  downloadMensuel(): void {
    const reunionId = this.reunionId();
    if (!reunionId) return;
    const fmt = this.formatMensuel();
    const ext = fmt === 'pdf' ? 'pdf' : 'xlsx';
    const reunion = this.reunions().find(r => r.id === reunionId);
    const nomFichier = `rapport-reunion-${reunion?.numeroReunion ?? reunionId}.${ext}`;
    this.dlMensuel.set(true);
    this.api.download(`/exports/rapport-mensuel/${reunionId}?format=${fmt}`).subscribe({
      next: blob => {
        this.triggerDownload(blob, nomFichier);
        this.dlMensuel.set(false);
        this.notif.success('Téléchargement lancé');
      },
      error: err => {
        this.dlMensuel.set(false);
        this.notif.error(err.error?.message ?? 'Erreur lors du téléchargement');
      }
    });
  }

  private triggerDownload(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  getMembreLabel(m: ExerciceMembreItem): string {
    if (m.utilisateur) return `${m.utilisateur.prenom} ${m.utilisateur.nom} (${m.matricule})`;
    return m.matricule;
  }

  getExoLabel(e: ExerciceItem): string {
    const tontine = e.tontine?.nom ? `${e.tontine.nom} — ` : '';
    return `${tontine}${e.libelle}`;
  }

  getReunionLabel(r: ReunionItem): string {
    const date = new Date(r.dateReunion).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return `Réunion n°${r.numeroReunion} — ${date}`;
  }
}
