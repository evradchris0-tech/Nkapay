/**
 * Point d'entrée pour l'exécution des seeders
 * Exécute les scripts de population de données de référence + données de développement
 */

import { AppDataSource, initializeDatabase, closeDatabase } from '../../config';
import { logger } from '../../shared/utils/logger.util';
import { seedRuleDefinitions } from './rule-definition.seeder';
import { seedTypeEvenementSecours } from './type-evenement-secours.seeder';
import { runDatabaseSeeder } from './database-seeder';

async function runSeeds(): Promise<void> {
  try {
    logger.info('Initialisation de la connexion pour les seeders...');
    await initializeDatabase();

    logger.info('Exécution des seeders de référence...');

    // 1. Seeders de données de référence (existants)
    await seedRuleDefinitions();
    await seedTypeEvenementSecours(AppDataSource);

    // 2. Seeder complet de développement (données mock)
    logger.info('Exécution du seeder de développement complet...');
    await runDatabaseSeeder(AppDataSource);

    logger.info('Tous les seeders exécutés avec succès !');
  } catch (error) {
    logger.error("Erreur lors de l'exécution des seeders:", error);
    throw error;
  } finally {
    await closeDatabase();
  }
}

// Exécution si appelé directement
runSeeds()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
