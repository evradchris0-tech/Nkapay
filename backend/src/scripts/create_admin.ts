/**
 * Script pour créer un utilisateur admin de test
 * À exécuter avant d'utiliser Postman
 */

import { AppDataSource } from '../config/database.config';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';

async function createAdminUser() {
  await AppDataSource.initialize();
  console.log('✅ Connexion établie');

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();

  try {
    // Vérifier si l'utilisateur admin existe
    const [existingAdmin] = await queryRunner.query(
      `SELECT id, telephone1 FROM utilisateur WHERE telephone1 = '690000001' LIMIT 1`
    );

    if (existingAdmin) {
      console.log('✅ Utilisateur admin existe déjà:');
      console.log(`   Téléphone: 690000001`);
      console.log(`   ID: ${existingAdmin.id}`);
    } else {
      // Créer le mot de passe hashé
      const passwordHash = await bcrypt.hash('Admin123!', 10);
      const adminId = uuidv4();

      await queryRunner.query(
        `
        INSERT INTO utilisateur (id, nom, prenom, telephone1, password_hash, est_super_admin, doit_changer_mot_de_passe)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
        [adminId, 'ADMIN', 'Super', '690000001', passwordHash, true, false]
      );

      console.log('✅ Utilisateur admin créé:');
      console.log(`   Téléphone: 690000001`);
      console.log(`   Mot de passe: Admin123!`);
      console.log(`   ID: ${adminId}`);
    }

    // Afficher les types de tontines disponibles
    const tontineTypes = await queryRunner.query(`SELECT id, code, libelle FROM tontine_type`);
    console.log('\n📋 Types de tontines disponibles:');
    for (const t of tontineTypes) {
      console.log(`   - ${t.code}: ${t.id}`);
    }

    // Afficher les tontines existantes
    const tontines = await queryRunner.query(
      `SELECT id, nom_court, nom FROM tontine WHERE supprime_le IS NULL LIMIT 5`
    );
    console.log('\n📋 Tontines existantes:');
    for (const t of tontines) {
      console.log(`   - ${t.nom_court}: ${t.id}`);
    }
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await queryRunner.release();
    await AppDataSource.destroy();
  }
}

createAdminUser().catch(console.error);
