
import { DataSource } from 'typeorm';
import { Reunion } from '../modules/reunions/entities/reunion.entity';
import { CotisationDueMensuelle } from '../modules/transactions/entities/cotisation-due-mensuelle.entity';
import { config } from 'dotenv';
import { join } from 'path';

config({ path: join(__dirname, '../../.env') });

const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [join(__dirname, '../modules/**/*.entity.ts')],
  synchronize: false,
  logging: false,
});

async function run() {
  await AppDataSource.initialize();
  
  const reunions = await AppDataSource.getRepository(Reunion).find();
  console.log('--- REUNIONS ---');
  reunions.forEach(r => console.log(`${r.numeroReunion}: ${r.id} - ${r.dateReunion} (${r.statut})`));

  const cotisations = await AppDataSource.getRepository(CotisationDueMensuelle).find();
  console.log('--- COTISATIONS ---');
  cotisations.forEach(c => console.log(`Reunion: ${c.reunionId} | Membre: ${c.exerciceMembreId} | Amount: ${c.montantPaye}`));

  await AppDataSource.destroy();
}

run();
