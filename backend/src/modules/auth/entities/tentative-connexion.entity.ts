/**
 * Entite TentativeConnexion
 * Historique des tentatives de connexion (suivi de securite)
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

@Entity('tentative_connexion')
export class TentativeConnexion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'utilisateur_id', type: 'uuid', nullable: true })
  utilisateurId: string | null;

  @ManyToOne(() => Utilisateur, (u) => u.tentativesConnexion, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'utilisateur_id' })
  utilisateur: Utilisateur | null;

  @Index()
  @Column({ name: 'identifiant_saisi', type: 'varchar', length: 100 })
  identifiantSaisi: string;

  @Column({ name: 'est_reussie', type: 'boolean' })
  estReussie: boolean;

  @Column({ name: 'code_erreur', type: 'varchar', length: 50, nullable: true })
  codeErreur: string | null;

  @Index()
  @Column({ name: 'adresse_ip', type: 'varchar', length: 45 })
  adresseIp: string;

  @Column({ name: 'user_agent', type: 'varchar', length: 500, nullable: true })
  userAgent: string | null;

  @CreateDateColumn({ name: 'tentee_le', type: 'timestamp' })
  tenteeLe: Date;
}
