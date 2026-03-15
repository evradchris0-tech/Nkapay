import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  SecoursService,
  EvenementSecours,
  StatutEvenementSecours,
  TypeEvenementSecours,
  CreateEvenementSecoursDto
} from '../../services/secours.service';
import { NotificationService } from '../../../../core/services/notification.service';

type FiltreStatut = StatutEvenementSecours | 'TOUS';

@Component({
  selector: 'app-evenement-secours-list',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe, DatePipe, FormsModule],
  templateUrl: './evenement-secours-list.component.html',
  styleUrl: './evenement-secours-list.component.scss'
})
export class EvenementSecoursListComponent implements OnInit {
  private secoursService = inject(SecoursService);
  private notif          = inject(NotificationService);

  evenements        = signal<EvenementSecours[]>([]);
  typesEvenement    = signal<TypeEvenementSecours[]>([]);
  isLoading         = signal(true);
  hasError          = signal(false);
  actionInProgress  = signal(false);
  filtreStatut      = signal<FiltreStatut>('TOUS');

  // Événement sélectionné pour action
  selectedEvenement = signal<EvenementSecours | null>(null);

  // ─── Modals ───────────────────────────────────────────────────────────────
  showDeclarerModal = signal(false);
  showSoumettreModal = signal(false);
  showValiderModal  = signal(false);
  showRefuserModal  = signal(false);
  showPayerModal    = signal(false);

  // Champs formulaire — Déclarer
  nouveauExerciceMembreId   = '';
  nouveauTypeId             = '';
  nouvelleDateEvenement     = '';
  nouvelleDescription       = '';
  nouveauMontantDemande: number | null = null;

  // Champs formulaire — Valider
  valideParExerciceMembreId = '';
  montantApprouve: number | null = null;

  // Champs formulaire — Refuser
  refuseParExerciceMembreId = '';
  motifRefus                = '';

  // Champs formulaire — Payer
  transactionId             = '';

  // ─── Computed ─────────────────────────────────────────────────────────────
  evenementsFiltres = computed(() => {
    const f = this.filtreStatut();
    if (f === 'TOUS') return this.evenements();
    return this.evenements().filter(e => e.statut === f);
  });

  isEmpty = computed(() => !this.isLoading() && this.evenementsFiltres().length === 0);

  readonly filtres: { key: FiltreStatut; label: string }[] = [
    { key: 'TOUS',               label: 'Tous' },
    { key: 'DECLARE',            label: 'Déclarés' },
    { key: 'EN_COURS_VALIDATION', label: 'En validation' },
    { key: 'VALIDE',             label: 'Validés' },
    { key: 'REFUSE',             label: 'Refusés' },
    { key: 'PAYE',               label: 'Payés' }
  ];

  compteurs = computed((): Record<FiltreStatut, number> => {
    const all = this.evenements();
    return {
      TOUS:                all.length,
      DECLARE:             all.filter(e => e.statut === 'DECLARE').length,
      EN_COURS_VALIDATION: all.filter(e => e.statut === 'EN_COURS_VALIDATION').length,
      VALIDE:              all.filter(e => e.statut === 'VALIDE').length,
      REFUSE:              all.filter(e => e.statut === 'REFUSE').length,
      PAYE:                all.filter(e => e.statut === 'PAYE').length
    };
  });

  ngOnInit(): void {
    this.load();
    this.loadTypes();
  }

  load(): void {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.secoursService.getEvenements({ limit: 100 }).subscribe({
      next: res => {
        if (res.success) {
          this.evenements.set(res.data ?? []);
        } else {
          this.hasError.set(true);
          this.notif.error('Erreur de chargement');
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

  loadTypes(): void {
    this.secoursService.getTypesEvenement().subscribe({
      next: res => {
        if (res.success) {
          this.typesEvenement.set((res.data ?? []).filter(t => t.estActif));
        }
      },
      error: () => {}
    });
  }

  setFiltre(f: FiltreStatut): void {
    this.filtreStatut.set(f);
  }

  // ─── Déclarer ─────────────────────────────────────────────────────────────

  openDeclarerModal(): void {
    this.nouveauExerciceMembreId = '';
    this.nouveauTypeId = '';
    this.nouvelleDateEvenement = '';
    this.nouvelleDescription = '';
    this.nouveauMontantDemande = null;
    this.showDeclarerModal.set(true);
  }

  closeDeclarerModal(): void {
    this.showDeclarerModal.set(false);
  }

  declarer(): void {
    if (!this.nouveauExerciceMembreId.trim() || !this.nouveauTypeId || !this.nouvelleDateEvenement) return;
    this.actionInProgress.set(true);
    const data: CreateEvenementSecoursDto = {
      exerciceMembreId: this.nouveauExerciceMembreId.trim(),
      typeEvenementSecoursId: this.nouveauTypeId,
      dateEvenement: this.nouvelleDateEvenement,
      description: this.nouvelleDescription.trim() || undefined,
      montantDemande: this.nouveauMontantDemande ?? undefined
    };
    this.secoursService.createEvenement(data).subscribe({
      next: res => {
        this.actionInProgress.set(false);
        if (res.success && res.data) {
          this.evenements.update(list => [res.data!, ...list]);
          this.notif.success('Événement déclaré avec succès');
          this.closeDeclarerModal();
        } else {
          this.notif.error(res.message ?? 'Échec de la déclaration');
        }
      },
      error: err => {
        this.actionInProgress.set(false);
        this.notif.error(err.error?.message ?? 'Erreur serveur');
      }
    });
  }

  // ─── Soumettre ────────────────────────────────────────────────────────────

  soumettre(ev: EvenementSecours): void {
    if (!confirm(`Soumettre l'événement « ${ev.typeEvenementSecours?.libelle ?? ''} » à la validation ?`)) return;
    this.actionInProgress.set(true);
    this.secoursService.soumettreEvenement(ev.id).subscribe({
      next: res => {
        this.actionInProgress.set(false);
        if (res.success && res.data) {
          this.updateEvenement(res.data);
          this.notif.success('Événement soumis pour validation');
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

  // ─── Valider ──────────────────────────────────────────────────────────────

  openValiderModal(ev: EvenementSecours): void {
    this.selectedEvenement.set(ev);
    this.valideParExerciceMembreId = '';
    this.montantApprouve = ev.montantDemande ?? null;
    this.showValiderModal.set(true);
  }

  closeValiderModal(): void {
    this.showValiderModal.set(false);
    this.selectedEvenement.set(null);
  }

  confirmerValider(): void {
    const ev = this.selectedEvenement();
    if (!ev || !this.valideParExerciceMembreId.trim() || !this.montantApprouve) return;
    this.actionInProgress.set(true);
    this.showValiderModal.set(false);
    this.secoursService.validerEvenement(ev.id, {
      valideParExerciceMembreId: this.valideParExerciceMembreId.trim(),
      montantApprouve: this.montantApprouve
    }).subscribe({
      next: res => {
        this.actionInProgress.set(false);
        if (res.success && res.data) {
          this.updateEvenement(res.data);
          this.notif.success('Événement validé');
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

  // ─── Refuser ──────────────────────────────────────────────────────────────

  openRefuserModal(ev: EvenementSecours): void {
    this.selectedEvenement.set(ev);
    this.refuseParExerciceMembreId = '';
    this.motifRefus = '';
    this.showRefuserModal.set(true);
  }

  closeRefuserModal(): void {
    this.showRefuserModal.set(false);
    this.selectedEvenement.set(null);
  }

  confirmerRefuser(): void {
    const ev = this.selectedEvenement();
    if (!ev || !this.refuseParExerciceMembreId.trim() || !this.motifRefus.trim()) return;
    this.actionInProgress.set(true);
    this.showRefuserModal.set(false);
    this.secoursService.refuserEvenement(ev.id, {
      refuseParExerciceMembreId: this.refuseParExerciceMembreId.trim(),
      motifRefus: this.motifRefus.trim()
    }).subscribe({
      next: res => {
        this.actionInProgress.set(false);
        if (res.success && res.data) {
          this.updateEvenement(res.data);
          this.notif.success('Événement refusé');
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

  // ─── Payer ────────────────────────────────────────────────────────────────

  openPayerModal(ev: EvenementSecours): void {
    this.selectedEvenement.set(ev);
    this.transactionId = '';
    this.showPayerModal.set(true);
  }

  closePayerModal(): void {
    this.showPayerModal.set(false);
    this.selectedEvenement.set(null);
  }

  confirmerPayer(): void {
    const ev = this.selectedEvenement();
    if (!ev || !this.transactionId.trim()) return;
    this.actionInProgress.set(true);
    this.showPayerModal.set(false);
    this.secoursService.payerEvenement(ev.id, this.transactionId.trim()).subscribe({
      next: res => {
        this.actionInProgress.set(false);
        if (res.success && res.data) {
          this.updateEvenement(res.data);
          this.notif.success('Paiement enregistré');
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

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private updateEvenement(updated: EvenementSecours): void {
    this.evenements.update(list => list.map(e => e.id === updated.id ? updated : e));
  }

  getStatutLabel(statut: StatutEvenementSecours | string): string {
    const labels: Record<string, string> = {
      'DECLARE':             'Déclaré',
      'EN_COURS_VALIDATION': 'En validation',
      'VALIDE':              'Validé',
      'REFUSE':              'Refusé',
      'PAYE':                'Payé'
    };
    return labels[statut] ?? statut;
  }

  getStatutColor(statut: StatutEvenementSecours | string): string {
    switch (statut) {
      case 'PAYE':                return 'green';
      case 'VALIDE':              return 'blue';
      case 'EN_COURS_VALIDATION': return 'yellow';
      case 'REFUSE':              return 'red';
      case 'DECLARE':             return 'gray';
      default:                    return 'gray';
    }
  }

  getMembreNom(ev: EvenementSecours): string {
    return ev.exerciceMembre?.utilisateurNom ?? ev.exerciceMembreId;
  }
}
