/**
 * DTO pour la connexion
 */
export interface LoginDto {
  identifiant: string; // telephone1
  motDePasse: string;
}

/**
 * DTO pour la reponse de connexion
 */
export interface LoginResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  utilisateur: {
    id: string;
    prenom: string;
    nom: string;
    telephone1: string;
    estSuperAdmin: boolean;
    doitChangerMotDePasse: boolean;
  };
}

/**
 * DTO pour le rafraichissement de token
 */
export interface RefreshTokenDto {
  refreshToken: string;
}

/**
 * DTO pour la deconnexion
 */
export interface LogoutDto {
  sessionId?: string;
  toutesLesSessions?: boolean;
}

/**
 * DTO pour le changement de mot de passe
 */
export interface ChangePasswordDto {
  ancienMotDePasse: string;
  nouveauMotDePasse: string;
}

/**
 * Payload du JWT
 */
export interface JwtPayload {
  sub: string; // utilisateurId
  type: 'access' | 'refresh';
  estSuperAdmin?: boolean;
  iat: number;
  exp: number;
}
