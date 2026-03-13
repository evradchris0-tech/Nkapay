/**
 * Entité Cassation
 *
 * Représente la CASSATION - distribution de l'ÉPARGNE de chaque membre
 * à la clôture d'un exercice.
 *
 * LOGIQUE MÉTIER TONTINE:
 * - La CASSATION survient à la DERNIÈRE réunion de l'exercice
 * - Chaque membre récupère SON ÉPARGNE accumulée pendant l'exercice
 * - L'épargne est un montant fixe versé mensuellement (ex: 5 000 FCFA/mois)
 * - À la cassation, le membre récupère: 12 mois × 5 000 = 60 000 FCFA
 *
 * IMPORTANT - NE PAS CONFONDRE:
 * - COTISATION: Redistribuée mensuellement à 1 bénéficiaire → Distribution
 * - ÉPARGNE: Accumulée individuellement → Cassation (retour au membre)
 * - SECOURS: Fonds mutualisé pour les événements (décès, maladie)
 * - POT: Dépenses de la réunion (collation)
 *
 * CALCUL CASSATION:
 * - Épargne accumulée = montant_epargne × nombre_mois × nombre_parts
 * - Moins déductions éventuelles (prêts non remboursés)
 * - = Montant net à remettre au membre
 *
 * @example
 * Membre avec 1 part, épargne 5 000 FCFA/mois, exercice 12 mois:
 * Cassation = 12 × 5 000 = 60 000 FCFA (son épargne lui est rendue)
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Exercice } from './exercice.entity';
import { ExerciceMembre } from './exercice-membre.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';

export enum StatutCassation {
  CALCULEE = 'CALCULEE', // Montant calculé, en attente de distribution
  DISTRIBUEE = 'DISTRIBUEE', // Épargne remise au membre
  ANNULEE = 'ANNULEE', // Cassation annulée
}

@Entity('cassation')
@Unique(['exerciceId', 'exerciceMembreId'])
export class Cassation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'exercice_id', type: 'uuid' })
  exerciceId: string;

  @ManyToOne(() => Exercice, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'exercice_id' })
  exercice: Exercice;

  @Index()
  @Column({ name: 'exercice_membre_id', type: 'uuid' })
  exerciceMembreId: string;

  @ManyToOne(() => ExerciceMembre, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'exercice_membre_id' })
  exerciceMembre: ExerciceMembre;

  /** Nombre de parts du membre pour cet exercice */
  @Column({ name: 'nombre_parts', type: 'int', default: 1 })
  nombreParts: number;

  /** Montant brut de l'épargne personnelle du membre */
  @Column({ name: 'montant_brut', type: 'decimal', precision: 15, scale: 2 })
  montantBrut: number;

  /** Part des bénéfices de la tontine (intérêts des prêts, pénalités) accordée au membre */
  @Column({ name: 'part_benefice', type: 'decimal', precision: 15, scale: 2, default: 0 })
  partBenefice: number;

  /** Déductions éventuelles (prêts non remboursés, pénalités impayées, etc.) */
  @Column({ name: 'deductions', type: 'decimal', precision: 15, scale: 2, default: 0 })
  deductions: number;

  /** Détail des déductions en JSON */
  @Column({ name: 'detail_deductions', type: 'json', nullable: true })
  detailDeductions: Record<string, number> | null;

  /** Montant net à distribuer au membre */
  @Column({ name: 'montant_net', type: 'decimal', precision: 15, scale: 2 })
  montantNet: number;

  @Index()
  @Column({ type: 'enum', enum: StatutCassation, default: StatutCassation.CALCULEE })
  statut: StatutCassation;

  @Column({ name: 'transaction_id', type: 'uuid', nullable: true })
  transactionId: string | null;

  @ManyToOne(() => Transaction)
  @JoinColumn({ name: 'transaction_id' })
  transaction: Transaction | null;

  @CreateDateColumn({ name: 'cree_le', type: 'timestamp' })
  creeLe: Date;

  @Column({ name: 'distribuee_le', type: 'timestamp', nullable: true })
  distribueeLe: Date | null;

  @Column({ type: 'text', nullable: true })
  commentaire: string | null;
}
