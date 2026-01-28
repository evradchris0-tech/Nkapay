/**
 * Entite SessionUtilisateur
 * Sessions de connexion des utilisateurs
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

@Entity('session_utilisateur')
export class SessionUtilisateur {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'utilisateur_id', type: 'uuid' })
  utilisateurId: string;

  @ManyToOne(() => Utilisateur, (u) => u.sessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'utilisateur_id' })
  utilisateur: Utilisateur;

  @Index()
  @Column({ name: 'token_hash', type: 'varchar', length: 255 })
  tokenHash: string;

  @Column({ name: 'refresh_token_hash', type: 'varchar', length: 255, nullable: true })
  refreshTokenHash: string | null;

  @CreateDateColumn({ name: 'cree_le', type: 'timestamp' })
  creeLe: Date;

  @Index()
  @Column({ name: 'expire_le', type: 'timestamp' })
  expireLe: Date;

  @Column({ name: 'derniere_activite', type: 'timestamp', nullable: true })
  derniereActivite: Date | null;

  @Column({ name: 'adresse_ip', type: 'varchar', length: 45, nullable: true })
  adresseIp: string | null;

  @Column({ name: 'user_agent', type: 'varchar', length: 500, nullable: true })
  userAgent: string | null;

  @Column({ name: 'est_revoquee', type: 'boolean', default: false })
  estRevoquee: boolean;

  @Column({ name: 'revoquee_le', type: 'timestamp', nullable: true })
  revoqueeLe: Date | null;

  @Column({ name: 'motif_revocation', type: 'varchar', length: 200, nullable: true })
  motifRevocation: string | null;
}
