/**
 * Entité CotisationDueMensuelle
 * 
 * Représente la COTISATION que chaque membre doit payer lors d'une réunion.
 * 
 * LOGIQUE MÉTIER TONTINE:
 * - La COTISATION est le cœur de la tontine
 * - Chaque membre cotise un montant fixe (ex: 10 000 FCFA/mois)
 * - Le TOTAL des cotisations du mois est DISTRIBUÉ à UN bénéficiaire
 * - Chaque membre sera bénéficiaire une fois dans l'exercice
 * 
 * FLUX MENSUEL:
 * 1. Réunion ouverte → cotisations générées pour chaque membre
 * 2. Membres paient leurs cotisations
 * 3. À la clôture, total cotisations → distribué au bénéficiaire du mois
 * 
 * @example
 * 4 membres × 10 000 FCFA = 40 000 FCFA distribués au bénéficiaire
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

@Entity('cotisation_due_mensuelle')
@Unique(['reunionId', 'exerciceMembreId'])
export class CotisationDueMensuelle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'reunion_id', type: 'uuid' })
  reunionId: string;

  @ManyToOne(() => Reunion, (reunion) => reunion.cotisationsDues, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reunion_id' })
  reunion: Reunion;

  @Index()
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
