import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Organisation } from './organisation.entity';
import { Utilisateur } from '../../utilisateurs/entities/utilisateur.entity';
import { RoleOrganisation } from './membre-organisation.entity';

export enum StatutInvitation {
  EN_ATTENTE = 'EN_ATTENTE',
  ACCEPTEE = 'ACCEPTEE',
  EXPIREE = 'EXPIREE',
  REVOQUEE = 'REVOQUEE',
}

@Entity('invitation_organisation')
export class InvitationOrganisation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organisation_id', type: 'uuid' })
  organisationId: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  telephone: string | null;

  @Column({ name: 'role_propose', type: 'enum', enum: [RoleOrganisation.ORG_ADMIN, RoleOrganisation.ORG_MEMBRE], default: RoleOrganisation.ORG_MEMBRE })
  rolePropose: RoleOrganisation.ORG_ADMIN | RoleOrganisation.ORG_MEMBRE;

  @Index('IDX_invitation_organisation_token', { unique: true })
  @Column({ type: 'varchar', length: 100 })
  token: string;

  @Column({ name: 'expire_le', type: 'timestamp' })
  expireLe: Date;

  @Column({ type: 'enum', enum: StatutInvitation, default: StatutInvitation.EN_ATTENTE })
  statut: StatutInvitation;

  @Column({ name: 'cree_par_utilisateur_id', type: 'uuid', nullable: true })
  creeParUtilisateurId: string | null;

  @ManyToOne(() => Organisation, (org) => org.invitations)
  @JoinColumn({ name: 'organisation_id' })
  organisation: Organisation;

  @ManyToOne(() => Utilisateur)
  @JoinColumn({ name: 'cree_par_utilisateur_id' })
  creeParUtilisateur: Utilisateur | null;

  @CreateDateColumn({ name: 'cree_le', type: 'timestamp' })
  creeLe: Date;
}
