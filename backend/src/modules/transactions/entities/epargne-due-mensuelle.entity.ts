/**
 * Entité EpargneDueMensuelle
 * 
 * Représente l'ÉPARGNE que chaque membre doit verser lors d'une réunion.
 * 
 * LOGIQUE MÉTIER TONTINE:
 * - L'ÉPARGNE est un montant mis de côté INDIVIDUELLEMENT par chaque membre
 * - Contrairement à la cotisation (redistribuée), l'épargne est CONSERVÉE
 * - À la fin de l'exercice (CASSATION), chaque membre récupère SON épargne
 * 
 * DIFFÉRENCE CLÉ:
 * - COTISATION: Mutualisée → 1 bénéficiaire par mois
 * - ÉPARGNE: Individuelle → Chacun récupère la sienne à la cassation
 * 
 * @example
 * Épargne de 5 000 FCFA/mois × 12 mois = 60 000 FCFA récupérés à la cassation
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

@Entity('epargne_due_mensuelle')
@Unique(['reunionId', 'exerciceMembreId'])
export class EpargneDueMensuelle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'reunion_id', type: 'uuid' })
  reunionId: string;

  @ManyToOne(() => Reunion, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reunion_id' })
  reunion: Reunion;

  @Index()
  @Column({ name: 'exercice_membre_id', type: 'uuid' })
  exerciceMembreId: string;

  @ManyToOne(() => ExerciceMembre, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'exercice_membre_id' })
  exerciceMembre: ExerciceMembre;

  /** Montant d'épargne dû pour ce mois */
  @Column({ name: 'montant_du', type: 'decimal', precision: 15, scale: 2 })
  montantDu: number;

  /** Montant effectivement payé */
  @Column({ name: 'montant_paye', type: 'decimal', precision: 15, scale: 2, default: 0 })
  montantPaye: number;

  /** Solde restant à payer */
  @Column({ name: 'solde_restant', type: 'decimal', precision: 15, scale: 2 })
  soldeRestant: number;

  @Column({ type: 'enum', enum: StatutDu, default: StatutDu.EN_RETARD })
  statut: StatutDu;

  @CreateDateColumn({ name: 'cree_le', type: 'timestamp' })
  creeLe: Date;

  @UpdateDateColumn({ name: 'modifie_le', type: 'timestamp', nullable: true })
  modifieLe: Date | null;
}
