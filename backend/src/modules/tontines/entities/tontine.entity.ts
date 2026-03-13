/**
 * Entite Tontine
 * Represente une association de tontine
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { TontineType } from './tontine-type.entity';
import { AdhesionTontine } from './adhesion-tontine.entity';
import { Exercice } from '../../exercices/entities/exercice.entity';
import { RegleTontine } from './regle-tontine.entity';
import { Organisation } from '../../organisations/entities/organisation.entity';

export enum StatutTontine {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDUE = 'SUSPENDUE',
}

@Entity('tontine')
export class Tontine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  nom: string;

  @Column({ name: 'nom_court', type: 'varchar', length: 50, unique: true })
  nomCourt: string;

  @Column({ name: 'annee_fondation', type: 'smallint', nullable: true })
  anneeFondation: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  motto: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  logo: string | null;

  @Column({ name: 'est_officiellement_declaree', type: 'boolean', default: false })
  estOfficiellementDeclaree: boolean;

  @Column({ name: 'numero_enregistrement', type: 'varchar', length: 100, nullable: true })
  numeroEnregistrement: string | null;

  @Index()
  @Column({ type: 'enum', enum: StatutTontine, default: StatutTontine.ACTIVE })
  statut: StatutTontine;

  @Column({ name: 'tontine_type_id', type: 'uuid' })
  tontineTypeId: string;

  @ManyToOne(() => TontineType, (type) => type.tontines)
  @JoinColumn({ name: 'tontine_type_id' })
  tontineType: TontineType;

  @Index()
  @Column({ name: 'organisation_id', type: 'uuid', nullable: true })
  organisationId: string | null;

  @ManyToOne(() => Organisation)
  @JoinColumn({ name: 'organisation_id' })
  organisation: Organisation | null;

  @Column({ name: 'document_statuts', type: 'varchar', length: 500, nullable: true })
  documentStatuts: string | null;

  @CreateDateColumn({ name: 'cree_le', type: 'timestamp' })
  creeLe: Date;

  @UpdateDateColumn({ name: 'modifie_le', type: 'timestamp', nullable: true })
  modifieLe: Date | null;

  @DeleteDateColumn({ name: 'supprime_le', type: 'timestamp', nullable: true })
  supprimeLe: Date | null;

  @OneToMany(() => AdhesionTontine, (adhesion) => adhesion.tontine)
  adhesions: AdhesionTontine[];

  @OneToMany(() => Exercice, (exercice) => exercice.tontine)
  exercices: Exercice[];

  @OneToMany(() => RegleTontine, (regle) => regle.tontine)
  regles: RegleTontine[];
}
