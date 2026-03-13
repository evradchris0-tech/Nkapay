import { DataSource } from 'typeorm';
import { Reunion } from '../modules/reunions/entities/reunion.entity';
import { ExerciceMembre } from '../modules/exercices/entities/exercice-membre.entity';
import { CotisationDueMensuelle } from '../modules/transactions/entities/cotisation-due-mensuelle.entity';
import {
  Distribution,
  StatutDistribution,
} from '../modules/distributions/entities/distribution.entity';
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
  logging: ['error'], // Minimal logging
});

async function run() {
  try {
    await AppDataSource.initialize();
    console.log('Database connected.');

    const reunionRepo = AppDataSource.getRepository(Reunion);
    const membreRepo = AppDataSource.getRepository(ExerciceMembre);
    const cotisRepo = AppDataSource.getRepository(CotisationDueMensuelle);
    const distRepo = AppDataSource.getRepository(Distribution);

    // 1. Find the current Open Reunion (Reunion #1)
    const reunion = await reunionRepo.findOne({
      where: { statut: 'OUVERTE' as any }, // Typing workaround
      relations: ['exercice'],
    });

    if (!reunion) {
      console.log('No open reunion found.');
      return;
    }
    console.log(`Processing Reunion: ${reunion.dateReunion} (${reunion.statut})`);

    // 2. Calculate Total Capital (Sum of Cotisations for this reunion)
    // In a real scenario, we check who PAID. For simulation, assuming full pot.
    const cotisations = await cotisRepo.find({
      where: { reunionId: reunion.id },
    });

    const totalCapital = cotisations.reduce((sum, c) => sum + Number(c.montantPaye), 0);
    console.log(`Total Cotisations (Capital) to distribute: ${totalCapital}`);

    if (totalCapital === 0) {
      console.log('No cotisations found/paid? Checking defaults...');
      // If 0, maybe we rely on dues not being generated yet?
      // But previous steps generated them. We'll proceed with 0 check or hardcode if needed for test.
      if (cotisations.length === 0) console.log('WARNING: No cotisations found for this reunion.');
    }

    // 3. Select Beneficiary (Member 1)
    // We need to pick someone who hasn't "eaten" yet. Since it's Reunion 1, anyone starts.
    // Let's sort by entry or ID.
    const membres = await membreRepo.find({
      where: { exerciceId: reunion.exerciceId },
      order: { creeLe: 'ASC' },
      relations: ['adhesionTontine', 'adhesionTontine.utilisateur'],
    });

    if (membres.length === 0) {
      console.log('No members found.');
      return;
    }

    const beneficiary = membres[0]; // First member gets the first pot
    console.log(
      `Beneficiary: ${beneficiary.adhesionTontine.utilisateur.nom} ${beneficiary.adhesionTontine.utilisateur.prenom}`
    );

    // Check if distribution already exists
    const existingdist = await distRepo.findOne({
      where: { reunionId: reunion.id },
    });

    if (existingdist) {
      console.log('Distribution already exists for this reunion.');
    } else {
      // 4. Create Distribution
      const distribution = new Distribution();
      distribution.reunion = reunion;
      distribution.exerciceMembreBeneficiaire = beneficiary;
      distribution.ordre = 1; // 1st distribution of the exercise? Or of the meeting?
      // If "ordre" is unique per reunion, then 1 is fine.
      distribution.montantBrut = totalCapital;
      distribution.montantRetenu = 0;
      distribution.montantNet = totalCapital;
      distribution.statut = StatutDistribution.DISTRIBUEE;
      distribution.distribueeLe = new Date();
      distribution.commentaire = 'Bouffe Reunion #1 (Capital Cotisations)';

      await distRepo.save(distribution);
      console.log(`Distribution created: ${totalCapital} to Member ${beneficiary.id}`);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

run();
