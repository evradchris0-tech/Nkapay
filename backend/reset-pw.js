const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

async function resetPassword() {
  const password = 'SuperAdmin@2025!';
  const hash = await bcrypt.hash(password, 10);
  
  console.log('Hash généré:', hash);
  
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'nkapay'
  });
  
  try {
    const [result] = await connection.execute(
      `UPDATE utilisateur SET password_hash = ?, doit_changer_mot_de_passe = FALSE WHERE telephone1 = ?`,
      [hash, '+237699999999']
    );
    
    console.log('Résultat:', result);
    console.log('✅ Mot de passe mis à jour!');
    console.log('Identifiant: +237699999999 ou 699999999');
    console.log('Mot de passe:', password);
  } finally {
    await connection.end();
  }
}

resetPassword().catch(console.error);
