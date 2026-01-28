/**
 * Entite InscriptionDueExercice
 * Frais d'inscription d'un membre pour un exercice
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
import { ExerciceMembre } from '../../exercices/entities/exercice-membre.entity';

export enum StatutDu {
  A_JOUR = 'A_JOUR',
  EN_RETARD = 'EN_RETARD',
  SURPAYE = 'SURPAYE',
}

@Entity('inscription_due_exercice')
export class InscriptionDueExercice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'exercice_membre_id', type: 'uuid', unique: true })
  exerciceMembreId: string;

  @OneToOne(() => ExerciceMembre, (em) => em.inscriptionDue, { onDelete: 'CASCADE' })
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

  @Column({ name: 'date_limite', type: 'date', nullable: true })
  dateLimite: Date | null;

  @CreateDateColumn({ name: 'cree_le', type: 'timestamp' })
  creeLe: Date;

  @UpdateDateColumn({ name: 'modifie_le', type: 'timestamp', nullable: true })
  modifieLe: Date | null;
}
