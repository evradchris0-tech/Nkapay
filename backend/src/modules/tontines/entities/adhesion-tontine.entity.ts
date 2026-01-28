/**
 * Entite AdhesionTontine
 * Lien entre un utilisateur et une tontine avec son role
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
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Tontine } from './tontine.entity';
import { Utilisateur } from '../../utilisateurs/entities/utilisateur.entity';
import { ExerciceMembre } from '../../exercices/entities/exercice-membre.entity';

export enum RoleMembre {
  PRESIDENT = 'PRESIDENT',
  VICE_PRESIDENT = 'VICE_PRESIDENT',
  TRESORIER = 'TRESORIER',
  SECRETAIRE = 'SECRETAIRE',
  COMMISSAIRE = 'COMMISSAIRE',
  MEMBRE = 'MEMBRE',
}

export enum StatutAdhesion {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

@Entity('adhesion_tontine')
@Unique(['tontineId', 'matricule'])
@Unique(['tontineId', 'utilisateurId'])
export class AdhesionTontine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'tontine_id', type: 'uuid' })
  tontineId: string;

  @ManyToOne(() => Tontine, (tontine) => tontine.adhesions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tontine_id' })
  tontine: Tontine;

  @Index()
  @Column({ name: 'utilisateur_id', type: 'uuid' })
  utilisateurId: string;

  @ManyToOne(() => Utilisateur, (utilisateur) => utilisateur.adhesions, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'utilisateur_id' })
  utilisateur: Utilisateur;

  @Column({ type: 'varchar', length: 50 })
  matricule: string;

  @Column({ type: 'enum', enum: RoleMembre, default: RoleMembre.MEMBRE })
  role: RoleMembre;

  @Column({ type: 'enum', enum: StatutAdhesion, default: StatutAdhesion.ACTIVE })
  statut: StatutAdhesion;

  @Column({ name: 'date_adhesion_tontine', type: 'date', default: () => 'CURRENT_DATE' })
  dateAdhesionTontine: Date;

  @Column({ type: 'varchar', length: 500, nullable: true })
  photo: string | null;

  @Column({ name: 'quartier_residence', type: 'varchar', length: 200, nullable: true })
  quartierResidence: string | null;

  @CreateDateColumn({ name: 'cree_le', type: 'timestamp' })
  creeLe: Date;

  @UpdateDateColumn({ name: 'modifie_le', type: 'timestamp', nullable: true })
  modifieLe: Date | null;

  @DeleteDateColumn({ name: 'supprime_le', type: 'timestamp', nullable: true })
  supprimeLe: Date | null;

  @OneToMany(() => ExerciceMembre, (em) => em.adhesionTontine)
  exerciceMembres: ExerciceMembre[];
}
