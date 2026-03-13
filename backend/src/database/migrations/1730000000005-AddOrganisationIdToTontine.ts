import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey, TableIndex } from 'typeorm';

export class AddOrganisationIdToTontine1730000000005 implements MigrationInterface {
  name = 'AddOrganisationIdToTontine1730000000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Ajout nullable en premier (backfill dans migration 009)
    await queryRunner.addColumn(
      'tontine',
      new TableColumn({
        name: 'organisation_id',
        type: 'varchar',
        length: '36',
        isNullable: true,
      })
    );

    await queryRunner.createIndex(
      'tontine',
      new TableIndex({ name: 'IDX_tontine_organisation_id', columnNames: ['organisation_id'] })
    );

    await queryRunner.createForeignKey(
      'tontine',
      new TableForeignKey({
        name: 'FK_tontine_organisation',
        columnNames: ['organisation_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'organisation',
        onDelete: 'RESTRICT',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('tontine');
    if (table) {
      const fk = table.foreignKeys.find((f) => f.columnNames.includes('organisation_id'));
      if (fk) await queryRunner.dropForeignKey('tontine', fk);
    }
    await queryRunner.dropIndex('tontine', 'IDX_tontine_organisation_id');
    await queryRunner.dropColumn('tontine', 'organisation_id');
  }
}
