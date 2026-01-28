/**
 * Entite BilanSecoursExercice
 * Bilan financier du fonds de secours pour un exercice
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Exercice } from '../../exercices/entities/exercice.entity';

@Entity('bilan_secours_exercice')
export class BilanSecoursExercice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'exercice_id', type: 'uuid', unique: true })
  exerciceId: string;

  @OneToOne(() => Exercice, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'exercice_id' })
  exercice: Exercice;

  @Column({ name: 'solde_initial', type: 'decimal', precision: 15, scale: 2, default: 0 })
  soldeInitial: number;

  @Column({ name: 'total_cotisations', type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalCotisations: number;

  @Column({ name: 'total_depenses', type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalDepenses: number;

  @Column({ name: 'solde_final', type: 'decimal', precision: 15, scale: 2, default: 0 })
  soldeFinal: number;

  @Column({ name: 'nombre_evenements', type: 'int', default: 0 })
  nombreEvenements: number;

  @CreateDateColumn({ name: 'cree_le', type: 'timestamp' })
  creeLe: Date;

  @UpdateDateColumn({ name: 'modifie_le', type: 'timestamp', nullable: true })
  modifieLe: Date | null;
}
