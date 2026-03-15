/**
 * Script de création du super administrateur
 * Crée un superadmin au démarrage s'il n'existe pas déjà
 */

import { AppDataSource } from '../config/database.config';
import { Utilisateur } from '../modules/utilisateurs/entities/utilisateur.entity';
import { hashPassword } from '../modules/auth/utils/password.util';
import { logger } from '../shared';

interface SuperAdminConfig {
  prenom: string;
  nom: string;
  telephone1: string;
  password: string;
}

/**
 * Configuration par défaut du superadmin
 * Peut être surchargée par les variables d'environnement
 */
function getSuperAdminConfig(): SuperAdminConfig {
  return {
    prenom: process.env.SUPERADMIN_PRENOM || 'Super',
    nom: process.env.SUPERADMIN_NOM || 'Admin',
    telephone1: process.env.SUPERADMIN_TELEPHONE || '+237699999999',
    password: process.env.SUPERADMIN_PASSWORD || 'SuperAdmin@2025!',
  };
}

/**
 * Crée ou met à jour le super administrateur
 */
export async function seedSuperAdmin(): Promise<void> {
  try {
    const utilisateurRepository = AppDataSource.getRepository(Utilisateur);
    const config = getSuperAdminConfig();

    // Vérifier s'il existe déjà un superadmin avec ce numéro de téléphone
    let superAdmin = await utilisateurRepository.findOne({
      where: { telephone1: config.telephone1 },
    });

    if (superAdmin) {
      if (superAdmin.estSuperAdmin) {
        // Le superadmin existe deja et a deja le role — ne PAS ecraser son mot de passe
        // (l'admin a peut-etre change son mot de passe via l'application)
        logger.info('Super administrateur existant trouvé, aucune modification nécessaire', {
          id: superAdmin.id,
          telephone: config.telephone1,
        });
        return;
      }

      // Mettre à jour pour devenir superadmin (cas rare: l'utilisateur existe mais n'est pas admin)
      superAdmin.estSuperAdmin = true;
      await utilisateurRepository.save(superAdmin);
      logger.info('Utilisateur existant promu super administrateur', {
        id: superAdmin.id,
        telephone: config.telephone1,
      });
      return;
    }

    // Vérifier s'il existe un autre superadmin
    const existingSuperAdmin = await utilisateurRepository.findOne({
      where: { estSuperAdmin: true },
    });

    if (existingSuperAdmin) {
      logger.info('Un super administrateur existe déjà', {
        id: existingSuperAdmin.id,
        telephone: existingSuperAdmin.telephone1,
      });
      return;
    }

    // Créer le super administrateur
    const passwordHash = await hashPassword(config.password);

    const newSuperAdmin = utilisateurRepository.create({
      prenom: config.prenom,
      nom: config.nom,
      telephone1: config.telephone1,
      passwordHash,
      estSuperAdmin: true,
      doitChangerMotDePasse: true, // Forcer le changement de mot de passe à la première connexion
      dateInscription: new Date(),
    });

    await utilisateurRepository.save(newSuperAdmin);

    logger.info('Super administrateur créé avec succès', {
      id: newSuperAdmin.id,
      telephone: config.telephone1,
      nom: `${config.prenom} ${config.nom}`,
    });

    // Afficher les informations de connexion en développement
    if (process.env.NODE_ENV !== 'production') {
      logger.info('='.repeat(50));
      logger.info('CREDENTIALS SUPERADMIN (mode développement uniquement)');
      logger.info(`Téléphone: ${config.telephone1}`);
      logger.info(`Mot de passe: ${config.password}`);
      logger.info('='.repeat(50));
    }
  } catch (error) {
    logger.error('Erreur lors de la création du super administrateur', error);
    throw error;
  }
}
