/**
 * Point d'entree pour l'execution des seeders
 * Execute les scripts de population de donnees de reference
 */

import { AppDataSource, initializeDatabase, closeDatabase } from '../../config';
import { logger } from '../../shared/utils/logger.util';
import { seedRuleDefinitions } from './rule-definition.seeder';
import { seedTypeEvenementSecours } from './type-evenement-secours.seeder';

async function runSeeds(): Promise<void> {
  try {
    logger.info('Initialisation de la connexion pour les seeders...');
    await initializeDatabase();

    logger.info('Execution des seeders...');

    // Les seeders seront ajoutes ici au fur et a mesure
    // await seedLangues();
    // await seedTontineTypes();
    // await seedTontineTypes();
    await seedRuleDefinitions();
    await seedTypeEvenementSecours(AppDataSource);
    // await seedTypePenalite();

    logger.info('Seeders executes avec succes');
  } catch (error) {
    logger.error('Erreur lors de l\'execution des seeders:', error);
    throw error;
  } finally {
    await closeDatabase();
  }
}

// Execution si appele directement
runSeeds()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
