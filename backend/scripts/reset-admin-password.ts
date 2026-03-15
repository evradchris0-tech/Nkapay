import { AppDataSource } from '../src/config/database.config';
import { Utilisateur } from '../src/modules/utilisateurs/entities/utilisateur.entity';
import { hashPassword } from '../src/modules/auth/utils/password.util';

async function resetAdminPassword() {
  try {
    await AppDataSource.initialize();
    console.log('Connexion à la base de données établie');

    const utilisateurRepository = AppDataSource.getRepository(Utilisateur);
    
    const admin = await utilisateurRepository.findOne({
      where: { telephone1: '+237699999999' }
    });

    if (!admin) {
      console.log('Admin non trouvé!');
      process.exit(1);
    }

    console.log('Admin trouvé:', admin.id);
    
    const newPassword = 'SuperAdmin@2025!';
    const newHash = await hashPassword(newPassword);
    
    admin.passwordHash = newHash;
    admin.doitChangerMotDePasse = false;
    
    await utilisateurRepository.save(admin);
    
    console.log('✅ Mot de passe mis à jour avec succès!');
    console.log('Identifiant:', '+237699999999');
    console.log('Mot de passe:', newPassword);
    
    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  }
}

resetAdminPassword();
