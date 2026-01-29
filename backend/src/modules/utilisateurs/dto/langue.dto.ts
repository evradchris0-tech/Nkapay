/**
 * DTOs pour Langue
 */

export interface CreateLangueDto {
  code: string;
  nom: string;
  estDefaut?: boolean;
}

export interface UpdateLangueDto {
  nom?: string;
  estDefaut?: boolean;
}

export interface LangueResponseDto {
  id: string;
  code: string;
  nom: string;
  estDefaut: boolean;
}
