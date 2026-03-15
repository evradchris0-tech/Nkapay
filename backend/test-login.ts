import { AppDataSource } from './src/config/database.config';
import { Utilisateur } from './src/modules/utilisateurs/entities/utilisateur.entity';
import { verifyPassword, hashPassword } from './src/modules/auth/utils/password.util';

async function testLogin() {
  console.log('Initialisation de la base de données...');
  await AppDataSource.initialize();
  
  const repo = AppDataSource.getRepository(Utilisateur);
  const user = await repo.findOne({ where: { telephone1: '+237699999999' } });
  
  if (!user) {
    console.log('Utilisateur non trouvé!');
    process.exit(1);
  }
  
  console.log('Utilisateur trouvé:', user.prenom, user.nom);
  console.log('Hash actuel:', user.passwordHash);
  console.log('Hash length:', user.passwordHash?.length);
  
  console.log('\nTest de vérification du mot de passe...');
  const password = 'SuperAdmin@2025!';
  
  try {
    console.log('Début de verifyPassword...');
    const start = Date.now();
    const result = await verifyPassword(password, user.passwordHash);
    const duration = Date.now() - start;
    console.log(`Résultat: ${result} (${duration}ms)`);
  } catch (err) {
    console.error('Erreur lors de la vérification:', err);
  }
  
  // Test de hash direct
  console.log('\nTest de hashage...');
  const newHash = await hashPassword(password);
  console.log('Nouveau hash:', newHash);
  
  await AppDataSource.destroy();
  process.exit(0);
}

testLogin().catch(err => {
  console.error('Erreur:', err);
  process.exit(1);
});
