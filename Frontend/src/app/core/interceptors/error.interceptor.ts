import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';
import { Router } from '@angular/router';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notification = inject(NotificationService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'Une erreur est survenue';

      switch (error.status) {
        case 0:
          errorMessage = 'Impossible de contacter le serveur. Vérifiez votre connexion.';
          break;
        case 400:
          errorMessage = error.error?.message || 'Requête invalide';
          break;
        case 401:
          // Handled by auth interceptor
          break;
        case 403:
          errorMessage = 'Accès non autorisé';
          router.navigate(['/dashboard']);
          break;
        case 404:
          errorMessage = error.error?.message || 'Ressource non trouvée';
          break;
        case 409:
          errorMessage = error.error?.message || 'Conflit de données';
          break;
        case 422:
          errorMessage = error.error?.message || 'Données invalides';
          if (error.error?.errors) {
            const validationErrors = error.error.errors
              .map((e: { message: string }) => e.message)
              .join(', ');
            errorMessage = validationErrors;
          }
          break;
        case 500:
          errorMessage = 'Erreur interne du serveur';
          break;
        case 503:
          errorMessage = 'Service temporairement indisponible';
          break;
        default:
          errorMessage = error.error?.message || `Erreur ${error.status}`;
      }

      // Don't show notification for 401 (handled by auth)
      if (error.status !== 401) {
        notification.error('Erreur', errorMessage);
      }

      return throwError(() => error);
    })
  );
};
