import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TontineService } from '../../services/tontine.service';
import { Tontine, TontineType, TontineTypeLabels, StatutTontine } from '../../../../core/models/tontine.model';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-tontine-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, CurrencyPipe, DatePipe],
  templateUrl: './tontine-list.component.html',
  styleUrl: './tontine-list.component.scss'
})
export class TontineListComponent implements OnInit {
  private tontineService = inject(TontineService);
  private notification = inject(NotificationService);

  tontines = signal<Tontine[]>([]);
  isLoading = signal(true);
  searchTerm = '';
  selectedType: string | '' = '';
  
  tontineTypes = Object.values(TontineType);
  typeLabels = TontineTypeLabels;

  getTypeLabel(t: Tontine | null): string {
    if (!t) return '';
    return this.typeLabels[t.type ?? ''] ?? '';
  }

  ngOnInit() {
    this.loadTontines();
  }

  loadTontines() {
    this.isLoading.set(true);
    
    const params: any = { page: 1, limit: 50 };
    if (this.searchTerm) params.search = this.searchTerm;
    if (this.selectedType) params.type = this.selectedType;

    this.tontineService.getAll(params).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.tontines.set(response.data);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        // Mock data for dev
        this.tontines.set(this.getMockTontines());
      }
    });
  }

  onSearch() {
    this.loadTontines();
  }

  onFilterChange() {
    this.loadTontines();
  }

  deleteTontine(id: string, event: Event) {
    event.stopPropagation();
    if (confirm('Êtes-vous sûr de vouloir supprimer cette tontine ?')) {
      this.tontineService.delete(id).subscribe({
        next: () => {
          this.notification.success('Succès', 'Tontine supprimée');
          this.loadTontines();
        },
        error: () => {
          this.notification.error('Erreur', 'Impossible de supprimer la tontine');
        }
      });
    }
  }

  getStatusColor(statut: string): string {
    switch (statut) {
      case 'ACTIVE': return 'green';
      case 'EN_PREPARATION': return 'orange';
      case 'TERMINEE': return 'gray';
      case 'SUSPENDUE': return 'red';
      default: return 'gray';
    }
  }

  getStatusLabel(statut: string): string {
    switch (statut) {
      case 'ACTIVE': return 'Active';
      case 'EN_PREPARATION': return 'En préparation';
      case 'TERMINEE': return 'Terminée';
      case 'SUSPENDUE': return 'Suspendue';
      default: return statut;
    }
  }

  private getMockTontines(): Tontine[] {
    return [
      {
        id: '1',
        nom: 'Tontine Familiale',
        nomCourt: 'Familiale',
        tontineTypeId: 'tt1',
        description: 'Tontine pour la famille élargie',
        type: TontineType.MIXTE as any,
        montantCotisation: 50000,
        periodicite: 'MENSUELLE',
        statut: StatutTontine.ACTIVE,
        dateCreation: new Date().toISOString(),
        creeLe: new Date(),
        createdBy: '1'
      },
      {
        id: '2',
        nom: 'Tontine des Amis',
        nomCourt: 'Amis',
        tontineTypeId: 'tt2',
        description: 'Entre amis du quartier',
        type: TontineType.INVESTISSEMENT as any,
        montantCotisation: 100000,
        periodicite: 'MENSUELLE',
        statut: StatutTontine.ACTIVE,
        dateCreation: new Date().toISOString(),
        creeLe: new Date(),
        createdBy: '1'
      },
      {
        id: '3',
        nom: 'Tontine Entreprise',
        nomCourt: 'Entreprise',
        tontineTypeId: 'tt3',
        description: 'Pour les collègues',
        type: TontineType.SOLIDARITE as any,
        montantCotisation: 25000,
        periodicite: 'BI_MENSUELLE',
        statut: StatutTontine.EN_PREPARATION,
        dateCreation: new Date().toISOString(),
        creeLe: new Date(),
        createdBy: '1'
      }
    ];
  }
}
