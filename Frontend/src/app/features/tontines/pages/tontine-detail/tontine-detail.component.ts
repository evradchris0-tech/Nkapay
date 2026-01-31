import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TontineService } from '../../services/tontine.service';
import { Tontine, TontineTypeLabels } from '../../../../core/models/tontine.model';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-tontine-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './tontine-detail.component.html',
  styleUrl: './tontine-detail.component.scss'
})
export class TontineDetailComponent implements OnInit {
  private tontineService = inject(TontineService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private notification = inject(NotificationService);

  tontine = signal<Tontine | null>(null);
  isLoading = signal(true);
  activeTab = signal<'overview' | 'membres' | 'exercices' | 'regles'>('overview');
  
  typeLabels = TontineTypeLabels;

  getTypeLabel(t: Tontine | null): string {
    if (!t) return '';
    return this.typeLabels[t.type ?? ''] ?? '';
  }

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
      case 'EN_PREPARATION': return 'En préparation';
      case 'TERMINEE': return 'Terminée';
      case 'SUSPENDUE': return 'Suspendue';
      default: return statut;
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
}
