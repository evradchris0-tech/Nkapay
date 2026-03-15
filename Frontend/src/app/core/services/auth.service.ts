import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, BehaviorSubject } from 'rxjs';
import { ApiService } from './api.service';
import { StorageService } from './storage.service';
import {
  LoginRequest,
  LoginResponse,
  AuthUser,
  AuthState,
  ChangePasswordRequest
} from '../models';
import { ApiResponse } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly storage = inject(StorageService);
  private readonly router = inject(Router);

  // Reactive state with signals
  private readonly _authState = signal<AuthState>({
    isAuthenticated: false,
    user: null,
    accessToken: null,
    refreshToken: null,
    loading: false,
    error: null
  });

  // Public computed signals
  readonly isAuthenticated = computed(() => this._authState().isAuthenticated);
  readonly currentUser = computed(() => this._authState().user);
  readonly isLoading = computed(() => this._authState().loading);
  readonly error = computed(() => this._authState().error);
  readonly isSuperAdmin = computed(() => this._authState().user?.estSuperAdmin ?? false);

  constructor() {
    this.initializeAuth();
  }

  /**
   * Initialize auth state from storage
   */
  private initializeAuth(): void {
    const accessToken = this.storage.getAccessToken();
    const refreshToken = this.storage.getRefreshToken();
    const user = this.storage.getUser();

    if (accessToken && user) {
      this._authState.set({
        isAuthenticated: true,
        user,
        accessToken,
        refreshToken,
        loading: false,
        error: null
      });
    }
  }

  /**
   * Login
   */
  login(credentials: LoginRequest): Observable<ApiResponse<LoginResponse>> {
    this._authState.update(state => ({ ...state, loading: true, error: null }));

    return this.api.post<ApiResponse<LoginResponse>>('/auth/login', credentials).pipe(
      tap(response => {
        if (response.success && response.data) {
          const { accessToken, refreshToken, utilisateur } = response.data;
          
          this.storage.setAccessToken(accessToken);
          this.storage.setRefreshToken(refreshToken);
          this.storage.setUser(utilisateur);

          this._authState.set({
            isAuthenticated: true,
            user: utilisateur,
            accessToken,
            refreshToken,
            loading: false,
            error: null
          });
        }
      }),
      catchError(error => {
        this._authState.update(state => ({
          ...state,
          loading: false,
          error: error.error?.message || 'Erreur de connexion'
        }));
        return throwError(() => error);
      })
    );
  }

  /**
   * Logout
   */
  logout(): void {
    this.api.post('/auth/logout', {}).subscribe({
      complete: () => this.clearAuth()
    });
  }

  /**
   * Clear auth state and storage
   */
  private clearAuth(): void {
    this.storage.clearAuth();
    this._authState.set({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      refreshToken: null,
      loading: false,
      error: null
    });
    this.router.navigate(['/auth/login']);
  }

  /**
   * Refresh token
   */
  refreshToken(): Observable<ApiResponse<LoginResponse>> {
    const refreshToken = this.storage.getRefreshToken();
    
    return this.api.post<ApiResponse<LoginResponse>>('/auth/refresh', { refreshToken }).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.storage.setAccessToken(response.data.accessToken);
          this.storage.setRefreshToken(response.data.refreshToken);
          
          this._authState.update(state => ({
            ...state,
            accessToken: response.data!.accessToken,
            refreshToken: response.data!.refreshToken
          }));
        }
      }),
      catchError(error => {
        this.clearAuth();
        return throwError(() => error);
      })
    );
  }

  /**
   * Change password
   */
  changePassword(request: ChangePasswordRequest): Observable<ApiResponse<void>> {
    return this.api.post<ApiResponse<void>>('/auth/change-password', request).pipe(
      tap(response => {
        if (response.success) {
          const currentUser = this._authState().user;
          if (currentUser) {
            const updatedUser = { ...currentUser, doitChangerMotDePasse: false };
            this.storage.setUser(updatedUser);
            this._authState.update(state => ({ ...state, user: updatedUser }));
          }
        }
      })
    );
  }

  /**
   * Get access token
   */
  getAccessToken(): string | null {
    return this._authState().accessToken;
  }

  /**
   * Check if user needs to change password
   */
  mustChangePassword(): boolean {
    return this._authState().user?.doitChangerMotDePasse ?? false;
  }
}
