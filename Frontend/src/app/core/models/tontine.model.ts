/**
 * Tontine Models
 */

export interface Tontine {
  id: string;
  nom: string;
  nomCourt: string;
  anneeFondation?: number;
  motto?: string;
  logo?: string;
  numeroEnregistrement?: string;
  documentStatuts?: string;
  statut: StatutTontine;
  tontineTypeId: string;
  tontineType?: TontineType;
  creeLe: Date;
  modifieLe?: Date;
  nombreMembres?: number;
  exerciceActif?: string;
  // additional frontend fields used by components
  type?: string;
  description?: string;
  montantCotisation?: number;
  periodicite?: string;
  dateCreation?: string;
  createdBy?: string | number;
}

export interface TontineType {
  id: string;
  code: string;
  libelle: string;
  description?: string;
  estActif: boolean;
}

export enum StatutTontine {
  ACTIVE = 'ACTIVE',
  SUSPENDUE = 'SUSPENDUE',
  DISSOUTE = 'DISSOUTE',
  EN_PREPARATION = 'EN_PREPARATION',
  TERMINEE = 'TERMINEE',
}

export interface CreateTontineDto {
  nom: string;
  nomCourt: string;
  anneeFondation?: number;
  motto?: string;
  tontineTypeId: string;
}

export interface UpdateTontineDto {
  nom?: string;
  nomCourt?: string;
  anneeFondation?: number;
  motto?: string;
  logo?: string;
  numeroEnregistrement?: string;
  documentStatuts?: string;
}

export interface RegleTontine {
  id: string;
  tontineId: string;
  ruleDefinitionId: string;
  ruleDefinition?: RuleDefinition;
  valeur: string;
  creeLe: Date;
  modifieLe?: Date;
}

export interface RuleDefinition {
  id: string;
  cle: string;
  libelle: string;
  description?: string;
  typeValeur: TypeValeurRegle;
  valeurDefaut?: string;
  valeurMin?: string;
  valeurMax?: string;
  unite?: string;
  categorie: CategorieRegle;
  estModifiableParTontine: boolean;
  estModifiableParExercice: boolean;
  ordreAffichage: number;
}

export enum TypeValeurRegle {
  ENTIER = 'ENTIER',
  DECIMAL = 'DECIMAL',
  BOOLEAN = 'BOOLEAN',
  TEXTE = 'TEXTE',
  DATE = 'DATE',
  ENUM = 'ENUM',
}

export enum CategorieRegle {
  COTISATION = 'COTISATION',
  EPARGNE = 'EPARGNE',
  PRET = 'PRET',
  PENALITE = 'PENALITE',
  DISTRIBUTION = 'DISTRIBUTION',
  SECOURS = 'SECOURS',
  REUNION = 'REUNION',
  AUTRE = 'AUTRE',
}

// Runtime values used by components
export const TontineType = {
  MIXTE: 'MIXTE',
  INVESTISSEMENT: 'INVESTISSEMENT',
  SOLIDARITE: 'SOLIDARITE',
} as const;

export const TontineTypeLabels: Record<string, string> = {
  [TontineType.MIXTE]: 'Mixte',
  [TontineType.INVESTISSEMENT]: 'Investissement',
  [TontineType.SOLIDARITE]: 'Solidarité',
};

export const Periodicite = {
  MENSUELLE: 'MENSUELLE',
  BI_MENSUELLE: 'BI_MENSUELLE',
  ANNUELLE: 'ANNUELLE',
} as const;

export const PeriodiciteLabels: Record<string, string> = {
  [Periodicite.MENSUELLE]: 'Mensuelle',
  [Periodicite.BI_MENSUELLE]: 'Bi-mensuelle',
  [Periodicite.ANNUELLE]: 'Annuelle',
};

export interface TontineStats {
  totalTontines: number;
  totalMembers: number;
  totalCotisations: number;
}
