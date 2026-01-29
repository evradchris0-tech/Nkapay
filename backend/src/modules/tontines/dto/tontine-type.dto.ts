/** 
 * DTOs pour TontineType 
 */ 
 
export interface CreateTontineTypeDto { 
  code: string; 
  libelle: string; 
  description?: string; 
} 
 
export interface UpdateTontineTypeDto { 
  libelle?: string; 
  description?: string; 
  estActif?: boolean; 
} 
 
export interface TontineTypeResponseDto { 
  id: string; 
  code: string; 
  libelle: string; 
  description: string | null; 
  estActif: boolean; 
  creeLe: Date; 
}
