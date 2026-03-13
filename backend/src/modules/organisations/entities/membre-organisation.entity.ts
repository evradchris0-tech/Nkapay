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
import { Organisation } from './organisation.entity';
import { Utilisateur } from '../../utilisateurs/entities/utilisateur.entity';

export enum RoleOrganisation {
  ORG_ADMIN = 'ORG_ADMIN',
  ORG_MEMBRE = 'ORG_MEMBRE',
  ORG_VIEWER = 'ORG_VIEWER',
}

export enum StatutMembreOrganisation {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

@Entity('membre_organisation')
@Unique('UQ_membre_organisation_user', ['organisationId', 'utilisateurId'])
export class MembreOrganisation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'organisation_id', type: 'uuid' })
  organisationId: string;

  @Index()
  @Column({ name: 'utilisateur_id', type: 'uuid' })
  utilisateurId: string;

  @Column({ type: 'enum', enum: RoleOrganisation, default: RoleOrganisation.ORG_MEMBRE })
  role: RoleOrganisation;

  @Column({ type: 'enum', enum: StatutMembreOrganisation, default: StatutMembreOrganisation.ACTIVE })
  statut: StatutMembreOrganisation;

  @Column({ name: 'invite_par_utilisateur_id', type: 'uuid', nullable: true })
  inviteParUtilisateurId: string | null;

  @ManyToOne(() => Organisation, (org) => org.membres)
  @JoinColumn({ name: 'organisation_id' })
  organisation: Organisation;

  @ManyToOne(() => Utilisateur)
  @JoinColumn({ name: 'utilisateur_id' })
  utilisateur: Utilisateur;

  @ManyToOne(() => Utilisateur)
  @JoinColumn({ name: 'invite_par_utilisateur_id' })
  inviteParUtilisateur: Utilisateur | null;

  @CreateDateColumn({ name: 'cree_le', type: 'timestamp' })
  creeLe: Date;

  @UpdateDateColumn({ name: 'modifie_le', type: 'timestamp', nullable: true })
  modifieLe: Date | null;
}
