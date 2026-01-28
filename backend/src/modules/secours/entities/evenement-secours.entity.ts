/**
 * Entite EvenementSecours
 * Evenements declencheurs de secours (deces, maladie, etc.)
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ExerciceMembre } from '../../exercices/entities/exercice-membre.entity';
import { TypeEvenementSecours } from './type-evenement-secours.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';

export enum StatutEvenementSecours {
  DECLARE = 'DECLARE',
  EN_COURS_VALIDATION = 'EN_COURS_VALIDATION',
  VALIDE = 'VALIDE',
  REFUSE = 'REFUSE',
  PAYE = 'PAYE',
}

@Entity('evenement_secours')
export class EvenementSecours {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'exercice_membre_id', type: 'uuid' })
  exerciceMembreId: string;

  @ManyToOne(() => ExerciceMembre, (em) => em.evenementsSecours, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'exercice_membre_id' })
  exerciceMembre: ExerciceMembre;

  @Index()
  @Column({ name: 'type_evenement_secours_id', type: 'uuid' })
  typeEvenementSecoursId: string;

  @ManyToOne(() => TypeEvenementSecours, (te) => te.evenements)
  @JoinColumn({ name: 'type_evenement_secours_id' })
  typeEvenementSecours: TypeEvenementSecours;

  @Column({ name: 'date_evenement', type: 'date' })
  dateEvenement: Date;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'montant_demande', type: 'decimal', precision: 15, scale: 2, nullable: true })
  montantDemande: number | null;

  @Column({ name: 'montant_approuve', type: 'decimal', precision: 15, scale: 2, nullable: true })
  montantApprouve: number | null;

  @Index()
  @Column({ type: 'enum', enum: StatutEvenementSecours, default: StatutEvenementSecours.DECLARE })
  statut: StatutEvenementSecours;

  @CreateDateColumn({ name: 'date_declaration', type: 'timestamp' })
  dateDeclaration: Date;

  @Column({ name: 'date_validation', type: 'date', nullable: true })
  dateValidation: Date | null;

  @Column({ name: 'valide_par_exercice_membre_id', type: 'uuid', nullable: true })
  valideParExerciceMembreId: string | null;

  @ManyToOne(() => ExerciceMembre)
  @JoinColumn({ name: 'valide_par_exercice_membre_id' })
  valideParExerciceMembre: ExerciceMembre | null;

  @Column({ name: 'transaction_id', type: 'uuid', nullable: true })
  transactionId: string | null;

  @ManyToOne(() => Transaction)
  @JoinColumn({ name: 'transaction_id' })
  transaction: Transaction | null;

  @Column({ name: 'motif_refus', type: 'text', nullable: true })
  motifRefus: string | null;
}
