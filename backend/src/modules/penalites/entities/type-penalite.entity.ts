/**
 * Entite TypePenalite
 * Types de penalites applicables
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { Penalite } from './penalite.entity';

export enum ModeCalculPenalite {
  MONTANT_FIXE = 'MONTANT_FIXE',
  POURCENTAGE = 'POURCENTAGE',
  MONTANT_PAR_JOUR = 'MONTANT_PAR_JOUR',
}

@Entity('type_penalite')
export class TypePenalite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 200 })
  libelle: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    name: 'mode_calcul',
    type: 'enum',
    enum: ModeCalculPenalite,
    default: ModeCalculPenalite.MONTANT_FIXE,
  })
  modeCalcul: ModeCalculPenalite;

  @Column({ name: 'valeur_defaut', type: 'decimal', precision: 15, scale: 2, nullable: true })
  valeurDefaut: number | null;

  @Column({ name: 'est_actif', type: 'boolean', default: true })
  estActif: boolean;

  @CreateDateColumn({ name: 'cree_le', type: 'timestamp' })
  creeLe: Date;

  @UpdateDateColumn({ name: 'modifie_le', type: 'timestamp', nullable: true })
  modifieLe: Date | null;

  @DeleteDateColumn({ name: 'supprime_le', type: 'timestamp', nullable: true })
  supprimeLe: Date | null;

  @OneToMany(() => Penalite, (p) => p.typePenalite)
  penalites: Penalite[];
}
