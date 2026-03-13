/**
 * Entite ExerciceMembre
 * Participation d'un membre a un exercice avec son nombre de parts
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Exercice } from './exercice.entity';
import { AdhesionTontine } from '../../tontines/entities/adhesion-tontine.entity';
import { PresenceReunion } from '../../reunions/entities/presence-reunion.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { InscriptionDueExercice } from '../../transactions/entities/inscription-due-exercice.entity';
import { SecoursDuAnnuel } from '../../secours/entities/secours-du-annuel.entity';
import { Pret } from '../../prets/entities/pret.entity';
import { Penalite } from '../../penalites/entities/penalite.entity';
import { Distribution } from '../../distributions/entities/distribution.entity';
import { EvenementSecours } from '../../secours/entities/evenement-secours.entity';

export enum TypeMembre {
  ANCIEN = 'ANCIEN',
  NOUVEAU = 'NOUVEAU',
}

export enum StatutExerciceMembre {
  ACTIF = 'ACTIF',
  INACTIF = 'INACTIF',
}

@Entity('exercice_membre')
@Unique(['exerciceId', 'adhesionTontineId'])
export class ExerciceMembre {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'exercice_id', type: 'uuid' })
  exerciceId: string;

  @ManyToOne(() => Exercice, (exercice) => exercice.membres, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'exercice_id' })
  exercice: Exercice;

  @Index()
  @Column({ name: 'adhesion_tontine_id', type: 'uuid' })
  adhesionTontineId: string;

  @ManyToOne(() => AdhesionTontine, (adhesion) => adhesion.exerciceMembres, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'adhesion_tontine_id' })
  adhesionTontine: AdhesionTontine;

  @Column({ name: 'type_membre', type: 'enum', enum: TypeMembre })
  typeMembre: TypeMembre;

  @Column({ name: 'mois_entree', type: 'smallint', default: 1 })
  moisEntree: number;

  @Column({ name: 'date_entree_exercice', type: 'date' })
  dateEntreeExercice: Date;

  @Column({ name: 'nombre_parts', type: 'decimal', precision: 5, scale: 2, default: 1.0 })
  nombreParts: number;

  @Column({ type: 'enum', enum: StatutExerciceMembre, default: StatutExerciceMembre.ACTIF })
  statut: StatutExerciceMembre;

  @Column({ name: 'parrain_exercice_membre_id', type: 'uuid', nullable: true })
  parrainExerciceMembreId: string | null;

  @ManyToOne(() => ExerciceMembre)
  @JoinColumn({ name: 'parrain_exercice_membre_id' })
  parrain: ExerciceMembre | null;

  @CreateDateColumn({ name: 'cree_le', type: 'timestamp' })
  creeLe: Date;

  @UpdateDateColumn({ name: 'modifie_le', type: 'timestamp', nullable: true })
  modifieLe: Date | null;

  @DeleteDateColumn({ name: 'supprime_le', type: 'timestamp', nullable: true })
  supprimeLe: Date | null;

  @OneToMany(() => PresenceReunion, (presence) => presence.exerciceMembre)
  presences: PresenceReunion[];

  @OneToMany(() => Transaction, (tx) => tx.exerciceMembre)
  transactions: Transaction[];

  @OneToOne(() => InscriptionDueExercice, (inscription) => inscription.exerciceMembre)
  inscriptionDue: InscriptionDueExercice;

  @OneToOne(() => SecoursDuAnnuel, (secours) => secours.exerciceMembre)
  secoursDu: SecoursDuAnnuel;

  @OneToMany(() => Pret, (pret) => pret.exerciceMembre)
  prets: Pret[];

  @OneToMany(() => Penalite, (penalite) => penalite.exerciceMembre)
  penalites: Penalite[];

  @OneToMany(() => Distribution, (dist) => dist.exerciceMembreBeneficiaire)
  distributions: Distribution[];

  @OneToMany(() => EvenementSecours, (evt) => evt.exerciceMembre)
  evenementsSecours: EvenementSecours[];
}
