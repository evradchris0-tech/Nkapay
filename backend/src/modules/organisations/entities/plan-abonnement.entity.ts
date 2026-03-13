import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Organisation } from './organisation.entity';

export enum CodePlan {
  FREE = 'FREE',
  STARTER = 'STARTER',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE',
  LEGACY = 'LEGACY',
}

@Entity('plan_abonnement')
export class PlanAbonnement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 100 })
  libelle: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'prix_mensuel', type: 'decimal', precision: 10, scale: 2, default: 0 })
  prixMensuel: number;

  @Column({ name: 'prix_annuel', type: 'decimal', precision: 10, scale: 2, nullable: true })
  prixAnnuel: number | null;

  @Column({ name: 'max_tontines', type: 'smallint', default: 1, comment: '-1 = illimité' })
  maxTontines: number;

  @Column({ name: 'max_membres_par_tontine', type: 'smallint', default: 50, comment: '-1 = illimité' })
  maxMembreParTontine: number;

  @Column({ name: 'max_exercices_par_tontine', type: 'smallint', default: 5, comment: '-1 = illimité' })
  maxExercicesParTontine: number;

  @Column({ type: 'json', nullable: true })
  fonctionnalites: Record<string, boolean> | null;

  @Column({ name: 'est_actif', type: 'boolean', default: true })
  estActif: boolean;

  @CreateDateColumn({ name: 'cree_le', type: 'timestamp' })
  creeLe: Date;

  @UpdateDateColumn({ name: 'modifie_le', type: 'timestamp', nullable: true })
  modifieLe: Date | null;

  @OneToMany(() => Organisation, (org) => org.planAbonnement)
  organisations: Organisation[];
}
