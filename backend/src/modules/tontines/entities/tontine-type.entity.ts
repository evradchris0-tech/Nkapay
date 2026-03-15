/**
 * Entite TontineType
 * Types de tontines disponibles (STANDARD, COMPLET, EPARGNE, SOLIDARITE)
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Tontine } from './tontine.entity';

@Entity('tontine_type')
export class TontineType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 100 })
  libelle: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'est_actif', type: 'boolean', default: true })
  estActif: boolean;

  @CreateDateColumn({ name: 'cree_le', type: 'timestamp' })
  creeLe: Date;

  @OneToMany(() => Tontine, (tontine) => tontine.tontineType)
  tontines: Tontine[];
}
