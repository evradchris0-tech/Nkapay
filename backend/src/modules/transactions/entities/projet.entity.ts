/**
 * Entite Projet
 * Projets collectifs de la tontine
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Exercice } from '../../exercices/entities/exercice.entity';
import { ExerciceMembre } from '../../exercices/entities/exercice-membre.entity';

@Entity('projet')
export class Projet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'exercice_id', type: 'uuid' })
  exerciceId: string;

  @ManyToOne(() => Exercice, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'exercice_id' })
  exercice: Exercice;

  @Column({ type: 'varchar', length: 200 })
  nom: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'budget_prevu', type: 'decimal', precision: 15, scale: 2, nullable: true })
  budgetPrevu: number | null;

  @Column({ type: 'varchar', length: 20, default: 'ACTIF' })
  statut: string;

  @Column({ name: 'cree_par_exercice_membre_id', type: 'uuid' })
  creeParExerciceMembreId: string;

  @ManyToOne(() => ExerciceMembre)
  @JoinColumn({ name: 'cree_par_exercice_membre_id' })
  creeParExerciceMembre: ExerciceMembre;

  @CreateDateColumn({ name: 'cree_le', type: 'timestamp' })
  creeLe: Date;

  @Column({ name: 'cloture_le', type: 'timestamp', nullable: true })
  clotureLe: Date | null;

  @DeleteDateColumn({ name: 'supprime_le', type: 'timestamp', nullable: true })
  supprimeLe: Date | null;
}
