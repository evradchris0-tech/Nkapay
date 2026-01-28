/**
 * Entite OperateurPaiement
 * Operateurs de paiement mobile (Orange Money, MTN MoMo)
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { PaiementMobile } from './paiement-mobile.entity';

@Entity('operateur_paiement')
export class OperateurPaiement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 100 })
  nom: string;

  @Column({ name: 'logo_url', type: 'varchar', length: 500, nullable: true })
  logoUrl: string | null;

  @Column({ name: 'est_actif', type: 'boolean', default: true })
  estActif: boolean;

  @Column({ name: 'config_api', type: 'json', nullable: true })
  configApi: Record<string, unknown> | null;

  @Column({ name: 'frais_fixe', type: 'decimal', precision: 10, scale: 2, default: 0 })
  fraisFixe: number;

  @Column({ name: 'frais_pourcentage', type: 'decimal', precision: 5, scale: 4, default: 0 })
  fraisPourcentage: number;

  @CreateDateColumn({ name: 'cree_le', type: 'timestamp' })
  creeLe: Date;

  @UpdateDateColumn({ name: 'modifie_le', type: 'timestamp', nullable: true })
  modifieLe: Date | null;

  @OneToMany(() => PaiementMobile, (pm) => pm.operateur)
  paiements: PaiementMobile[];
}
