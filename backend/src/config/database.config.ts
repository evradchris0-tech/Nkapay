/**
 * Configuration TypeORM pour la connexion a la base de donnees MySQL
 * Gere la configuration du pool de connexions et les options specifiques MySQL
 */

import { DataSource, DataSourceOptions } from 'typeorm';
import { env, isDevelopment } from './env.config';
import path from 'path';

// ─── Imports explicites de toutes les entités ────────────────────────────────
// (Les globs TypeORM ne fonctionnent pas de manière fiable avec ts-node sur Windows)
import { DemandeAdhesion } from '../modules/adhesions/entities/demande-adhesion.entity';
import { SessionUtilisateur } from '../modules/auth/entities/session-utilisateur.entity';
import { TentativeConnexion } from '../modules/auth/entities/tentative-connexion.entity';
import { Distribution } from '../modules/distributions/entities/distribution.entity';
import { Cassation } from '../modules/exercices/entities/cassation.entity';
import { ExerciceMembre } from '../modules/exercices/entities/exercice-membre.entity';
import { Exercice } from '../modules/exercices/entities/exercice.entity';
import { HistoriqueRegleExercice } from '../modules/exercices/entities/historique-regle-exercice.entity';
import { RegleExercice } from '../modules/exercices/entities/regle-exercice.entity';
import { Penalite } from '../modules/penalites/entities/penalite.entity';
import { TypePenalite } from '../modules/penalites/entities/type-penalite.entity';
import { Pret } from '../modules/prets/entities/pret.entity';
import { RemboursementPret } from '../modules/prets/entities/remboursement-pret.entity';
import { PresenceReunion } from '../modules/reunions/entities/presence-reunion.entity';
import { Reunion } from '../modules/reunions/entities/reunion.entity';
import { BilanSecoursExercice } from '../modules/secours/entities/bilan-secours-exercice.entity';
import { EvenementSecours } from '../modules/secours/entities/evenement-secours.entity';
import { PieceJustificativeSecours } from '../modules/secours/entities/piece-justificative-secours.entity';
import { SecoursDuAnnuel } from '../modules/secours/entities/secours-du-annuel.entity';
import { TypeEvenementSecours } from '../modules/secours/entities/type-evenement-secours.entity';
import { AdhesionTontine } from '../modules/tontines/entities/adhesion-tontine.entity';
import { RegleTontine } from '../modules/tontines/entities/regle-tontine.entity';
import { RuleDefinition } from '../modules/tontines/entities/rule-definition.entity';
import { TontineType } from '../modules/tontines/entities/tontine-type.entity';
import { Tontine } from '../modules/tontines/entities/tontine.entity';
import { CotisationDueMensuelle } from '../modules/transactions/entities/cotisation-due-mensuelle.entity';
import { EpargneDueMensuelle } from '../modules/transactions/entities/epargne-due-mensuelle.entity';
import { InscriptionDueExercice } from '../modules/transactions/entities/inscription-due-exercice.entity';
import { OperateurPaiement } from '../modules/transactions/entities/operateur-paiement.entity';
import { PaiementMobile } from '../modules/transactions/entities/paiement-mobile.entity';
import { PotDuMensuel } from '../modules/transactions/entities/pot-du-mensuel.entity';
import { Projet } from '../modules/transactions/entities/projet.entity';
import { Transaction } from '../modules/transactions/entities/transaction.entity';
import { Langue } from '../modules/utilisateurs/entities/langue.entity';
import { Utilisateur } from '../modules/utilisateurs/entities/utilisateur.entity';
import { PlanAbonnement } from '../modules/organisations/entities/plan-abonnement.entity';
import { Organisation } from '../modules/organisations/entities/organisation.entity';
import { MembreOrganisation } from '../modules/organisations/entities/membre-organisation.entity';
import { InvitationOrganisation } from '../modules/organisations/entities/invitation-organisation.entity';
import { RegleOrganisation } from '../modules/organisations/entities/regle-organisation.entity';

const allEntities = [
  DemandeAdhesion,
  SessionUtilisateur,
  TentativeConnexion,
  Distribution,
  Cassation,
  ExerciceMembre,
  Exercice,
  HistoriqueRegleExercice,
  RegleExercice,
  Penalite,
  TypePenalite,
  Pret,
  RemboursementPret,
  PresenceReunion,
  Reunion,
  BilanSecoursExercice,
  EvenementSecours,
  PieceJustificativeSecours,
  SecoursDuAnnuel,
  TypeEvenementSecours,
  AdhesionTontine,
  RegleTontine,
  RuleDefinition,
  TontineType,
  Tontine,
  CotisationDueMensuelle,
  EpargneDueMensuelle,
  InscriptionDueExercice,
  OperateurPaiement,
  PaiementMobile,
  PotDuMensuel,
  Projet,
  Transaction,
  Langue,
  Utilisateur,
  PlanAbonnement,
  Organisation,
  MembreOrganisation,
  InvitationOrganisation,
  RegleOrganisation,
];

const baseConfig: DataSourceOptions = {
  type: 'mysql',
  host: env.db.host,
  port: env.db.port,
  username: env.db.username,
  password: env.db.password,
  database: env.db.database,
  charset: 'utf8mb4',

  // Configuration du pool de connexions
  extra: {
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0,
  },

  // Options de synchronisation et logging
  synchronize: env.db.synchronize,
  logging: env.db.logging,

  // Entités importées explicitement (40 entités)
  entities: allEntities,
  migrations: [path.join(__dirname, '../database/migrations/*{.ts,.js}')],
  subscribers: [path.join(__dirname, '../modules/**/subscribers/*.subscriber{.ts,.js}')],

  // Options specifiques au mode developpement
  ...(isDevelopment && {
    logger: 'advanced-console',
    maxQueryExecutionTime: 1000,
  }),
};

export const AppDataSource = new DataSource(baseConfig);

/**
 * Initialise la connexion a la base de donnees
 * A appeler au demarrage de l'application
 */
export async function initializeDatabase(): Promise<DataSource> {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    return AppDataSource;
  } catch (error) {
    throw new Error(`Echec de connexion a la base de donnees: ${error}`);
  }
}

/**
 * Ferme proprement la connexion a la base de donnees
 * A appeler lors de l'arret de l'application
 */
export async function closeDatabase(): Promise<void> {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
}
