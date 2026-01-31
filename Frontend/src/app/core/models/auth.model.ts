/**
 * Auth Models
 */

// Login request payload
export interface LoginRequest {
  telephone: string;
  motDePasse: string;
}

// Login response from backend
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  utilisateur: AuthUser;
}

// Utilisateur authentifié
export interface AuthUser {
  id: string;
  prenom: string;
  nom: string;
  telephone1: string;
  estSuperAdmin: boolean;
  doitChangerMotDePasse: boolean;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ChangePasswordRequest {
  ancienMotDePasse: string;
  nouveauMotDePasse: string;
}

// État d'authentification global (frontend)
export interface AuthState {
  isAuthenticated: boolean;
  // compatibility: some code expects `utilisateur`, others `user`
  utilisateur?: AuthUser | null;
  user?: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
}
