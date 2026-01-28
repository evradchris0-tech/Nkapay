/**
 * Configuration TypeORM pour la connexion a la base de donnees MySQL
 * Gere la configuration du pool de connexions et les options specifiques MySQL
 */

import { DataSource, DataSourceOptions } from 'typeorm';
import { env, isDevelopment } from './env.config';
import path from 'path';

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

  // Chemins des entites, migrations et subscribers
  entities: [path.join(__dirname, '../modules/**/entities/*.entity{.ts,.js}')],
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
