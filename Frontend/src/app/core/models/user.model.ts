/**
 * User Model
 */

// Modèle utilisateur aligné backend
export interface Utilisateur {
  id: string;
  prenom: string;
  nom: string;
  telephone1: string;
  telephone2?: string;
  adresseResidence?: string;
  nomContactUrgence?: string;
  telContactUrgence?: string;
  numeroMobileMoney?: string;
  numeroOrangeMoney?: string;
  dateInscription: Date;
  estSuperAdmin: boolean;
  doitChangerMotDePasse: boolean;
  creeLe: Date;
  modifieLe?: Date;
}

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
  motDePasse: string;
}

export interface UpdateUtilisateurDto {
  prenom?: string;
  nom?: string;
  telephone2?: string;
  adresseResidence?: string;
  nomContactUrgence?: string;
  telContactUrgence?: string;
  numeroMobileMoney?: string;
  numeroOrangeMoney?: string;
}
