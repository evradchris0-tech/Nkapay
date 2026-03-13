import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreatePlanAbonnement1730000000001 implements MigrationInterface {
  name = 'CreatePlanAbonnement1730000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'plan_abonnement',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: '(UUID())',
          },
          {
            name: 'code',
            type: 'varchar',
            length: '50',
            isUnique: true,
          },
          {
            name: 'libelle',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'prix_mensuel',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: '0.00',
          },
          {
            name: 'prix_annuel',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'max_tontines',
            type: 'smallint',
            default: '1',
            comment: '-1 = illimité',
          },
          {
            name: 'max_membres_par_tontine',
            type: 'smallint',
            default: '50',
            comment: '-1 = illimité',
          },
          {
            name: 'max_exercices_par_tontine',
            type: 'smallint',
            default: '5',
            comment: '-1 = illimité',
          },
          {
            name: 'fonctionnalites',
            type: 'json',
            isNullable: true,
            comment: 'Ex: {"exports": true, "mobile_money": false}',
          },
          {
            name: 'est_actif',
            type: 'boolean',
            default: true,
          },
          {
            name: 'cree_le',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'modifie_le',
            type: 'timestamp',
            isNullable: true,
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // Seed des plans de base
    await queryRunner.query(`
      INSERT INTO plan_abonnement (id, code, libelle, description, prix_mensuel, prix_annuel, max_tontines, max_membres_par_tontine, max_exercices_par_tontine, fonctionnalites)
      VALUES
        (UUID(), 'FREE',       'Gratuit',     'Plan gratuit pour découvrir Nkapay',      0.00,    NULL,    1,   20,  2, '{"exports": false, "mobile_money": false, "api_access": false}'),
        (UUID(), 'STARTER',    'Starter',     'Pour les petites tontines',               2500.00, 25000.00, 3,  100, 5, '{"exports": true,  "mobile_money": false, "api_access": false}'),
        (UUID(), 'PRO',        'Pro',         'Pour les tontines actives',               5000.00, 50000.00, 10, -1,  -1,'{"exports": true,  "mobile_money": true,  "api_access": false}'),
        (UUID(), 'ENTERPRISE', 'Entreprise',  'Pour les gestionnaires multi-tontines',   0.00,    NULL,    -1,  -1,  -1,'{"exports": true,  "mobile_money": true,  "api_access": true}'),
        (UUID(), 'LEGACY',     'Héritage',    'Plan pour données migrées',               0.00,    NULL,    -1,  -1,  -1,'{"exports": true,  "mobile_money": true,  "api_access": true}')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('plan_abonnement');
  }
}
