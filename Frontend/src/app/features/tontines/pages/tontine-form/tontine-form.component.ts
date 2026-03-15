import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TontineService, TontineTypeBackend } from '../../services/tontine.service';
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

  tontineTypes = signal<TontineTypeBackend[]>([]);

  ngOnInit() {
    this.initForm();
    this.loadTontineTypes();
    
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.tontineId = id;
      this.isEditMode.set(true);
      this.loadTontine(this.tontineId);
    }
  }

  private initForm() {
    this.tontineForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
      nomCourt: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      tontineTypeId: ['', Validators.required],
      anneeFondation: [new Date().getFullYear()],
      motto: ['', Validators.maxLength(255)]
    });
  }

  private loadTontineTypes() {
    this.tontineService.getTontineTypes().subscribe({
      next: (response) => {
        if (response.data) {
          this.tontineTypes.set(response.data.filter(t => t.estActif));
        }
      },
      error: () => {
        this.notification.error('Erreur', 'Impossible de charger les types de tontine');
      }
    });
  }

  private loadTontine(id: string | null) {
    this.isLoading.set(true);
    if (!id) return;
    this.tontineService.getById(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.tontineForm.patchValue({
            nom: response.data.nom,
            nomCourt: response.data.nomCourt,
            tontineTypeId: response.data.tontineTypeId,
            anneeFondation: response.data.anneeFondation,
            motto: response.data.motto
          });
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
    const formValue = this.tontineForm.value;
    
    const data = {
      nom: formValue.nom,
      nomCourt: formValue.nomCourt,
      tontineTypeId: formValue.tontineTypeId,
      anneeFondation: formValue.anneeFondation || undefined,
      motto: formValue.motto || undefined
    };

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
