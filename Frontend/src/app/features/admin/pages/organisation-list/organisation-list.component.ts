import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import {
  OrganisationService,
  Organisation,
  StatutOrganisation,
  PlanAbonnement
} from '../../services/organisation.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-organisation-list',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, FormsModule, ReactiveFormsModule],
  templateUrl: './organisation-list.component.html',
  styleUrl: './organisation-list.component.scss'
})
export class OrganisationListComponent implements OnInit {
  private orgService = inject(OrganisationService);
  private notif      = inject(NotificationService);
  private fb         = inject(FormBuilder);

  organisations = signal<Organisation[]>([]);
  plans         = signal<PlanAbonnement[]>([]);
  isLoading     = signal(true);
  hasError      = signal(false);
  actionId      = signal<string | null>(null);

  // Filtres client-side
  searchTerm    = '';
  filtreStatut  = signal<StatutOrganisation | ''>('');

  organisationsFiltrees = computed(() => {
    let list = this.organisations();
    const statut = this.filtreStatut();
    if (statut) list = list.filter(o => o.statut === statut);
    const term = this.searchTerm.toLowerCase().trim();
    if (term) list = list.filter(o =>
      o.nom.toLowerCase().includes(term) ||
      o.slug.toLowerCase().includes(term) ||
      o.emailContact.toLowerCase().includes(term)
    );
    return list;
  });

  isEmpty = computed(() => !this.isLoading() && this.organisationsFiltrees().length === 0);

  // Compteurs
  nbActives   = computed(() => this.organisations().filter(o => o.statut === 'ACTIVE').length);
  nbSuspendues = computed(() => this.organisations().filter(o => o.statut === 'SUSPENDUE').length);
  nbExpirees  = computed(() => this.organisations().filter(o => o.statut === 'EXPIREE').length);

  // Modal création
  showCreateModal = signal(false);
  isSubmitting    = signal(false);
  form!: FormGroup;

  ngOnInit(): void {
    this.form = this.fb.group({
      nom:              ['', Validators.required],
      slug:             ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
      emailContact:     ['', [Validators.required, Validators.email]],
      telephoneContact: [''],
      pays:             ['CM'],
      devise:           ['XAF'],
      fuseauHoraire:    ['Africa/Douala'],
      planAbonnementId: ['']
    });
    this.load();
    this.loadPlans();
  }

  load(): void {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.orgService.getAll().subscribe({
      next: res => {
        if (res.success && res.data) {
          this.organisations.set(res.data);
        } else {
          this.hasError.set(true);
          this.notif.error(res.message ?? 'Erreur de chargement');
        }
        this.isLoading.set(false);
      },
      error: err => {
        this.hasError.set(true);
        this.isLoading.set(false);
        this.notif.error(err.error?.message ?? 'Erreur serveur');
      }
    });
  }

  loadPlans(): void {
    this.orgService.getPlans().subscribe({
      next: res => {
        if (res.success && res.data) {
          this.plans.set(res.data.filter(p => p.estActif));
        }
      },
      error: () => {}
    });
  }

  // ─── Filtres ─────────────────────────────────────────────────────────────

  onSearchKeyup(event: KeyboardEvent): void {
    if (event.key === 'Enter') this.applyFilter();
  }

  applyFilter(): void {
    // Computed reacts automatically — nothing to do
  }

  setFiltreStatut(statut: StatutOrganisation | ''): void {
    this.filtreStatut.set(statut);
  }

  clearSearch(): void {
    this.searchTerm = '';
  }

  // ─── Création ────────────────────────────────────────────────────────────

  openCreateModal(): void {
    this.form.reset({
      nom: '', slug: '', emailContact: '',
      telephoneContact: '', pays: 'CM',
      devise: 'XAF', fuseauHoraire: 'Africa/Douala',
      planAbonnementId: ''
    });
    this.showCreateModal.set(true);
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
  }

  get f() { return this.form.controls; }

  // Auto-slug from nom
  onNomChange(): void {
    const nom = this.form.value.nom ?? '';
    const slug = nom.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    this.form.patchValue({ slug });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isSubmitting.set(true);
    const val = this.form.value;
    const dto = {
      nom:              val.nom,
      slug:             val.slug,
      emailContact:     val.emailContact,
      telephoneContact: val.telephoneContact || undefined,
      pays:             val.pays || undefined,
      devise:           val.devise || undefined,
      fuseauHoraire:    val.fuseauHoraire || undefined,
      planAbonnementId: val.planAbonnementId || undefined
    };
    this.orgService.create(dto).subscribe({
      next: res => {
        this.isSubmitting.set(false);
        if (res.success && res.data) {
          this.organisations.update(list => [res.data!, ...list]);
          this.notif.success('Organisation créée avec succès');
          this.closeCreateModal();
        } else {
          this.notif.error(res.message ?? 'Échec de la création');
        }
      },
      error: err => {
        this.isSubmitting.set(false);
        this.notif.error(err.error?.message ?? 'Erreur serveur');
      }
    });
  }

  // ─── State machine ────────────────────────────────────────────────────────

  suspendre(org: Organisation): void {
    if (!confirm(`Suspendre l'organisation « ${org.nom} » ?`)) return;
    this.actionId.set(org.id);
    this.orgService.suspendre(org.id).subscribe({
      next: res => {
        this.actionId.set(null);
        if (res.success && res.data) {
          this.updateInList(res.data);
          this.notif.success(`${org.nom} suspendue`);
        } else {
          this.notif.error(res.message ?? 'Échec');
        }
      },
      error: err => {
        this.actionId.set(null);
        this.notif.error(err.error?.message ?? 'Erreur serveur');
      }
    });
  }

  reactiver(org: Organisation): void {
    if (!confirm(`Réactiver l'organisation « ${org.nom} » ?`)) return;
    this.actionId.set(org.id);
    this.orgService.reactiver(org.id).subscribe({
      next: res => {
        this.actionId.set(null);
        if (res.success && res.data) {
          this.updateInList(res.data);
          this.notif.success(`${org.nom} réactivée`);
        } else {
          this.notif.error(res.message ?? 'Échec');
        }
      },
      error: err => {
        this.actionId.set(null);
        this.notif.error(err.error?.message ?? 'Erreur serveur');
      }
    });
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private updateInList(updated: Organisation): void {
    this.organisations.update(list =>
      list.map(o => o.id === updated.id ? updated : o)
    );
  }

  isActionInProgress(orgId: string): boolean {
    return this.actionId() === orgId;
  }

  getStatutLabel(statut: StatutOrganisation): string {
    const labels: Record<string, string> = {
      'ACTIVE':    'Active',
      'SUSPENDUE': 'Suspendue',
      'EXPIREE':   'Expirée'
    };
    return labels[statut] ?? statut;
  }

  getStatutColor(statut: StatutOrganisation): string {
    switch (statut) {
      case 'ACTIVE':    return 'green';
      case 'SUSPENDUE': return 'orange';
      case 'EXPIREE':   return 'red';
      default:          return 'gray';
    }
  }

  getInitials(nom: string): string {
    return nom.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }
}
