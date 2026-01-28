/**
 * Entite PotDuMensuel
 * Pot mensuel du par un membre pour une reunion
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
import { Reunion } from '../../reunions/entities/reunion.entity';
import { ExerciceMembre } from '../../exercices/entities/exercice-membre.entity';
import { StatutDu } from './inscription-due-exercice.entity';

@Entity('pot_du_mensuel')
@Unique(['reunionId', 'exerciceMembreId'])
export class PotDuMensuel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'reunion_id', type: 'uuid' })
  reunionId: string;

  @ManyToOne(() => Reunion, (reunion) => reunion.potsDus, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reunion_id' })
  reunion: Reunion;

  @Column({ name: 'exercice_membre_id', type: 'uuid' })
  exerciceMembreId: string;

  @ManyToOne(() => ExerciceMembre, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'exercice_membre_id' })
  exerciceMembre: ExerciceMembre;

  @Column({ name: 'montant_du', type: 'decimal', precision: 15, scale: 2 })
  montantDu: number;

  @Column({ name: 'montant_paye', type: 'decimal', precision: 15, scale: 2, default: 0 })
  montantPaye: number;

  @Column({ name: 'solde_restant', type: 'decimal', precision: 15, scale: 2 })
  soldeRestant: number;

  @Column({ type: 'enum', enum: StatutDu, default: StatutDu.A_JOUR })
  statut: StatutDu;

  @CreateDateColumn({ name: 'cree_le', type: 'timestamp' })
  creeLe: Date;

  @UpdateDateColumn({ name: 'modifie_le', type: 'timestamp', nullable: true })
  modifieLe: Date | null;
}
