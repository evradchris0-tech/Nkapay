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
} from 'typeorm';
import { PlanAbonnement } from './plan-abonnement.entity';
import { MembreOrganisation } from './membre-organisation.entity';
import { RegleOrganisation } from './regle-organisation.entity';
import { InvitationOrganisation } from './invitation-organisation.entity';

export enum StatutOrganisation {
  ACTIVE = 'ACTIVE',
  SUSPENDUE = 'SUSPENDUE',
  RESILIEE = 'RESILIEE',
}

@Entity('organisation')
export class Organisation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  nom: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  slug: string;

  @Column({ name: 'email_contact', type: 'varchar', length: 255, unique: true })
  emailContact: string;

  @Column({ name: 'telephone_contact', type: 'varchar', length: 20, nullable: true })
  telephoneContact: string | null;

  @Column({ type: 'varchar', length: 3, default: 'CM' })
  pays: string;

  @Column({ type: 'varchar', length: 3, default: 'XAF' })
  devise: string;

  @Column({ name: 'fuseau_horaire', type: 'varchar', length: 50, default: 'Africa/Douala' })
  fuseauHoraire: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  logo: string | null;

  @Index()
  @Column({ type: 'enum', enum: StatutOrganisation, default: StatutOrganisation.ACTIVE })
  statut: StatutOrganisation;

  @Column({ name: 'plan_abonnement_id', type: 'uuid', nullable: true })
  planAbonnementId: string | null;

  @ManyToOne(() => PlanAbonnement, (plan) => plan.organisations)
  @JoinColumn({ name: 'plan_abonnement_id' })
  planAbonnement: PlanAbonnement | null;

  @Column({ name: 'abonnement_debut_le', type: 'date', nullable: true })
  abonnementDebutLe: Date | null;

  @Column({ name: 'abonnement_fin_le', type: 'date', nullable: true })
  abonnementFinLe: Date | null;

  @CreateDateColumn({ name: 'cree_le', type: 'timestamp' })
  creeLe: Date;

  @UpdateDateColumn({ name: 'modifie_le', type: 'timestamp', nullable: true })
  modifieLe: Date | null;

  @DeleteDateColumn({ name: 'supprime_le', type: 'timestamp', nullable: true })
  supprimeLe: Date | null;

  @OneToMany(() => MembreOrganisation, (m) => m.organisation)
  membres: MembreOrganisation[];

  @OneToMany(() => RegleOrganisation, (r) => r.organisation)
  regles: RegleOrganisation[];

  @OneToMany(() => InvitationOrganisation, (inv) => inv.organisation)
  invitations: InvitationOrganisation[];
}
