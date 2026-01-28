/**
 * Entite TypeEvenementSecours
 * Types d'evenements ouvrant droit a des secours
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
import { EvenementSecours } from './evenement-secours.entity';

@Entity('type_evenement_secours')
export class TypeEvenementSecours {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 200 })
  libelle: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'est_actif', type: 'boolean', default: true })
  estActif: boolean;

  @Column({ name: 'montant_par_defaut', type: 'decimal', precision: 15, scale: 2, nullable: true })
  montantParDefaut: number | null;

  @Column({ name: 'ordre_affichage', type: 'int', default: 0 })
  ordreAffichage: number;

  @CreateDateColumn({ name: 'cree_le', type: 'timestamp' })
  creeLe: Date;

  @UpdateDateColumn({ name: 'modifie_le', type: 'timestamp', nullable: true })
  modifieLe: Date | null;

  @DeleteDateColumn({ name: 'supprime_le', type: 'timestamp', nullable: true })
  supprimeLe: Date | null;

  @OneToMany(() => EvenementSecours, (es) => es.typeEvenementSecours)
  evenements: EvenementSecours[];
}
