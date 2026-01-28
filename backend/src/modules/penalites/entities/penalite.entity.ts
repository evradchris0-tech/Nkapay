/**
 * Entite Penalite
 * Penalites appliquees aux membres
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
import { Reunion } from '../../reunions/entities/reunion.entity';
import { TypePenalite } from './type-penalite.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';

export enum StatutPenalite {
  EN_ATTENTE = 'EN_ATTENTE',
  PAYEE = 'PAYEE',
  ANNULEE = 'ANNULEE',
  PARDONNEE = 'PARDONNEE',
}

@Entity('penalite')
export class Penalite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'exercice_membre_id', type: 'uuid' })
  exerciceMembreId: string;

  @ManyToOne(() => ExerciceMembre, (em) => em.penalites, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'exercice_membre_id' })
  exerciceMembre: ExerciceMembre;

  @Column({ name: 'reunion_id', type: 'uuid', nullable: true })
  reunionId: string | null;

  @ManyToOne(() => Reunion)
  @JoinColumn({ name: 'reunion_id' })
  reunion: Reunion | null;

  @Index()
  @Column({ name: 'type_penalite_id', type: 'uuid' })
  typePenaliteId: string;

  @ManyToOne(() => TypePenalite, (tp) => tp.penalites)
  @JoinColumn({ name: 'type_penalite_id' })
  typePenalite: TypePenalite;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  montant: number;

  @Column({ type: 'text', nullable: true })
  motif: string | null;

  @Index()
  @Column({ type: 'enum', enum: StatutPenalite, default: StatutPenalite.EN_ATTENTE })
  statut: StatutPenalite;

  @CreateDateColumn({ name: 'date_application', type: 'timestamp' })
  dateApplication: Date;

  @Column({ name: 'applique_par_exercice_membre_id', type: 'uuid', nullable: true })
  appliqueParExerciceMembreId: string | null;

  @ManyToOne(() => ExerciceMembre)
  @JoinColumn({ name: 'applique_par_exercice_membre_id' })
  appliqueParExerciceMembre: ExerciceMembre | null;

  @Column({ name: 'transaction_id', type: 'uuid', nullable: true })
  transactionId: string | null;

  @ManyToOne(() => Transaction)
  @JoinColumn({ name: 'transaction_id' })
  transaction: Transaction | null;

  @Column({ name: 'date_paiement', type: 'timestamp', nullable: true })
  datePaiement: Date | null;

  @Column({ name: 'date_annulation', type: 'timestamp', nullable: true })
  dateAnnulation: Date | null;

  @Column({ name: 'motif_annulation', type: 'text', nullable: true })
  motifAnnulation: string | null;
}
