/**
 * Entite HistoriqueRegleExercice
 * Historique des modifications de regles d'exercice
 */

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { RegleExercice } from './regle-exercice.entity';
import { ExerciceMembre } from './exercice-membre.entity';

@Entity('historique_regle_exercice')
export class HistoriqueRegleExercice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'regle_exercice_id', type: 'uuid' })
  regleExerciceId: string;

  @ManyToOne(() => RegleExercice, (regle) => regle.historique, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'regle_exercice_id' })
  regleExercice: RegleExercice;

  @Column({ name: 'ancienne_valeur', type: 'varchar', length: 255 })
  ancienneValeur: string;

  @Column({ name: 'nouvelle_valeur', type: 'varchar', length: 255 })
  nouvelleValeur: string;

  @Column({ type: 'text', nullable: true })
  motif: string | null;

  @Column({ name: 'modifie_par_exercice_membre_id', type: 'uuid' })
  modifieParExerciceMembreId: string;

  @ManyToOne(() => ExerciceMembre)
  @JoinColumn({ name: 'modifie_par_exercice_membre_id' })
  modifieParExerciceMembre: ExerciceMembre;

  @Column({ name: 'modifie_le', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  modifieLe: Date;
}
