/**
 * Entite Pret
 * Prets accordes aux membres
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Reunion } from '../../reunions/entities/reunion.entity';
import { ExerciceMembre } from '../../exercices/entities/exercice-membre.entity';
import { RemboursementPret } from './remboursement-pret.entity';

export enum StatutPret {
  DEMANDE = 'DEMANDE',
  APPROUVE = 'APPROUVE',
  REFUSE = 'REFUSE',
  DECAISSE = 'DECAISSE',
  EN_COURS = 'EN_COURS',
  SOLDE = 'SOLDE',
  DEFAUT = 'DEFAUT',
}

@Entity('pret')
export class Pret {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'reunion_id', type: 'uuid' })
  reunionId: string;

  @ManyToOne(() => Reunion, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'reunion_id' })
  reunion: Reunion;

  @Index()
  @Column({ name: 'exercice_membre_id', type: 'uuid' })
  exerciceMembreId: string;

  @ManyToOne(() => ExerciceMembre, (em) => em.prets, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'exercice_membre_id' })
  exerciceMembre: ExerciceMembre;

  @Column({ name: 'montant_capital', type: 'decimal', precision: 15, scale: 2 })
  montantCapital: number;

  @Column({ name: 'taux_interet', type: 'decimal', precision: 5, scale: 4, default: 0 })
  tauxInteret: number;

  @Column({ name: 'montant_interet', type: 'decimal', precision: 15, scale: 2, default: 0 })
  montantInteret: number;

  @Column({ name: 'montant_total_du', type: 'decimal', precision: 15, scale: 2 })
  montantTotalDu: number;

  @Column({ name: 'duree_mois', type: 'int' })
  dureeMois: number;

  @Index()
  @Column({ type: 'enum', enum: StatutPret, default: StatutPret.DEMANDE })
  statut: StatutPret;

  @Column({ name: 'capital_restant', type: 'decimal', precision: 15, scale: 2 })
  capitalRestant: number;

  @CreateDateColumn({ name: 'date_demande', type: 'timestamp' })
  dateDemande: Date;

  @Column({ name: 'date_approbation', type: 'date', nullable: true })
  dateApprobation: Date | null;

  @Column({ name: 'date_decaissement', type: 'date', nullable: true })
  dateDecaissement: Date | null;

  @Column({ name: 'date_echeance', type: 'date', nullable: true })
  dateEcheance: Date | null;

  @Column({ name: 'date_solde', type: 'date', nullable: true })
  dateSolde: Date | null;

  @Column({ name: 'approuve_par_exercice_membre_id', type: 'uuid', nullable: true })
  approuveParExerciceMembreId: string | null;

  @ManyToOne(() => ExerciceMembre)
  @JoinColumn({ name: 'approuve_par_exercice_membre_id' })
  approuveParExerciceMembre: ExerciceMembre | null;

  @Column({ name: 'motif_refus', type: 'text', nullable: true })
  motifRefus: string | null;

  @Column({ type: 'text', nullable: true })
  commentaire: string | null;

  @OneToMany(() => RemboursementPret, (rp) => rp.pret)
  remboursements: RemboursementPret[];
}
