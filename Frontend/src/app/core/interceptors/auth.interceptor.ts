import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { StorageService } from '../services/storage.service';

let isRefreshing = false;

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const storage = inject(StorageService);
  const authService = inject(AuthService);

  // Skip auth header for login and refresh endpoints
  if (req.url.includes('/auth/login') || req.url.includes('/auth/refresh')) {
    return next(req);
  }

  const token = storage.getAccessToken();

  if (token) {
    req = addAuthHeader(req, token);
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/auth/')) {
        return handleUnauthorized(req, next, authService);
      }
      return throwError(() => error);
    })
  );
};

function addAuthHeader(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
}

function handleUnauthorized(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService
) {
  if (!isRefreshing) {
    isRefreshing = true;

    return authService.refreshToken().pipe(
      switchMap(response => {
        isRefreshing = false;
        if (response.success && response.data) {
          const newReq = addAuthHeader(req, response.data.accessToken);
          return next(newReq);
        }
        return throwError(() => new Error('Token refresh failed'));
      }),
      catchError(error => {
        isRefreshing = false;
        authService.logout();
        return throwError(() => error);
      })
    );
  }

  return throwError(() => new Error('Token refresh in progress'));
}
