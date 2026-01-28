/**
 * Entite PaiementMobile
 * Suivi des paiements via mobile money
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Transaction } from './transaction.entity';
import { OperateurPaiement } from './operateur-paiement.entity';

export enum StatutPaiementMobile {
  INITIEE = 'INITIEE',
  EN_ATTENTE = 'EN_ATTENTE',
  CONFIRMEE = 'CONFIRMEE',
  ECHOUEE = 'ECHOUEE',
  ANNULEE = 'ANNULEE',
  REMBOURSEE = 'REMBOURSEE',
  EXPIREE = 'EXPIREE',
}

@Entity('paiement_mobile')
export class PaiementMobile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'transaction_id', type: 'uuid' })
  transactionId: string;

  @ManyToOne(() => Transaction, (tx) => tx.paiementsMobiles, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'transaction_id' })
  transaction: Transaction;

  @Column({ name: 'operateur_id', type: 'uuid' })
  operateurId: string;

  @ManyToOne(() => OperateurPaiement, (op) => op.paiements)
  @JoinColumn({ name: 'operateur_id' })
  operateur: OperateurPaiement;

  @Column({ name: 'numero_payeur', type: 'varchar', length: 20 })
  numeroPayeur: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  montant: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  frais: number;

  @Index()
  @Column({ name: 'reference_externe', type: 'varchar', length: 100, unique: true, nullable: true })
  referenceExterne: string | null;

  @Index()
  @Column({ type: 'enum', enum: StatutPaiementMobile, default: StatutPaiementMobile.INITIEE })
  statut: StatutPaiementMobile;

  @Column({ name: 'statut_operateur', type: 'varchar', length: 50, nullable: true })
  statutOperateur: string | null;

  @Column({ name: 'message_operateur', type: 'text', nullable: true })
  messageOperateur: string | null;

  @Column({ name: 'initie_le', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  initieLe: Date;

  @Column({ name: 'confirme_le', type: 'timestamp', nullable: true })
  confirmeLe: Date | null;

  @Column({ name: 'echoue_le', type: 'timestamp', nullable: true })
  echoueLe: Date | null;

  @Column({ name: 'webhook_payload', type: 'json', nullable: true })
  webhookPayload: Record<string, unknown> | null;
}
