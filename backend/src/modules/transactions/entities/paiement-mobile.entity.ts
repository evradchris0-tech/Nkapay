import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Transaction } from './transaction.entity';

export enum StatutPaiementMobile {
  EN_ATTENTE = 'EN_ATTENTE',
  ENVOYE = 'ENVOYE',
  CONFIRME = 'CONFIRME',
  ECHOUE = 'ECHOUE',
  ANNULE = 'ANNULE',
}

export enum OperateurMobile {
  MTN_MOBILE_MONEY = 'MTN_MOBILE_MONEY',
  ORANGE_MONEY = 'ORANGE_MONEY',
  MOOV_MONEY = 'MOOV_MONEY',
  WAVE = 'WAVE',
  FREE_MONEY = 'FREE_MONEY',
  AIRTEL_MONEY = 'AIRTEL_MONEY',
}

@Entity('paiement_mobile')
export class PaiementMobile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'transaction_id' })
  transactionId: string;

  @ManyToOne(() => Transaction)
  @JoinColumn({ name: 'transaction_id' })
  transaction: Transaction;

  @Column({
    type: 'enum',
    enum: OperateurMobile,
  })
  operateur: OperateurMobile;

  @Column({ name: 'numero_telephone', length: 20 })
  numeroTelephone: string;

  @Column({
    type: 'enum',
    enum: StatutPaiementMobile,
    default: StatutPaiementMobile.EN_ATTENTE,
  })
  statut: StatutPaiementMobile;

  @Column({ name: 'reference_externe', length: 100, nullable: true, unique: true })
  referenceExterne: string;

  @Column({ name: 'code_confirmation', length: 50, nullable: true })
  codeConfirmation: string;

  @Column({ type: 'text', nullable: true })
  erreur: string;

  @CreateDateColumn({ name: 'date_initiation' })
  dateInitiation: Date;

  @Column({ name: 'date_confirmation', type: 'timestamp', nullable: true })
  dateConfirmation: Date;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;
}
