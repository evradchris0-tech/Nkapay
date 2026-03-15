/**
 * Entite Langue
 * Represente les langues disponibles dans l'application (FR, EN)
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Utilisateur } from './utilisateur.entity';

@Entity('langue')
export class Langue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 5, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 50 })
  nom: string;

  @Column({ name: 'nom_natif', type: 'varchar', length: 50 })
  nomNatif: string;

  @Column({ name: 'est_active', type: 'boolean', default: true })
  estActive: boolean;

  @Index({ unique: true, where: 'est_defaut = true' })
  @Column({ name: 'est_defaut', type: 'boolean', default: false })
  estDefaut: boolean;

  @Column({ name: 'ordre_affichage', type: 'smallint', default: 0 })
  ordreAffichage: number;

  @CreateDateColumn({ name: 'cree_le', type: 'timestamp' })
  creeLe: Date;

  @OneToMany(() => Utilisateur, (utilisateur) => utilisateur.languePreferee)
  utilisateurs: Utilisateur[];
}
