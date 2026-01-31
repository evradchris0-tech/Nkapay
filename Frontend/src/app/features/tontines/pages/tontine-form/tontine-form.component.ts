import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TontineService } from '../../services/tontine.service';
import { TontineType, TontineTypeLabels, Periodicite, PeriodiciteLabels } from '../../../../core/models/tontine.model';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-tontine-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './tontine-form.component.html',
  styleUrl: './tontine-form.component.scss'
})
export class TontineFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private tontineService = inject(TontineService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private notification = inject(NotificationService);

  tontineForm!: FormGroup;
  isLoading = signal(false);
  isEditMode = signal(false);
  tontineId: string | null = null;

  tontineTypes = Object.values(TontineType);
  typeLabels = TontineTypeLabels;
  periodicites = Object.values(Periodicite);
  periodiciteLabels = PeriodiciteLabels;

  ngOnInit() {
    this.initForm();
    
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.tontineId = id;
      this.isEditMode.set(true);
      this.loadTontine(this.tontineId);
    }
  }

  private initForm() {
    this.tontineForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]],
      type: [TontineType.MIXTE, Validators.required],
      montantCotisation: [50000, [Validators.required, Validators.min(1000)]],
      periodicite: [Periodicite.MENSUELLE, Validators.required]
    });
  }

  private loadTontine(id: string | null) {
    this.isLoading.set(true);
    if (!id) return;
    this.tontineService.getById(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.tontineForm.patchValue(response.data);
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

  onSubmit() {
    if (this.tontineForm.invalid) {
      this.tontineForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const data = this.tontineForm.value;

    const request = this.isEditMode()
      ? this.tontineService.update(this.tontineId!, data)
      : this.tontineService.create(data);

    request.subscribe({
      next: (response) => {
        this.isLoading.set(false);
        if (response.success) {
          this.notification.success('Succès', 
            this.isEditMode() ? 'Tontine modifiée' : 'Tontine créée');
          this.router.navigate(['/dashboard/tontines']);
        } else {
          this.notification.error('Erreur', response.message || 'Opération échouée');
        }
      },
      error: (error) => {
        this.isLoading.set(false);
        this.notification.error('Erreur', error.error?.message || 'Opération échouée');
      }
    });
  }

  get f() {
    return this.tontineForm.controls;
  }
}
