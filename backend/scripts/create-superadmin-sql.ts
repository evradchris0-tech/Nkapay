import 'dotenv/config';
import { AppDataSource } from '../src/config/database.config';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';

const TELEPHONE = process.env.SUPERADMIN_TELEPHONE || '+237699999999';
const PASSWORD = process.env.SUPERADMIN_PASSWORD || 'OMGBAFOUDa1!';

async function upsertSuperAdmin() {
  await AppDataSource.initialize();
  console.log('✔ AppDataSource initialized');

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();

  try {
    const rows: any[] = await queryRunner.query(
      `SELECT id, telephone1 FROM utilisateur WHERE telephone1 = ? LIMIT 1`,
      [TELEPHONE]
    );

    if (rows.length > 0) {
      const existing = rows[0];
      console.log('✔ Found existing utilisateur with telephone:', existing.telephone1);

      const passwordHash = await bcrypt.hash(PASSWORD, 10);
      await queryRunner.query(
        `UPDATE utilisateur SET password_hash = ?, est_super_admin = ?, doit_changer_mot_de_passe = ? WHERE id = ?`,
        [passwordHash, 1, 0, existing.id]
      );

      console.log('✔ Updated existing utilisateur to superadmin (id:', existing.id, ')');
    } else {
      // check if any superadmin exists
      const [existingSuper] = await queryRunner.query(`SELECT id, telephone1 FROM utilisateur WHERE est_super_admin = 1 LIMIT 1`);
      if (existingSuper) {
        console.log('⚠ A superadmin already exists:', existingSuper.telephone1, '(not creating new)');
      } else {
        const passwordHash = await bcrypt.hash(PASSWORD, 10);
        const id = uuidv4();
        await queryRunner.query(
          `INSERT INTO utilisateur (id, nom, prenom, telephone1, password_hash, est_super_admin, doit_changer_mot_de_passe, date_inscription) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [id, 'Admin', 'Super', TELEPHONE, passwordHash, 1, 0, new Date()]
        );
        console.log('✔ Created new superadmin with telephone:', TELEPHONE, 'id:', id);
      }
    }

    await queryRunner.release();
    await AppDataSource.destroy();

    console.log('\nDone. Credentials:');
    console.log('  telephone:', TELEPHONE);
    console.log('  password :', PASSWORD);
  } catch (err) {
    console.error('Error creating/updating superadmin via SQL:', err);
    try { await queryRunner.release(); } catch(e){}
    await AppDataSource.destroy();
    process.exit(1);
  }
}

upsertSuperAdmin().catch(err => {
  console.error(err);
  process.exit(1);
});
