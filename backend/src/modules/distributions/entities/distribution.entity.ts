/**
 * Entité Distribution
 * 
 * Représente la DISTRIBUTION MENSUELLE DES COTISATIONS au bénéficiaire.
 * 
 * LOGIQUE MÉTIER TONTINE:
 * - Chaque mois, lors d'une réunion, les membres cotisent
 * - Le total des cotisations est remis à UN bénéficiaire (tirage au sort ou ordre défini)
 * - Chaque membre bénéficie UNE FOIS par exercice (1 membre = 1 mois)
 * 
 * NE PAS CONFONDRE AVEC:
 * - POT: Argent collecté pour les DÉPENSES (collation, boissons, nourriture de la réunion)
 * - CASSATION: Distribution finale du capital restant à la CLÔTURE de l'exercice
 * 
 * @example
 * Exercice 12 mois, 4 membres cotisant 10 000 FCFA/mois:
 * - Réunion 1: Marie reçoit 40 000 FCFA (4 membres × 10 000)
 * - Réunion 2: Pierre reçoit 40 000 FCFA
 * - ... et ainsi de suite
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
import { Reunion } from '../../reunions/entities/reunion.entity';
import { ExerciceMembre } from '../../exercices/entities/exercice-membre.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';

export enum StatutDistribution {
  PLANIFIEE = 'PLANIFIEE',
  DISTRIBUEE = 'DISTRIBUEE',
  ANNULEE = 'ANNULEE',
}

@Entity('distribution')
@Unique(['reunionId', 'ordre'])
export class Distribution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'reunion_id', type: 'uuid' })
  reunionId: string;

  @ManyToOne(() => Reunion, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reunion_id' })
  reunion: Reunion;

  @Index()
  @Column({ name: 'exercice_membre_beneficiaire_id', type: 'uuid' })
  exerciceMembreBeneficiaireId: string;

  @ManyToOne(() => ExerciceMembre, (em) => em.distributions, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'exercice_membre_beneficiaire_id' })
  exerciceMembreBeneficiaire: ExerciceMembre;

  @Column({ type: 'int' })
  ordre: number;

  @Column({ name: 'montant_brut', type: 'decimal', precision: 15, scale: 2 })
  montantBrut: number;

  @Column({ name: 'montant_retenu', type: 'decimal', precision: 15, scale: 2, default: 0 })
  montantRetenu: number;

  @Column({ name: 'montant_net', type: 'decimal', precision: 15, scale: 2 })
  montantNet: number;

  @Index()
  @Column({ type: 'enum', enum: StatutDistribution, default: StatutDistribution.PLANIFIEE })
  statut: StatutDistribution;

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
