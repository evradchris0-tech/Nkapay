/**
 * Entite RuleDefinition
 * Catalogue global des regles parametrables
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { RegleTontine } from './regle-tontine.entity';
import { RegleExercice } from '../../exercices/entities/regle-exercice.entity';

export enum TypeValeurRegle {
  MONTANT = 'MONTANT',
  POURCENTAGE = 'POURCENTAGE',
  ENTIER = 'ENTIER',
  BOOLEEN = 'BOOLEEN',
  TEXTE = 'TEXTE',
}

export enum CategorieRegle {
  GLOBAL = 'GLOBAL',
  COTISATION = 'COTISATION',
  POT = 'POT',
  SECOURS = 'SECOURS',
  PRET = 'PRET',
  EPARGNE = 'EPARGNE',
  INSCRIPTION = 'INSCRIPTION',
  PENALITE = 'PENALITE',
  SECURITE = 'SECURITE',
}

@Entity('rule_definition')
export class RuleDefinition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  cle: string;

  @Column({ type: 'varchar', length: 200 })
  libelle: string;

  @Column({ name: 'type_valeur', type: 'enum', enum: TypeValeurRegle })
  typeValeur: TypeValeurRegle;

  @Column({ name: 'valeur_defaut', type: 'varchar', length: 255, nullable: true })
  valeurDefaut: string | null;

  @Column({ name: 'valeur_min', type: 'varchar', length: 100, nullable: true })
  valeurMin: string | null;

  @Column({ name: 'valeur_max', type: 'varchar', length: 100, nullable: true })
  valeurMax: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  unite: string | null;

  @Column({ name: 'est_obligatoire', type: 'boolean', default: true })
  estObligatoire: boolean;

  @Column({ name: 'est_modifiable_par_tontine', type: 'boolean', default: true })
  estModifiableParTontine: boolean;

  @Column({ name: 'est_modifiable_par_exercice', type: 'boolean', default: true })
  estModifiableParExercice: boolean;

  @Column({ name: 'est_modifiable_par_organisation', type: 'boolean', default: true })
  estModifiableParOrganisation: boolean;

  @Index()
  @Column({ type: 'enum', enum: CategorieRegle })
  categorie: CategorieRegle;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'ordre_affichage', type: 'smallint', default: 0 })
  ordreAffichage: number;

  @CreateDateColumn({ name: 'cree_le', type: 'timestamp' })
  creeLe: Date;

  @OneToMany(() => RegleTontine, (rt) => rt.ruleDefinition)
  reglesTontine: RegleTontine[];

  @OneToMany(() => RegleExercice, (re) => re.ruleDefinition)
  reglesExercice: RegleExercice[];
}
