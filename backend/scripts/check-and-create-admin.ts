/**
 * Script pour vérifier et créer un super admin
 */

import { AppDataSource } from '../src/config/database.config';
import { Utilisateur } from '../src/modules/utilisateurs/entities/utilisateur.entity';
import * as bcrypt from 'bcrypt';

async function checkAndCreateAdmin() {
  try {
    console.log('🔌 Connexion à la base de données...');
    await AppDataSource.initialize();
    console.log('✅ Connecté à la base de données\n');

    const utilisateurRepository = AppDataSource.getRepository(Utilisateur);

    // Vérifier tous les super admins
    console.log('🔍 Recherche des super admins...');
    const superAdmins = await utilisateurRepository.find({
      where: { estSuperAdmin: true },
    });

    if (superAdmins.length > 0) {
      console.log(`\n✅ ${superAdmins.length} super admin(s) trouvé(s):\n`);
      
      for (const admin of superAdmins) {
        console.log('─────────────────────────────────────');
        console.log(`ID: ${admin.id}`);
        console.log(`Nom: ${admin.prenom} ${admin.nom}`);
        console.log(`Téléphone 1: ${admin.telephone1}`);
        console.log(`Téléphone 2: ${admin.telephone2 || 'N/A'}`);
        console.log(`Date inscription: ${admin.dateInscription}`);
        console.log(`Doit changer mot de passe: ${admin.doitChangerMotDePasse}`);
        console.log('─────────────────────────────────────\n');
      }

      // Créer un nouveau mot de passe pour le premier admin
      const firstAdmin = superAdmins[0];
      const newPassword = 'Admin@2025!';
      const passwordHash = await bcrypt.hash(newPassword, 10);
      
      firstAdmin.passwordHash = passwordHash;
      firstAdmin.doitChangerMotDePasse = false;
      await utilisateurRepository.save(firstAdmin);

      console.log('🔑 IDENTIFIANTS DE CONNEXION:');
      console.log('════════════════════════════════════════');
      console.log(`Téléphone: ${firstAdmin.telephone1}`);
      console.log(`Mot de passe: ${newPassword}`);
      console.log('════════════════════════════════════════\n');
      console.log('✅ Mot de passe réinitialisé avec succès!\n');

    } else {
      console.log('❌ Aucun super admin trouvé. Création...\n');

      const password = 'Admin@2025!';
      const passwordHash = await bcrypt.hash(password, 10);

      const newAdmin = utilisateurRepository.create({
        prenom: 'Super',
        nom: 'Admin',
        telephone1: '+237690000001',
        passwordHash,
        estSuperAdmin: true,
        doitChangerMotDePasse: false,
        dateInscription: new Date(),
      });

      await utilisateurRepository.save(newAdmin);

      console.log('🔑 SUPER ADMIN CRÉÉ:');
      console.log('════════════════════════════════════════');
      console.log(`Téléphone: ${newAdmin.telephone1}`);
      console.log(`Mot de passe: ${password}`);
      console.log('════════════════════════════════════════\n');
      console.log('✅ Super admin créé avec succès!\n');
    }

    // Afficher la structure de la table
    console.log('📋 STRUCTURE DE LA TABLE utilisateur:');
    const metadata = AppDataSource.getMetadata(Utilisateur);
    console.log('Colonnes:');
    metadata.columns.forEach(col => {
      console.log(`  - ${col.propertyName} (${col.databaseName}): ${col.type}`);
    });

    await AppDataSource.destroy();
    console.log('\n✅ Script terminé avec succès!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

checkAndCreateAdmin();
