/**
 * Script pour générer un hash bcrypt pour le super admin
 * Usage: node scripts/generate-admin-hash.js
 */

const bcrypt = require('bcrypt');

const password = 'Admin@2025!';
const saltRounds = 10;

console.log('🔐 Génération du hash bcrypt...\n');

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('❌ Erreur:', err);
    process.exit(1);
  }

  console.log('✅ Hash généré avec succès!\n');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('INFORMATIONS DE CONNEXION:');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('Téléphone: +237690000001');
  console.log('Mot de passe:', password);
  console.log('═══════════════════════════════════════════════════════════\n');
  
  console.log('📋 REQUÊTE SQL À EXÉCUTER DANS MYSQL:\n');
  console.log('-- Vérifier les utilisateurs existants');
  console.log('SELECT id, prenom, nom, telephone1, est_super_admin FROM utilisateur;\n');
  
  console.log('-- Créer un nouveau super admin');
  console.log(`INSERT INTO utilisateur (
    id,
    prenom,
    nom,
    telephone1,
    password_hash,
    est_super_admin,
    doit_changer_mot_de_passe,
    date_inscription,
    cree_le
) VALUES (
    UUID(),
    'Super',
    'Admin',
    '+237690000001',
    '${hash}',
    TRUE,
    FALSE,
    CURDATE(),
    NOW()
);\n`);

  console.log('-- OU mettre à jour un utilisateur existant');
  console.log(`UPDATE utilisateur 
SET 
    password_hash = '${hash}',
    est_super_admin = TRUE,
    doit_changer_mot_de_passe = FALSE
WHERE telephone1 = '+237699999999';\n`);

  console.log('═══════════════════════════════════════════════════════════\n');
});
