import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateRegleOrganisation1730000000008 implements MigrationInterface {
  name = 'CreateRegleOrganisation1730000000008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'regle_organisation',
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
            name: 'organisation_id',
            type: 'varchar',
            length: '36',
          },
          {
            name: 'rule_definition_id',
            type: 'varchar',
            length: '36',
          },
          {
            name: 'valeur',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'est_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'modifie_par_membre_organisation_id',
            type: 'varchar',
            length: '36',
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
        ],
        uniques: [
          {
            name: 'UQ_regle_organisation_unique',
            columnNames: ['organisation_id', 'rule_definition_id'],
          },
        ],
      }),
      true
    );

    await queryRunner.createIndex(
      'regle_organisation',
      new TableIndex({ name: 'IDX_regle_organisation_org_id', columnNames: ['organisation_id'] })
    );

    await queryRunner.createForeignKey(
      'regle_organisation',
      new TableForeignKey({
        name: 'FK_regle_organisation_organisation',
        columnNames: ['organisation_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'organisation',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'regle_organisation',
      new TableForeignKey({
        name: 'FK_regle_organisation_rule_definition',
        columnNames: ['rule_definition_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'rule_definition',
        onDelete: 'RESTRICT',
      })
    );

    await queryRunner.createForeignKey(
      'regle_organisation',
      new TableForeignKey({
        name: 'FK_regle_organisation_modifie_par',
        columnNames: ['modifie_par_membre_organisation_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'membre_organisation',
        onDelete: 'SET NULL',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('regle_organisation');
  }
}
