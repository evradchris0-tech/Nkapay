import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Organisation } from './organisation.entity';
import { RuleDefinition } from '../../tontines/entities/rule-definition.entity';
import { MembreOrganisation } from './membre-organisation.entity';

@Entity('regle_organisation')
@Unique('UQ_regle_organisation_unique', ['organisationId', 'ruleDefinitionId'])
export class RegleOrganisation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'organisation_id', type: 'uuid' })
  organisationId: string;

  @Column({ name: 'rule_definition_id', type: 'uuid' })
  ruleDefinitionId: string;

  @Column({ type: 'varchar', length: 255 })
  valeur: string;

  @Column({ name: 'est_active', type: 'boolean', default: true })
  estActive: boolean;

  @Column({ name: 'modifie_par_membre_organisation_id', type: 'uuid', nullable: true })
  modifieParMembreOrganisationId: string | null;

  @ManyToOne(() => Organisation, (org) => org.regles)
  @JoinColumn({ name: 'organisation_id' })
  organisation: Organisation;

  @ManyToOne(() => RuleDefinition)
  @JoinColumn({ name: 'rule_definition_id' })
  ruleDefinition: RuleDefinition;

  @ManyToOne(() => MembreOrganisation)
  @JoinColumn({ name: 'modifie_par_membre_organisation_id' })
  modifieParMembreOrganisation: MembreOrganisation | null;

  @CreateDateColumn({ name: 'cree_le', type: 'timestamp' })
  creeLe: Date;

  @UpdateDateColumn({ name: 'modifie_le', type: 'timestamp', nullable: true })
  modifieLe: Date | null;
}
