/**
 * Entite DemandeAdhesion
 * Demandes d'adhesion soumises par les utilisateurs mobiles
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Utilisateur } from '../../utilisateurs/entities/utilisateur.entity';
import { Tontine } from '../../tontines/entities/tontine.entity';
import { ExerciceMembre } from '../../exercices/entities/exercice-membre.entity';

export enum StatutDemandeAdhesion {
  SOUMISE = 'SOUMISE',
  EN_COURS = 'EN_COURS',
  APPROUVEE = 'APPROUVEE',
  REFUSEE = 'REFUSEE',
  EXPIREE = 'EXPIREE',
}

@Entity('demande_adhesion')
export class DemandeAdhesion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'utilisateur_id', type: 'uuid' })
  utilisateurId: string;

  @ManyToOne(() => Utilisateur, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'utilisateur_id' })
  utilisateur: Utilisateur;

  @Index()
  @Column({ name: 'tontine_id', type: 'uuid' })
  tontineId: string;

  @ManyToOne(() => Tontine)
  @JoinColumn({ name: 'tontine_id' })
  tontine: Tontine;

  @Column({ type: 'text', nullable: true })
  message: string | null;

  @Index()
  @Column({ type: 'enum', enum: StatutDemandeAdhesion, default: StatutDemandeAdhesion.SOUMISE })
  statut: StatutDemandeAdhesion;

  @CreateDateColumn({ name: 'soumise_le', type: 'timestamp' })
  soumiseLe: Date;

  @Column({ name: 'traitee_le', type: 'timestamp', nullable: true })
  traiteeLe: Date | null;

  @Column({ name: 'traitee_par_exercice_membre_id', type: 'uuid', nullable: true })
  traiteeParExerciceMembreId: string | null;

  @ManyToOne(() => ExerciceMembre)
  @JoinColumn({ name: 'traitee_par_exercice_membre_id' })
  traiteeParExerciceMembre: ExerciceMembre | null;

  @Column({ name: 'motif_refus', type: 'text', nullable: true })
  motifRefus: string | null;
}
