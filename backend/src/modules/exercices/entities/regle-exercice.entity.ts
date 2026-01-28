/**
 * Entite RegleExercice
 * Valeurs des regles au niveau exercice (surcharge la tontine)
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Exercice } from './exercice.entity';
import { RuleDefinition } from '../../tontines/entities/rule-definition.entity';
import { ExerciceMembre } from './exercice-membre.entity';
import { HistoriqueRegleExercice } from './historique-regle-exercice.entity';

@Entity('regle_exercice')
@Unique(['exerciceId', 'ruleDefinitionId'])
export class RegleExercice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'exercice_id', type: 'uuid' })
  exerciceId: string;

  @ManyToOne(() => Exercice, (exercice) => exercice.regles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'exercice_id' })
  exercice: Exercice;

  @Column({ name: 'rule_definition_id', type: 'uuid' })
  ruleDefinitionId: string;

  @ManyToOne(() => RuleDefinition, (rd) => rd.reglesExercice, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'rule_definition_id' })
  ruleDefinition: RuleDefinition;

  @Column({ type: 'varchar', length: 255 })
  valeur: string;

  @Column({ name: 'est_surchargee', type: 'boolean', default: false })
  estSurchargee: boolean;

  @Column({ name: 'modifie_le', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  modifieLe: Date;

  @Column({ name: 'modifie_par_exercice_membre_id', type: 'uuid', nullable: true })
  modifieParExerciceMembreId: string | null;

  @ManyToOne(() => ExerciceMembre)
  @JoinColumn({ name: 'modifie_par_exercice_membre_id' })
  modifieParExerciceMembre: ExerciceMembre | null;

  @CreateDateColumn({ name: 'cree_le', type: 'timestamp' })
  creeLe: Date;

  @OneToMany(() => HistoriqueRegleExercice, (h) => h.regleExercice)
  historique: HistoriqueRegleExercice[];
}
