/**
 * Entite Utilisateur
 * Represente une personne physique utilisant le systeme
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Langue } from './langue.entity';
import { AdhesionTontine } from '../../tontines/entities/adhesion-tontine.entity';
import { SessionUtilisateur } from '../../auth/entities/session-utilisateur.entity';
import { TentativeConnexion } from '../../auth/entities/tentative-connexion.entity';

@Entity('utilisateur')
export class Utilisateur {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  prenom: string;

  @Column({ type: 'varchar', length: 100 })
  nom: string;

  @Index('IDX_utilisateur_telephone1', { unique: true })
  @Column({ type: 'varchar', length: 20 })
  telephone1: string;

  @Index('IDX_utilisateur_telephone2', { unique: true })
  @Column({ type: 'varchar', length: 20, nullable: true })
  telephone2: string | null;

  @Column({ name: 'adresse_residence', type: 'varchar', length: 255, nullable: true })
  adresseResidence: string | null;

  @Column({ name: 'nom_contact_urgence', type: 'varchar', length: 200, nullable: true })
  nomContactUrgence: string | null;

  @Column({ name: 'tel_contact_urgence', type: 'varchar', length: 20, nullable: true })
  telContactUrgence: string | null;

  @Column({ name: 'numero_mobile_money', type: 'varchar', length: 20, nullable: true })
  numeroMobileMoney: string | null;

  @Column({ name: 'numero_orange_money', type: 'varchar', length: 20, nullable: true })
  numeroOrangeMoney: string | null;

  @Column({ name: 'date_inscription', type: 'date', default: () => 'CURRENT_DATE' })
  dateInscription: Date;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({ name: 'doit_changer_mot_de_passe', type: 'boolean', default: true })
  doitChangerMotDePasse: boolean;

  @Column({ name: 'mot_de_passe_modifie_le', type: 'timestamp', nullable: true })
  motDePasseModifieLe: Date | null;

  @Column({ name: 'est_super_admin', type: 'boolean', default: false })
  estSuperAdmin: boolean;

  @Column({ name: 'langue_preferee_id', type: 'uuid', nullable: true })
  languePrefereeId: string | null;

  @ManyToOne(() => Langue, (langue) => langue.utilisateurs)
  @JoinColumn({ name: 'langue_preferee_id' })
  languePreferee: Langue | null;

  @CreateDateColumn({ name: 'cree_le', type: 'timestamp' })
  creeLe: Date;

  @UpdateDateColumn({ name: 'modifie_le', type: 'timestamp', nullable: true })
  modifieLe: Date | null;

  @DeleteDateColumn({ name: 'supprime_le', type: 'timestamp', nullable: true })
  supprimeLe: Date | null;

  @OneToMany(() => AdhesionTontine, (adhesion) => adhesion.utilisateur)
  adhesions: AdhesionTontine[];

  @OneToMany(() => SessionUtilisateur, (session) => session.utilisateur)
  sessions: SessionUtilisateur[];

  @OneToMany(() => TentativeConnexion, (tentative) => tentative.utilisateur)
  tentativesConnexion: TentativeConnexion[];

  get nomComplet(): string {
    return `${this.prenom} ${this.nom}`;
  }
}
