/**
 * DTO pour la creation d'un utilisateur
 */
export interface CreateUtilisateurDto {
  prenom: string;
  nom: string;
  telephone1: string;
  telephone2?: string;
  adresseResidence?: string;
  nomContactUrgence?: string;
  telContactUrgence?: string;
  numeroMobileMoney?: string;
  numeroOrangeMoney?: string;
  password: string;
  languePrefereeId?: string;
}

/**
 * DTO pour la mise a jour d'un utilisateur
 */
export interface UpdateUtilisateurDto {
  prenom?: string;
  nom?: string;
  telephone2?: string;
  adresseResidence?: string;
  nomContactUrgence?: string;
  telContactUrgence?: string;
  numeroMobileMoney?: string;
  numeroOrangeMoney?: string;
  languePrefereeId?: string;
}

/**
 * DTO pour le changement de mot de passe
 */
export interface ChangePasswordDto {
  ancienMotDePasse: string;
  nouveauMotDePasse: string;
  confirmationMotDePasse: string;
}

/**
 * DTO pour la reponse utilisateur (sans donnees sensibles)
 */
export interface UtilisateurResponseDto {
  id: string;
  prenom: string;
  nom: string;
  nomComplet: string;
  telephone1: string;
  telephone2: string | null;
  adresseResidence: string | null;
  nomContactUrgence: string | null;
  telContactUrgence: string | null;
  numeroMobileMoney: string | null;
  numeroOrangeMoney: string | null;
  dateInscription: Date;
  doitChangerMotDePasse: boolean;
  estSuperAdmin: boolean;
  languePrefereeId: string | null;
  creeLe: Date;
  modifieLe: Date | null;
}
