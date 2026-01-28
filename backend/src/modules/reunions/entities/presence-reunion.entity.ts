/**
 * Entite PresenceReunion
 * Enregistrement de la presence d'un membre a une reunion
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Reunion } from './reunion.entity';
import { ExerciceMembre } from '../../exercices/entities/exercice-membre.entity';

@Entity('presence_reunion')
@Unique(['reunionId', 'exerciceMembreId'])
export class PresenceReunion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'reunion_id', type: 'uuid' })
  reunionId: string;

  @ManyToOne(() => Reunion, (reunion) => reunion.presences, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reunion_id' })
  reunion: Reunion;

  @Column({ name: 'exercice_membre_id', type: 'uuid' })
  exerciceMembreId: string;

  @ManyToOne(() => ExerciceMembre, (em) => em.presences, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'exercice_membre_id' })
  exerciceMembre: ExerciceMembre;

  @Column({ name: 'est_present', type: 'boolean', default: false })
  estPresent: boolean;

  @Column({ name: 'est_en_retard', type: 'boolean', default: false })
  estEnRetard: boolean;

  @Column({ name: 'heure_arrivee', type: 'time', nullable: true })
  heureArrivee: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  note: string | null;

  @CreateDateColumn({ name: 'cree_le', type: 'timestamp' })
  creeLe: Date;

  @UpdateDateColumn({ name: 'modifie_le', type: 'timestamp', nullable: true })
  modifieLe: Date | null;
}
