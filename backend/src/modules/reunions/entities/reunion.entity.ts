/**
 * Entite Reunion
 * Session mensuelle de la tontine
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
import { Exercice } from '../../exercices/entities/exercice.entity';
import { ExerciceMembre } from '../../exercices/entities/exercice-membre.entity';
import { PresenceReunion } from './presence-reunion.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { CotisationDueMensuelle } from '../../transactions/entities/cotisation-due-mensuelle.entity';
import { PotDuMensuel } from '../../transactions/entities/pot-du-mensuel.entity';

export enum StatutReunion {
  PLANIFIEE = 'PLANIFIEE',
  OUVERTE = 'OUVERTE',
  CLOTUREE = 'CLOTUREE',
  ANNULEE = 'ANNULEE',
}

@Entity('reunion')
@Unique(['exerciceId', 'numeroReunion'])
export class Reunion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'exercice_id', type: 'uuid' })
  exerciceId: string;

  @ManyToOne(() => Exercice, (exercice) => exercice.reunions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'exercice_id' })
  exercice: Exercice;

  @Column({ name: 'numero_reunion', type: 'smallint' })
  numeroReunion: number;

  @Index()
  @Column({ name: 'date_reunion', type: 'date' })
  dateReunion: Date;

  @Column({ name: 'heure_debut', type: 'time', nullable: true })
  heureDebut: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  lieu: string | null;

  @Column({ name: 'hote_exercice_membre_id', type: 'uuid', nullable: true })
  hoteExerciceMembreId: string | null;

  @ManyToOne(() => ExerciceMembre)
  @JoinColumn({ name: 'hote_exercice_membre_id' })
  hote: ExerciceMembre | null;

  @Column({ type: 'enum', enum: StatutReunion, default: StatutReunion.PLANIFIEE })
  statut: StatutReunion;

  @Column({ name: 'ouverte_le', type: 'timestamp', nullable: true })
  ouverteLe: Date | null;

  @Column({ name: 'cloturee_le', type: 'timestamp', nullable: true })
  clotureeLe: Date | null;

  @Column({ name: 'cloturee_par_exercice_membre_id', type: 'uuid', nullable: true })
  clotureeParExerciceMembreId: string | null;

  @ManyToOne(() => ExerciceMembre)
  @JoinColumn({ name: 'cloturee_par_exercice_membre_id' })
  clotureePar: ExerciceMembre | null;

  @CreateDateColumn({ name: 'cree_le', type: 'timestamp' })
  creeLe: Date;

  @UpdateDateColumn({ name: 'modifie_le', type: 'timestamp', nullable: true })
  modifieLe: Date | null;

  @OneToMany(() => PresenceReunion, (presence) => presence.reunion)
  presences: PresenceReunion[];

  @OneToMany(() => Transaction, (tx) => tx.reunion)
  transactions: Transaction[];

  @OneToMany(() => CotisationDueMensuelle, (cotisation) => cotisation.reunion)
  cotisationsDues: CotisationDueMensuelle[];

  @OneToMany(() => PotDuMensuel, (pot) => pot.reunion)
  potsDus: PotDuMensuel[];
}
