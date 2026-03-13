import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateOrganisation1730000000002 implements MigrationInterface {
  name = 'CreateOrganisation1730000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'organisation',
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
            name: 'nom',
            type: 'varchar',
            length: '200',
          },
          {
            name: 'slug',
            type: 'varchar',
            length: '100',
            isUnique: true,
            comment: 'Identifiant URL-safe unique (ex: amicale-des-lions)',
          },
          {
            name: 'email_contact',
            type: 'varchar',
            length: '255',
            isUnique: true,
          },
          {
            name: 'telephone_contact',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'pays',
            type: 'varchar',
            length: '3',
            default: "'CM'",
            comment: 'ISO 3166-1 alpha-3',
          },
          {
            name: 'devise',
            type: 'varchar',
            length: '3',
            default: "'XAF'",
            comment: 'ISO 4217',
          },
          {
            name: 'fuseau_horaire',
            type: 'varchar',
            length: '50',
            default: "'Africa/Douala'",
          },
          {
            name: 'logo',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'statut',
            type: 'enum',
            enum: ['ACTIVE', 'SUSPENDUE', 'RESILIEE'],
            default: "'ACTIVE'",
          },
          {
            name: 'plan_abonnement_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'abonnement_debut_le',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'abonnement_fin_le',
            type: 'date',
            isNullable: true,
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
          {
            name: 'supprime_le',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true
    );

    await queryRunner.createIndex(
      'organisation',
      new TableIndex({ name: 'IDX_organisation_statut', columnNames: ['statut'] })
    );

    await queryRunner.createForeignKey(
      'organisation',
      new TableForeignKey({
        name: 'FK_organisation_plan_abonnement',
        columnNames: ['plan_abonnement_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'plan_abonnement',
        onDelete: 'SET NULL',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('organisation');
    if (table) {
      const fk = table.foreignKeys.find((f) => f.columnNames.includes('plan_abonnement_id'));
      if (fk) await queryRunner.dropForeignKey('organisation', fk);
    }
    await queryRunner.dropTable('organisation');
  }
}
