/**
 * Entite Transaction
 * Operations financieres (paiements, decaissements)
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
import { Utilisateur } from '../../utilisateurs/entities/utilisateur.entity';
import { Projet } from './projet.entity';
import { PaiementMobile } from './paiement-mobile.entity';

export enum TypeTransaction {
  INSCRIPTION = 'INSCRIPTION',
  COTISATION = 'COTISATION',
  POT = 'POT',
  SECOURS = 'SECOURS',
  EPARGNE = 'EPARGNE',
  DECAISSEMENT_PRET = 'DECAISSEMENT_PRET',
  REMBOURSEMENT_PRET = 'REMBOURSEMENT_PRET',
  DEPENSE_SECOURS = 'DEPENSE_SECOURS',
  PENALITE = 'PENALITE',
  PROJET = 'PROJET',
  AUTRE = 'AUTRE',
}

export enum StatutTransaction {
  BROUILLON = 'BROUILLON',
  SOUMIS = 'SOUMIS',
  VALIDE = 'VALIDE',
  REJETE = 'REJETE',
  ANNULE = 'ANNULE',
  EXPIRE = 'EXPIRE',
}

export enum ModeCreationTransaction {
  MANUEL = 'MANUEL',
  MOBILE = 'MOBILE',
  IMPORT = 'IMPORT',
  AUTOMATIQUE = 'AUTOMATIQUE',
}

@Entity('transaction')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'reunion_id', type: 'uuid', nullable: true })
  reunionId: string | null;

  @ManyToOne(() => Reunion, (reunion) => reunion.transactions)
  @JoinColumn({ name: 'reunion_id' })
  reunion: Reunion | null;

  @Column({ name: 'type_transaction', type: 'enum', enum: TypeTransaction })
  typeTransaction: TypeTransaction;

  @Index()
  @Column({ name: 'exercice_membre_id', type: 'uuid', nullable: true })
  exerciceMembreId: string | null;

  @ManyToOne(() => ExerciceMembre, (em) => em.transactions)
  @JoinColumn({ name: 'exercice_membre_id' })
  exerciceMembre: ExerciceMembre | null;

  @Column({ name: 'projet_id', type: 'uuid', nullable: true })
  projetId: string | null;

  @ManyToOne(() => Projet)
  @JoinColumn({ name: 'projet_id' })
  projet: Projet | null;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  montant: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  reference: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string | null;

  @Index()
  @Column({ type: 'enum', enum: StatutTransaction, default: StatutTransaction.BROUILLON })
  statut: StatutTransaction;

  @Column({ name: 'mode_creation', type: 'enum', enum: ModeCreationTransaction, default: ModeCreationTransaction.MANUEL })
  modeCreation: ModeCreationTransaction;

  // Createur (l'un des deux obligatoire)
  @Column({ name: 'cree_par_utilisateur_id', type: 'uuid', nullable: true })
  creeParUtilisateurId: string | null;

  @ManyToOne(() => Utilisateur)
  @JoinColumn({ name: 'cree_par_utilisateur_id' })
  creeParUtilisateur: Utilisateur | null;

  @Column({ name: 'cree_par_exercice_membre_id', type: 'uuid', nullable: true })
  creeParExerciceMembreId: string | null;

  @ManyToOne(() => ExerciceMembre)
  @JoinColumn({ name: 'cree_par_exercice_membre_id' })
  creeParExerciceMembre: ExerciceMembre | null;

  @Index()
  @CreateDateColumn({ name: 'cree_le', type: 'timestamp' })
  creeLe: Date;

  // Soumission
  @Column({ name: 'soumis_le', type: 'timestamp', nullable: true })
  soumisLe: Date | null;

  @Column({ name: 'auto_soumis', type: 'boolean', default: false })
  autoSoumis: boolean;

  // Validation
  @Column({ name: 'valide_le', type: 'timestamp', nullable: true })
  valideLe: Date | null;

  @Column({ name: 'valide_par_exercice_membre_id', type: 'uuid', nullable: true })
  valideParExerciceMembreId: string | null;

  @ManyToOne(() => ExerciceMembre)
  @JoinColumn({ name: 'valide_par_exercice_membre_id' })
  valideParExerciceMembre: ExerciceMembre | null;

  // Rejet
  @Column({ name: 'rejete_le', type: 'timestamp', nullable: true })
  rejeteLe: Date | null;

  @Column({ name: 'rejete_par_exercice_membre_id', type: 'uuid', nullable: true })
  rejeteParExerciceMembreId: string | null;

  @ManyToOne(() => ExerciceMembre)
  @JoinColumn({ name: 'rejete_par_exercice_membre_id' })
  rejeteParExerciceMembre: ExerciceMembre | null;

  @Column({ name: 'motif_rejet', type: 'text', nullable: true })
  motifRejet: string | null;

  @OneToMany(() => PaiementMobile, (pm) => pm.transaction)
  paiementsMobiles: PaiementMobile[];
}
