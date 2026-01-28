/**
 * Entite RegleTontine
 * Valeurs des regles au niveau tontine (surcharge le defaut global)
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Tontine } from './tontine.entity';
import { RuleDefinition } from './rule-definition.entity';
import { AdhesionTontine } from './adhesion-tontine.entity';

@Entity('regle_tontine')
@Unique(['tontineId', 'ruleDefinitionId'])
export class RegleTontine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tontine_id', type: 'uuid' })
  tontineId: string;

  @ManyToOne(() => Tontine, (tontine) => tontine.regles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tontine_id' })
  tontine: Tontine;

  @Column({ name: 'rule_definition_id', type: 'uuid' })
  ruleDefinitionId: string;

  @ManyToOne(() => RuleDefinition, (rd) => rd.reglesTontine, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'rule_definition_id' })
  ruleDefinition: RuleDefinition;

  @Column({ type: 'varchar', length: 255 })
  valeur: string;

  @Column({ name: 'est_active', type: 'boolean', default: true })
  estActive: boolean;

  @Column({ name: 'modifie_le', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  modifieLe: Date;

  @Column({ name: 'modifie_par_adhesion_tontine_id', type: 'uuid', nullable: true })
  modifieParAdhesionTontineId: string | null;

  @ManyToOne(() => AdhesionTontine)
  @JoinColumn({ name: 'modifie_par_adhesion_tontine_id' })
  modifieParAdhesionTontine: AdhesionTontine | null;

  @CreateDateColumn({ name: 'cree_le', type: 'timestamp' })
  creeLe: Date;
}
