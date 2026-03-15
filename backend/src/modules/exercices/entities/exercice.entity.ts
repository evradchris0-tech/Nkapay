/**
 * Entite Exercice
 * Periode comptable d'une tontine (generalement 12 mois)
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Tontine } from '../../tontines/entities/tontine.entity';
import { ExerciceMembre } from './exercice-membre.entity';
import { Reunion } from '../../reunions/entities/reunion.entity';
import { RegleExercice } from './regle-exercice.entity';

export enum StatutExercice {
  BROUILLON = 'BROUILLON',
  OUVERT = 'OUVERT',
  SUSPENDU = 'SUSPENDU',
  FERME = 'FERME',
}

@Entity('exercice')
@Unique(['tontineId', 'libelle'])
export class Exercice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'tontine_id', type: 'uuid' })
  tontineId: string;

  @ManyToOne(() => Tontine, (tontine) => tontine.exercices, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tontine_id' })
  tontine: Tontine;

  @Column({ type: 'varchar', length: 50 })
  libelle: string;

  @Column({ name: 'annee_debut', type: 'smallint' })
  anneeDebut: number;

  @Column({ name: 'mois_debut', type: 'smallint' })
  moisDebut: number;

  @Column({ name: 'annee_fin', type: 'smallint' })
  anneeFin: number;

  @Column({ name: 'mois_fin', type: 'smallint' })
  moisFin: number;

  @Column({ name: 'duree_mois', type: 'smallint' })
  dureeMois: number;

  @Column({ type: 'enum', enum: StatutExercice, default: StatutExercice.BROUILLON })
  statut: StatutExercice;

  @Column({ name: 'ouvert_le', type: 'timestamp', nullable: true })
  ouvertLe: Date | null;

  @Column({ name: 'ferme_le', type: 'timestamp', nullable: true })
  fermeLe: Date | null;

  @CreateDateColumn({ name: 'cree_le', type: 'timestamp' })
  creeLe: Date;

  @UpdateDateColumn({ name: 'modifie_le', type: 'timestamp', nullable: true })
  modifieLe: Date | null;

  @OneToMany(() => ExerciceMembre, (em) => em.exercice)
  membres: ExerciceMembre[];

  @OneToMany(() => Reunion, (reunion) => reunion.exercice)
  reunions: Reunion[];

  @OneToMany(() => RegleExercice, (regle) => regle.exercice)
  regles: RegleExercice[];
}
