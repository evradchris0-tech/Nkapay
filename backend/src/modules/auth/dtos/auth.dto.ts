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
 * Payload du JWT
 */
export interface JwtPayload {
  sub: string; // utilisateurId
  type: 'access' | 'refresh';
  iat: number;
  exp: number;
}
