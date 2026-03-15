/**
 * Entite RemboursementPret
 * Suivi des remboursements de prets
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
import { Pret } from './pret.entity';
import { Reunion } from '../../reunions/entities/reunion.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';

@Entity('remboursement_pret')
export class RemboursementPret {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'pret_id', type: 'uuid' })
  pretId: string;

  @ManyToOne(() => Pret, (pret) => pret.remboursements, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'pret_id' })
  pret: Pret;

  @Index()
  @Column({ name: 'reunion_id', type: 'uuid' })
  reunionId: string;

  @ManyToOne(() => Reunion)
  @JoinColumn({ name: 'reunion_id' })
  reunion: Reunion;

  @Column({ name: 'transaction_id', type: 'uuid', nullable: true })
  transactionId: string | null;

  @ManyToOne(() => Transaction)
  @JoinColumn({ name: 'transaction_id' })
  transaction: Transaction | null;

  @Column({ name: 'montant_capital', type: 'decimal', precision: 15, scale: 2 })
  montantCapital: number;

  @Column({ name: 'montant_interet', type: 'decimal', precision: 15, scale: 2, default: 0 })
  montantInteret: number;

  @Column({ name: 'montant_total', type: 'decimal', precision: 15, scale: 2 })
  montantTotal: number;

  @CreateDateColumn({ name: 'date_remboursement', type: 'timestamp' })
  dateRemboursement: Date;

  @Column({ name: 'capital_restant_apres', type: 'decimal', precision: 15, scale: 2 })
  capitalRestantApres: number;

  @Column({ type: 'text', nullable: true })
  commentaire: string | null;
}
